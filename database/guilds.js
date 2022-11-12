const {dbQuery, escape} = require('./util');
const config = require('../config.json')
/**
 *
 * @param guildId
 * @param channel
 * @return {Promise<TextChannel>}
 */
exports.updateAnnounceChannel = async (guildId, channel) => {
    // update the announcements_channel
    const query = `INSERT INTO ${config.guildTable} (guild_id, announcements_channel) VALUES (${escape(guildId)}, ${escape(channel.id)}) ON DUPLICATE KEY UPDATE announcements_channel = ${escape(channel.id)};`
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
    const {getClan} = await import('../bungie-net-api/clan.mjs');
    // get the clan info from bungie api
    const clan = await getClan(clanId);
    // update the clan group id for this server
    const query = `INSERT INTO ${config.guildTable} (guild_id, clan_id) 
                        VALUES(${escape(guildId)}, ${escape(clan.groupId)}) 
                   ON DUPLICATE KEY UPDATE clan_id = ${escape(clan.groupId)};`
    await dbQuery(query);
    // remove whitespace/extra characters people tend to put in their clans names
    return clan.name.replace(/[^\x00-\x7F]/g, '').trim();
}