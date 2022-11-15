const { dbQuery, escape } = require('./util');
const config = require('../config.json')

/**
 * @typedef GuildResponse
 * @property {string} guild_id
 * @property {string} broadcast_channel
 * @property {string} clan_id}
 */
/**
 *
 * @param guildId
 * @param channel
 * @return {Promise<TextChannel>}
 */
exports.updateBroadcastChannel = async (guildId, channel) => {
    // update the broadcast_channel
    const query = `INSERT INTO ${config.guildTable} (guild_id, broadcast_channel)
                   VALUES (${escape(guildId)}, ${escape(channel.id)}) ON DUPLICATE KEY
                   UPDATE broadcast_channel = ${escape(channel.id)};`
    await dbQuery(query);
    return channel;
}

/**
 *
 * @param guildId
 * @param clanId
 * @return {Promise<string>} the new clan name
 */
exports.linkGuild = async (guildId, clanId) => {
    // get the clan info from bungie api
    const clan = await (await import('../bungie-net-api/clan.mjs')).getClan(clanId);
    // update the clan group id for this server
    const query = `INSERT INTO ${config.guildTable} (guild_id, clan_id)
                   VALUES (${escape(guildId)}, ${escape(clan.groupId)}) ON DUPLICATE KEY
    UPDATE clan_id = ${escape(clan.groupId)};`
    await dbQuery(query);
    // remove whitespace/extra characters people tend to put in their clans names
    return clan.name.replace(/[^\x00-\x7F]/g, '').trim();
}

/**
 * @typedef GuildInfoObject
 * @property {Guild} guild
 * @property {GroupV2} clan
 * @property {TextChannel} channel
 * @property {GroupMember[]} members
 */

/**
 * @return {Promise<GuildInfoObject[]>}
 */
exports.getInfoByGuilds = async (client) => {
    return new Promise(async (resolve) => {
        const query = `SELECT *
                       FROM ${config.guildTable};`
        await dbQuery(query, resolve);
    }).then(async data => {
        console.log(data);
        /** @type {GuildInfoObject[]} */
        return await Promise.all(data.map(rdp => membersPromise(rdp, client)));
    })
}

/**
 *
 * @param rdp
 * @param client
 * @return {Promise<GuildInfoObject>}
 */
function membersPromise(rdp, client) {
    return new Promise(async (resolve, reject) => {
        const getMembers = (await import('../bungie-net-api/clan.mjs')).getMembersOfClan
        try {
            let members;
            let page = 1;
            let results = [];
            do {
                members = await getMembers(rdp.clan_id, page);
                page++;
            }
            while (members.hasMore) {
                results.push(...members.results);
            }
            resolve({
                clan: await (await import('../bungie-net-api/clan.mjs')).getClan(rdp.clan_id),
                guild: await client.guilds.fetch(rdp.guild_id),
                channel: await client.channels.fetch(rdp.broadcast_channel),
                members: results
            });
        } catch (e) {
            reject(e.message);
        }
    });
}