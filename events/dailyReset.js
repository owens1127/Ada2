const fs = require('node:fs');
const sharp = require('sharp');
const fetch = require('node-fetch-commonjs');
const { EmbedBuilder, Collection } = require('discord.js');
const { bungieMembersToMentionable } = require('../database/users.js');
const { getInfoByGuilds } = require('../database/guilds.js');
const { modEnergyType, colorFromEnergy, adjustments, costs } = require('../bungie-net-api/util')
const { nextReset } = require('../misc/util.js');
const config = require('../config.json');

/** @type {Collection<string, Set<string>>} */
const peopleMissingMods = new Collection();
/** @type {Map<string, Promise<string>>}*/
const modIcons = new Map();

module.exports = {
    modToEmbed,
    name: 'dailyReset',
    on: true,
    async execute(client, resetListener) {
        console.log(`Daily reset for ${new Date().toDateString()}`);
        try {
            const adaSales = await import('../bungie-net-api/vendor.mjs')
                .then(({ getAdaCombatModsSaleDefinitons }) => getAdaCombatModsSaleDefinitons(true))
            console.log('Ada is selling...')
            console.log(adaSales)
            const guilds = await getInfoByGuilds(client);
            const modHashes = adaSales.map(sale => {
                storeImage(sale.inventoryDefinition, client)
                return sale.collectibleDefinition.hash
            });

            let errorCount = 0;
            const failures = [];
            const start = Date.now();
            await Promise.all(guilds.map(g => {
                if (!g.channel || !g.guild || !g.members) {
                    // no channel, guild, or error with members
                    errorCount++;
                } else {
                    return sendResetInfo(g, client, modHashes, adaSales).then(() => {
                        console.log(
                            `Sent info to ${g.guild.name} for ${g.clan?.name ?? 'N/A'}`);
                    }).catch((e) => {
                        console.log(
                            `Failed to send info to ${g.guild.name} for ${g.clan?.name ?? 'N/A'}`);
                        console.error(e.name);
                        failures.push(g)
                    });
                }
            }))
                .then(() => {
                    console.log(
                        `=====================`);
                    console.log(
                        `Sent info to ${guilds.length - failures.length
                        - errorCount} / ${guilds.length} servers`);
                    if (failures.length) {
                        console.log(
                            `Retrying to send reset info to ${failures.length} servers..`);
                        return retryFailures(failures, client, modHashes, adaSales).then(count => {
                            console.log(
                                `Sent info to ${count} / ${failures.length} servers on the second attempt.`)
                        });
                    }
                })
                .then(() => console.log(
                    `Finished in ${(Date.now() - start) / 1000} seconds (${(Date.now() - start)
                    / 1000 / guilds.length} seconds per guild)`))
                .then(updateMissingCache)
                .then(() => resetListener.emit('success'))
                .catch(e => {
                    console.log('UNCAUGHT EXCEPTION SENDING EMBEDS');
                    console.error(e);
                });
        } catch (e) {
            console.log('EMITTING FAILURE');
            console.error(e);
            resetListener.emit('failure', e);
        }
    }
};

/**
 *
 * @param {GuildInfoObject} guildInfo
 * @param client
 * @param {number[]} modHashes
 * @param {DefsTriple[]} modDefs
 * @return Promise<void>
 */
