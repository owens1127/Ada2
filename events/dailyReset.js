const fs = require('node:fs');
const sharp = require('sharp');
const fetch = require('node-fetch-commonjs');
const { EmbedBuilder } = require('discord.js');
const { bungieMembersToMentionable } = require('../database/users.js');
const { getInfoByGuilds } = require('../database/guilds.js');
const { modEnergyType, colorFromEnergy } = require('../bungie-net-api/util')
const { nextReset, asyncMapToObject } = require('../misc/util.js');
const config = require('../config.json');

/** @type {{[person: string]: string[]}} */
const peopleMissingMods = {}
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
                .then(({getAdaCombatModsSaleDefinitons}) => getAdaCombatModsSaleDefinitons(true))
            console.log('Ada is selling...')
            console.log(adaSales)
            const guilds = await getInfoByGuilds(client);
            const modHashes = adaSales.map(sale => {
                storeImage(sale.inventoryDefinition, client)
                return sale.collectibleDefinition.hash
            });
            const failures = [];
            await Promise.all(guilds.map(g => {
                if (!g.channel || !g.clan || !g.members || !g.guild) {
                    return failures.push(g);
                }
                return sendResetInfo(g, client, modHashes, adaSales).then(() => {
                    console.log(`Sent info to ${g.guild.name} for clan ${g.clan.name}`);
                });
            }))
                .then(() => { 
                    if (failures.length) {
                        console.error(`Failed to send reset info to ${failures.length} servers.`);
                        console.log(failures);
                    }
                })
                .then(updateMissingCache)
                .then(() => resetListener.emit('success'));
        } catch (e) {
            resetListener.emit('failure', e);
        }
    }
};

/**
 *
 * @param {GuildInfoObject} guildInfo
 * @param client
 * @param {number[]} modHashes
 * @param {{inventoryDefinition: DestinyInventoryItemDefinition, collectibleDefinition:
 *     DestinyCollectibleDefinition, sandboxDefinition:
 *     DestinySandboxPerkDefinition}[]} modDefs
 * @return Promise<void>
 */
async function sendResetInfo(guildInfo, client, modHashes, modDefs) {
    // sometimes ada is a prick (often)
    if (!modHashes.length) {
        guildInfo.channel.send({ embeds: [headerEmbed(guildInfo.clan.name).setDescription(':(')] });
        return;
    }
    const statuses = await membersModStatuses(modHashes, guildInfo.members.map(m => {
        return {
            membershipId: m.destinyUserInfo.membershipId,
            membershipType: m.destinyUserInfo.membershipType
        }
    }));
    const modsInfo = modHashes.map(hash => {
        const def = modDefs.find(def => def.collectibleDefinition.hash === hash);
        const missing = [];
        Object.keys(statuses).forEach(memId => {
            if (statuses[memId][hash] % 2 === 1) missing.push(memId);
        })
        return { def, missing };
    });
    const people = Object.assign({}, ...guildInfo.members.map((m) => {
        return {
            [m.destinyUserInfo.membershipId]: {
                // old accounts might not have a bungieGlobalDisplayName set up yet
                name: m.destinyUserInfo.bungieGlobalDisplayName || m.destinyUserInfo.displayName
            }
        }
    }));

    // mutates people, I know it's not ideal
    await bungieMembersToMentionable(people);
    /** @type Set<string> */
    const pings = new Set();
    /** @type {{[p: string]: DefsTriple}} */
    const mods = {}
    const embeds = [headerEmbed(guildInfo.clan),
        ...await Promise.all(modsInfo.map(async m => {
            const users = Object.keys(people).filter(kp => m.missing.includes(kp)).map(kp => {
                // nothing is stopping people from linking multiple discords to the same bungie account
                const { accounts } = people[kp];
                accounts?.forEach((acct) => {
                    if (acct.mentionable) pings.add(acct.discord);
                    if (!peopleMissingMods[acct.discord]) peopleMissingMods[acct.discord] = [];
                    peopleMissingMods[acct.discord].push(m.def.inventoryDefinition.displayProperties.name);
                });
                if (accounts?.length) {
                    return people[kp].name + ` [${accounts.map(a => `<@${a.discord}>`).join(', ')}]`;
                } else {
                    return people[kp].name;
                }
            });

            m.def.icon = await modIcons.get(m.def.inventoryDefinition.hash + '.png');
            mods[m.def.inventoryDefinition.hash] = m.def;

            console.log({ [m.def.inventoryDefinition.hash]: users });
            return (await modToEmbed(m.def))
                .addFields({
                    name: 'Missing',
                    value: users.sort((a, b) => a.localeCompare(b)).join('\n') || 'Nobody :)',
                    inline: false
                })
        }))
    ];
    return guildInfo.channel.send({
        embeds
    })
        .then(() => {
        
            console.log({ pings });
            if (pings.size) {
                guildInfo.channel.send({
                    content: [...pings]
                        .sort((a, b) => a.localeCompare(b))
                        .map(p => `<@${p}>`)
                        .join(', ')
                });
            }
        })
        .then(() => fs.writeFileSync('./local/mods.json', JSON.stringify(mods, null, 2)))
        .catch(console.error);

}

