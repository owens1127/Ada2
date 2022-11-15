const { EmbedBuilder } = require('discord.js');
const { getInfoByGuilds } = require('../database/guilds.js');
const { bungieMembersToMentionable } = require('../database/users.js');
const { colorFromEnergy } = require('../bungie-net-api/util')

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
            const modHashes = adaSales.map(d => d.collectibleDefinition.hash);
            await Promise.all(guilds.map(g => {
                return sendResetInfo(g, client, modHashes, adaSales).then(() => {
                    console.log(`Sent info to clan ${g.clan.name} in ${g.guild.name}`)
                })
            })).then(() => resetListener.emit('success'));
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
 *     DestinyCollectibleDefinition, sandboxDefinition: DestinySandboxPerkDefinition}[]} modDefs
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
    /** @type string[] */
    const pings = [];
    const embeds = [headerEmbed(guildInfo.clan.name),
        ...modsInfo.map(m => {
            const users = Object.keys(people).filter(k => m.missing.includes(k)).map(k => {
                const disc = people[k].discord;
                if (disc) {
                    pings.push(disc);
                    return disc;
                } else return people[k].name;
            });
            return new EmbedBuilder()
                .setTitle(m.def.inventoryDefinition.displayProperties.name)
                .setThumbnail(
                    'https://bungie.net' + m.def.inventoryDefinition.displayProperties.icon)
                .setColor(colorFromEnergy(m.def.inventoryDefinition.plug.energyCost.energyType))
                .setTimestamp(Date.now())
                .addFields({
                    name: m.def.inventoryDefinition.itemTypeDisplayName,
                    value: m.def.sandboxDefinition.displayProperties?.description,
                    inline: false
                }, {
                    name: 'Missing',
                    value: users.join('\n') || 'Nobody :)',
                    inline: false
                })
        })
    ];
    guildInfo.channel.send({
        embeds
    }).then(() => {
        if (pings.length) guildInfo.channel.send({
            content: pings.map(p => `<@${p}>`).join(', '),
        });
    })
}

/**
 * @param {number[]} hashes
 * @param {{membershipId: string, membershipType: string}[]} member
 * @return {Promise<{[membershipId: string]: {[hash: string]: DestinyCollectibleState}}>}
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
 * @param clanName
 * @return {EmbedBuilder}
 */
function headerEmbed(clanName) {
    return new EmbedBuilder()
        .setTitle('Ada 1 Mods Today - Clan ' + clanName)
        .setTimestamp(Date.now())
}