async function sendResetInfo(guildInfo, client, modHashes, modDefs) {
    const header = guildInfo.clan ?
        clanHeaderEmbed(guildInfo.clan, guildInfo.options.tips) :
        guildHeaderEmbed(guildInfo.guild, guildInfo.options.tips);
    // sometimes ada is a prick (often)
    if (!modHashes.length) {
        return guildInfo.channel.send({
            embeds: [header
                .setDescription('No Mods :(')]
        })
            .then(() => fs.writeFileSync('./local/mods.json', JSON.stringify({}, null, 2)));
    }

    const statuses = await membersModStatuses(modHashes, guildInfo.members);
    const modsInfo = modHashes.map(hash => {
        const def = modDefs.find(def => def.collectibleDefinition.hash === hash);
        const missing = [];
        const errors = [];
        statuses.forEach((mem, memId) => {
            if (mem.get(hash) === -1) {
                errors.push(memId);
            } else if (mem.get(hash) % 2 === 1) missing.push(memId);
        })
        return { def, missing, errors };
    });
    const people = new Collection(guildInfo.members.map(m => {
        return [m.membershipId, {
            membershipId: m.membershipId,
            name: m.name
        }]
    }));

    // mutates people, I know it's not ideal
    await bungieMembersToMentionable(people);
    /** @type Set<string> */
    const pings = new Set();
    /** @type {{[p: string]: DefsTriple}} */
    const mods = {}
    const embeds = [header,
        ...await Promise.all(modsInfo.map(async mod => {
            const users = people.filter(person => mod.missing.includes(person.membershipId))
                .map(person => {
                    // nothing is stopping people from linking multiple discords to the same bungie
                    // account
                    const { accounts } = person;
                    accounts?.forEach((acct) => {
                        // not everyone has a primary guild for now
                        if (acct.mentionable && (!acct.primary_guild || acct.primary_guild
                            === guildInfo.guild.id)) {
                            pings.add(
                                acct.discord);
                        }
                        if (!peopleMissingMods.has(acct.discord)) {
                            peopleMissingMods.set(
                                acct.discord, new Set());
                        }
                        peopleMissingMods.get(acct.discord)
                            .add(mod.def.inventoryDefinition.displayProperties.name);
                    });
                    if (accounts?.length) {
                        return person.name + ` [${accounts.map(a => `<@${a.discord}>`)
                            .join(', ')}]`;
                    } else {
                        return person.name;
                    }
                });

            mod.def.icon = await modIcons.get(mod.def.inventoryDefinition.hash + '.png');
            mods[mod.def.inventoryDefinition.hash] = mod.def;

            return modToEmbed(mod.def).then(embed => {
                embed.addFields({
                    name: 'Missing',
                    value: users.sort((a, b) => a.localeCompare(b)).join('\n') || 'Nobody :)',
                    inline: false
                })
                if (mod.errors.length) {
                    embed.addFields({
                        name: 'Errors',
                        value: mod.errors.join('\n'),
                        inline: false
                    })
                }
                return embed;
            });
        }))
    ];
    return guildInfo.channel.send({
        embeds
    }).then(() => {
        console.log({ embeds: embeds.length, pings });
        if (pings.size) {
            guildInfo.channel.send({
                content: [...pings]
                    .map(p => `<@${p}>`)
                    .join(', ')
            });
        }
    })
        .then(() => fs.writeFileSync('./local/mods.json', JSON.stringify(mods, null, 2)))

}

/**
 * @param {number[]} hashes
 * @param {DestinyMemberInfo[]} members
 * @return {Promise<Collection<string, Collection<string, number>>>}
 */
async function membersModStatuses(hashes, members) {
    return Promise.all(members.map(m => {
        return import('../bungie-net-api/profile.mjs')
            .then(({ missingMods }) => missingMods(hashes, m.membershipId, m.membershipType))
            .then(collectionOfHashes => [m.membershipId, collectionOfHashes]);
    })).then(pairs => new Collection(pairs));
}

/**
 * @param clan
 * @param tips
 * @return {EmbedBuilder}
 */
function clanHeaderEmbed(clan, tips) {
    return (tips ? headerEmbed(tips) : new EmbedBuilder())
        .setTitle(
            'Ada-1 Mods Today - Clan ' + clan.name + ` [${clan.clanInfo?.clanCallsign ?? ''}]`);
    // TODO Destiny2.GetClanBannerSource for the banner
    // clan.clanInfo.clanBannerData
}

/**
 * @param {Guild} guild
 * @param tips
 * @return {EmbedBuilder}
 */
function guildHeaderEmbed(guild, tips) {
    return (tips ? headerEmbed(tips).addFields({
        name: 'Register your clan!',
        value: 'List everyone in your clan who is missing the mod by linking your `/clan` (requires Manage Server permissions)',
        inline: false
    }) : headerEmbed(tips))
        .setTitle('Ada 1 Mods Today - Registered Users in ' + guild.name)
        .setThumbnail(guild.iconURL() || null);
}

