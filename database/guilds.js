const { dbQuery, escape } = require('./util');
const config = require('../config.json')

/**
 * @typedef GuildResponse
 * @property {string} guild_id
 * @property {string} broadcast_channel
 * @property {string} clan_id}
 */
/**
 * Updates the broadcast channel for a guild
 * @param {string} guildId
 * @param {TextChannel} channel
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
 * Updates the clan id for a guild
 * @param {string} guildId
 * @param {string} clanId
 * @return {Promise<string>} the new clan name
 */
exports.linkGuild = async (guildId, clanId) => {
    // get the clan info from bungie api
    const clan = await import('../bungie-net-api/clan.mjs').then(({getClan}) => getClan(clanId));
    // update the clan group id for this server
    const query = `INSERT INTO ${config.guildTable} (guild_id, clan_id)
                   VALUES (${escape(guildId)}, ${escape(clan.groupId)}) ON DUPLICATE KEY
    UPDATE clan_id = ${escape(clan.groupId)};`
    await dbQuery(query);
    // remove whitespace/extra characters people tend to put in their clans names
    return clan.name.replace(/[^\x00-\x7F]/g, '').trim();
}

/**
 * All built-out info for a guild
 * @typedef GuildInfoObject
 * @property {Guild} guild
 * @property {GroupV2} clan
 * @property {TextChannel} channel
 * @property {GroupMember[]} members
 */

/**
 * @param client
 * @return {Promise<GuildInfoObject[]>}
 */
exports.getInfoByGuilds = async (client) => {

    const query = `SELECT *
                   FROM ${config.guildTable};`
    return dbQuery(query).then(async data => {
        console.log(data);
        /** @type {GuildInfoObject[]} */
        return Promise.all(
            data.filter(rdp => !!rdp.clan_id && !!rdp.broadcast_channel).map(rdp => membersPromise(rdp, client).catch((e) => {
                console.error(`Error for guild ${rdp.guild_id}: ${e}`)
                return {};
            })));
    })
}

/**
 *
 * @param {GuildResponse} rdp - RowDataPacket
 * @param client
 * @return {Promise<GuildInfoObject>}
 */
async function membersPromise(rdp, client) {
        let members;
        let page = 1;
        let results = [];
        do {
            members = await import('../bungie-net-api/clan.mjs').then(({getMembersOfClan}) => getMembersOfClan(rdp.clan_id, page));
            results.push(...members.results);
            page++;
        }
        while (members.hasMore);

        const [clan, guild, channel] = await Promise.all([
            // TODO more detailed error handling instead of just nulling
            import('../bungie-net-api/clan.mjs').then(({getClan}) => getClan(rdp.clan_id).catch(() => null)),
            client.guilds.fetch(rdp.guild_id).catch(() => null),
            client.channels.fetch(rdp.broadcast_channel).catch(() => null)]);
        return { clan, guild, channel, members: results };
}