/**
 * @param {number[]} hashes
 * @param {{membershipId: string, membershipType: string}[]} member
 * @return {Promise<{[membershipId: string]: {[hash: string]:
 *     DestinyCollectibleState}}>}
 */
async function membersModStatuses(hashes, member) {
    return Promise.all(member.map(m => {
        return import('../bungie-net-api/profile.mjs')
        .then(({missingMods}) => missingMods(hashes, m.membershipId, m.membershipType));
    })).then(arr => {
        return Object.assign({}, ...arr.map((e) => ({ [e.membershipId]: e.data })));
    });
}

/**
 * @param clan
 * @return {EmbedBuilder}
 */
function headerEmbed(clan) {
    return new EmbedBuilder()
        .setTitle('Ada 1 Mods Today - Clan ' + clan.name + ` [${clan.clanInfo.clanCallsign}]`)
        .addFields({
            name: 'Combat-Style Mods',
            value: 'Missing a mod? Head to Ada-1 in the tower and go purchase it! '
                + 'Every day Ada has a small chance to sell powerful combat-style mods '
                + 'from previous seasons that are not otherwise acquirable.',
            inline: false
        }, {
            name: 'Never miss a mod!',
            value: 'Want to be pinged? `/register` with your Bungie Name and do `/mentions true` to never miss out when Ada is selling a mod you are missing! Further, you can do `/remindme` to set a time for the bot to DM you when you are missing a mod.',
            inline: false
        })
    // TODO Destiny2.GetClanBannerSource for the banner
    // clan.clanInfo.clanBannerData
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
        .then(buff => sharp(buff)
            .composite([{
                input: '.' + overlayUrl
            }])
            .png()
            .toBuffer())
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
    const reset = nextReset();
    const data = JSON.stringify(
        {
            validTil: reset.getTime(),
            missing: peopleMissingMods
        }, null,
        2);
    fs.writeFileSync('./local/reminders.json', data);
}

/**
 * @param { DefsTriple } def
 * @return EmbedBuilder
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
 * @param { DestinyItemInvestmentStatDefinition[]} investmentStats
 */
function costs(investmentStats) {
    const arr = [];
    investmentStats.forEach(stat => {
        const hash = stat.statTypeHash;
        if (hash === 2399985800) arr.push(`${stat.value} Void Energy`);
        else if (hash === 3779394102) arr.push(`${stat.value} Arc Energy`);
        else if (hash === 3344745325) arr.push(`${stat.value} Solar Energy`);
        else if (hash === 998798867) arr.push(`${stat.value} Stasis Energy`);
    });
    return arr;
}

/**
 *
 * @param { DestinyItemInvestmentStatDefinition[]} investmentStats
 */
function adjustments(investmentStats) {
    const arr = [];
    investmentStats.forEach(stat => {
        const hash = stat.statTypeHash;
        const c = stat.isConditionallyActive;
        if (hash === 2996146975) arr.push(`${stat.value} Mobility${c ? '*' : ''}`);
        else if (hash === 392767087) arr.push(`${stat.value} Resilience${c ? '*' : ''}`);
        else if (hash === 1943323491) arr.push(`${stat.value} Recovery${c ? '*' : ''}`);
        else if (hash === 1735777505) arr.push(`${stat.value} Discipline${c ? '*' : ''}`);
        else if (hash === 144602215) arr.push(`${stat.value} Intellect${c ? '*' : ''}`);
        else if (hash === 4244567218) arr.push(`${stat.value} Strength${c ? '*' : ''}`);
    });
    return arr;
}