/**
 * @param tips
 * @return {EmbedBuilder}
 */
function headerEmbed(tips) {
    const embed = new EmbedBuilder();
    if (tips) {
        embed.addFields({
            name: 'Combat-Style Mods',
            value: 'Missing a mod? Head to Ada-1 in the tower and go purchase it! '
                + 'Every day Ada has a small chance to sell powerful combat-style mods '
                + 'from previous seasons that are not otherwise acquirable.',
            inline: false
        }, {
            name: 'Never miss a mod!',
            value: 'Want to be pinged? `/register` with your Bungie Name and do `/mentions true` to never miss out when Ada is selling a mod you are missing! Further, you can do `/remindme` to set a time for the bot to DM you when you are missing a mod. To disable these tips, have an admin use `/options tips`',
            inline: false
        })
    }
    embed.setColor(config.color)
        .setFooter({
            text: 'Generated by Ada-2'
        })
        .setTimestamp()
    return embed;
}

/**
 *
 * @param {DestinyInventoryItemDefinition} def
 * @param client
 */
async function storeImage(def, client) {
    const name = def.hash + '.png';
    let overlayUrl;
    def.investmentStats.forEach(stat => {
        overlayUrl = modEnergyType(stat.statTypeHash) || overlayUrl;
    });
    const iconUrl = 'https://bungie.net' + def.displayProperties.icon
    modIcons.set(name, fetch(iconUrl)
        .then(res => res.buffer())
        .then(buff => {
            if (overlayUrl) {
                return sharp(buff)
                    .composite([{
                        input: '.' + overlayUrl
                    }])
                    .png()
                    .toBuffer()
            } else {
                return buff;
            }
        })
        .then(img => client.channels.fetch(config.images)
            .then(channel => channel.send({
                files: [{
                    attachment: img,
                    name,
                    description: 'A description of the file'
                }]
            })))
        .then(m => m.attachments.first().url)
        .catch(console.error));
}

function updateMissingCache() {
    const validTil = nextReset().getTime();
    const missing = Object.assign({},
        ...peopleMissingMods.mapValues(set => Array.from(set))
            .map((v, k) => ({ [k]: v })))
    const data = JSON.stringify({ validTil, missing }, null, 2);
    fs.writeFileSync('./local/reminders.json', data);
    // console.log(missing);
}

/**
 * @param { DefsTriple } def
 * @return Promise<EmbedBuilder>
 */
async function modToEmbed(def) {
    return new EmbedBuilder()
        .setTitle(def.inventoryDefinition.displayProperties.name)
        .setThumbnail(def.icon)
        .setColor(colorFromEnergy(def.inventoryDefinition.plug.energyCost.energyType))
        .setTimestamp(Date.now())
        .setURL(`https://www.light.gg/db/items/${def.inventoryDefinition.hash}/`)
        .addFields({
            name: def.inventoryDefinition.itemTypeDisplayName,
            value: [def.sandboxDefinition.displayProperties?.description,
                ...def.inventoryDefinition.tooltipNotifications.map(ttn => ttn.displayString),
                ...adjustments(def.inventoryDefinition.investmentStats),
                ...costs(def.inventoryDefinition.investmentStats)].join('\n\n'),
            inline: false
        })
}

/**
 *
 * @param list
 * @param client
 * @param modHashes
 * @param adaSales
 * @return {Promise<unknown>[]>}
 */
async function retryFailures(list, client, modHashes, adaSales) {
    let count = 0;
    return Promise.all(list.map(g => {
        if (!g.channel || !g.guild || !g.members) {
            // no channel or guild
        } else {
            return sendResetInfo(g, client, modHashes, adaSales).then(() => {
                console.log(`Sent info to ${g.guild.name} for clan ${g.clan?.name ?? 'N/A'}`);
                count++;
            }).catch(e => e); // do nothing
        }
    })).then(() => count);
}