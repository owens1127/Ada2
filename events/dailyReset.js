const { EmbedBuilder } = require('discord.js');
const { getInfoByGuilds } = require('../database/guilds.js');
const { bungieMembersToMentionable } = require('../database/users.js');
const { colorFromEnergy, modEnergyType } = require('../bungie-net-api/util')
const sharp = require('sharp');
const fetch = require('node-fetch-commonjs');
const fs = require('node:fs');
const config = require('../config.json')
/**
 *
 * @type {{[p: string]: Map<string,string[]>}}
 */
const peopleToRemind = {}
const modIcons = {}

module.exports = {
    name: 'dailyReset',
    on: true,
    async execute(client, resetListener) {
        console.log(`Daily reset for ${new Date().toDateString()}`);
        try {
            const adaSales = (await (await import('../bungie-net-api/vendor.mjs')).getAdaCombatModsSaleDefinitons())
            console.log('Ada is selling...')
            console.log(adaSales)
            const guilds = await getInfoByGuilds(client);
            const modHashes = adaSales.map(sale => {
                storeImage(sale.inventoryDefinition, client)
                return sale.collectibleDefinition.hash
            });
            await Promise.all(guilds.map(g => {
                return sendResetInfo(g, client, modHashes, adaSales).then(() => {
                    console.log(`Sent info to clan ${g.clan.name} in ${g.guild.name}`)
                })
            }))
            .then(() => {
                const date = new Date();
                // make sure we have the right "day"
                date.setUTCHours(date.getUTCHours() - config.UTCResetHour)
                date.setUTCHours(config.UTCResetHour)
                console.log(peopleToRemind);
                // const data = JSON.stringify({ validTil:  date.getTime(), users: [...peopleToRemind] }, null, 2);
                // fs.writeFileSync('./reminders.json', data);
            })
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
    }))
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
    const embeds = [headerEmbed(guildInfo.clan),
        ...await Promise.all(modsInfo.map(async m => {
            const users = Object.keys(people).filter(k => m.missing.includes(k)).map(k => {
                const disc = people[k].discord;
                if (disc) {
                    if (people[k].mentionable) pings.add(disc);
                    // could be 0, which is a falsy value
                    const time = people[k].reset_time
                    if (time) {
                        if (!peopleToRemind[time]) peopleToRemind[time] = new Map();
                        if(!peopleToRemind[time].get(disc)) peopleToRemind[time].set(disc, []);
                        peopleToRemind[time].get(disc).push(m.def.inventoryDefinition.displayProperties.name);
                    }
                    return people[k].name + `  [<@${disc}>]`;
                } else {
                    return people[k].name;
                }
            });
            console.log({ missing: users })

            return new EmbedBuilder()
                .setTitle(m.def.inventoryDefinition.displayProperties.name)
                .setThumbnail(modIcons.get(m.def.inventoryDefinition.hash + '.png'))
                .setColor(colorFromEnergy(m.def.inventoryDefinition.plug.energyCost.energyType))
                .setTimestamp(Date.now())
                .setURL(`https://www.light.gg/db/items/${m.def.inventoryDefinition.hash}/`)
                .addFields({
                    name: m.def.inventoryDefinition.itemTypeDisplayName,
                    value: m.def.sandboxDefinition.displayProperties?.description,
                    inline: false
                }, {
                    name: 'Missing',
                    value: users.join('\n') || 'Nobody :)',
                    inline: false
                })
        }))
    ];
    guildInfo.channel.send({
        embeds
    }).then(() => {
        if (pings.size) {
            guildInfo.channel.send({
                content: [...pings].map(p => `<@${p}>`).join(', ')
            });
        }
    })
}

/**
 * @param {number[]} hashes
 * @param {{membershipId: string, membershipType: string}[]} member
 * @return {Promise<{[membershipId: string]: {[hash: string]:
 *     DestinyCollectibleState}}>}
 */
async function membersModStatuses(hashes, member) {
    return await Promise.all(member.map(async m => {
        return (await import('../bungie-net-api/profile.mjs')).missingMods(hashes, m.membershipId,
            m.membershipType);
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
        .setTitle('Ada 1 Mods Today - Clan ' + clan.name + `[${clan.clanInfo.clanCallsign}]`)
        .addFields({
            name: 'Combat-Style Mods',
            value: 'Missing a mod? Head to Ada-1 in the tower and go purchase it! '
                + 'Every day Ada has a small chance to sell powerful combat-style mods '
                + 'from previous seasons that are not otherwise acquirable.',
            inline: false
        }, {
            name: 'Never miss a mod!',
            value: 'Want to be pinged? Try `/mentions true` to never miss out when Ada is selling a mod you are missing!',
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
function storeImage(def, client) {
    let overlayUrl;
    def.investmentStats.forEach(stat => {
        overlayUrl = modEnergyType(stat.statTypeHash) || overlayUrl;
    });
    const iconUrl = 'https://bungie.net' + def.displayProperties.icon
    fetch(iconUrl)
        .then(res => res.buffer())
        .then(buff => {
            return sharp(buff)
                .composite([{
                    input: '.' + overlayUrl
                }])
                .png()
                .toBuffer()
        })
        .then(img => {
            const name = def.hash + '.png';
            client.channels.fetch(config.images).then(channel => channel.send({
                files: [{
                    attachment: img,
                    name,
                    description: 'A description of the file'
                }]
            }).then(m => modIcons.set(name, m.attachments.first().url)))
        });
}
