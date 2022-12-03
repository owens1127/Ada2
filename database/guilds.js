const { dbQuery, escape } = require('./util');
const config = require('../config.json')
const { getMembersInGuild } = require('./users.js');

/**
 * @typedef GuildResponse
 * @property {string} guild_id
 * @property {string} broadcast_channel
 * @property {string} clan_id
 * @property {boolean} tips_option
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
    const clan = await import('../bungie-net-api/clan.mjs').then(({ getClan }) => getClan(clanId));
    // update the clan group id for this server
    const query = `INSERT INTO ${config.guildTable} (guild_id, clan_id)
                   VALUES (${escape(guildId)}, ${escape(clan.groupId)}) ON DUPLICATE KEY
    UPDATE clan_id = ${escape(clan.groupId)};`
    await dbQuery(query);
    // remove whitespace/extra characters people tend to put in their clans names
    return clan.name.replace(/[^\x00-\x7F]/g, '').trim();
}

/**
 * Updates the clan id for a guild
 * @param {string} guildId
 * @param {string} clanId
 * @return {Promise<string>} the new clan name
 */
exports.unlinkGuild = async (guildId) => {
    // get the clan info from bungie api
    const query = `INSERT INTO ${config.guildTable} (guild_id, clan_id)
                   VALUES (${escape(guildId)}, NULL) ON DUPLICATE KEY
    UPDATE clan_id = NULL;`
    return await dbQuery(query);
}

/**
 * Disable the tips option
 * @param {string} guildId
 * @param {boolean} foo
 * @return {Promise<void>}
 */
exports.toggleTipsOption = async (guildId, foo) => {
    // update the tips option
    const query = `INSERT INTO ${config.guildTable} (guild_id, tips_option)
                   VALUES (${escape(guildId)}, ${escape(foo)}) ON DUPLICATE KEY
    UPDATE tips_option = ${escape(foo)};`
    return dbQuery(query);
}

/**
 * @typedef DestinyMemberInfo
 * @property {string} membershipId
 * @property {number} membershipType
 */

/**
 * All built-out info for a guild
 * @typedef GuildInfoObject
 * @property {Guild} guild
 * @property {GroupV2} [clan]
 * @property {TextChannel} channel
 * @property {DestinyMemberInfo[]} members
 * @property {{tips: boolean}} options
 */

/**
 * @param client
 * @return {Promise<GuildInfoObject[]>}
 */
exports.getInfoByGuilds = async (client) => {

    const query = `SELECT *
                   FROM ${config.guildTable};`
    return dbQuery(query).then(async data => {
        /** @type {GuildInfoObject[]} */
        return Promise.all(
            data.map(rdp => infoForGuid(rdp, client)
                .catch(() => ({}))));
    })
}

/**
 *
 * @param {GuildResponse} rdp - RowDataPacket
 * @param client
 * @return {Promise<DestinyMemberInfo>}
 */
async function infoForGuid(rdp, client) {
    let results = [];
    if (rdp.clan_id) {
        let members;
        let page = 0;
        const { getMembersOfClan } = await import('../bungie-net-api/clan.mjs');
        do {
            page++;
            await getMembersOfClan(rdp.clan_id, page)
                .then(srogm => {
                    members = srogm;
                    results.push(...members.results.filter(r => !!r.destinyUserInfo).map(r => (
                        {
                            ...r.destinyUserInfo,
                            // old accounts might not have a bungieGlobalDisplayName set up yet
                            name: r.destinyUserInfo.bungieGlobalDisplayName
                                ? r.destinyUserInfo.bungieGlobalDisplayName + '#'
                                + r.destinyUserInfo.bungieGlobalDisplayNameCode
                                : r.destinyUserInfo.displayName
                        }
                    )));
                })
                .catch(console.error);
        }
        while (members?.hasMore);
    } else {
        results = await getMembersInGuild(rdp.guild_id, client);
    }

    const options = { tips: rdp.tips_option }
    const [clan, guild, channel] = await Promise.all([
        rdp.clan_id ? import('../bungie-net-api/clan.mjs').then(
            ({ getClan }) => getClan(rdp.clan_id))
            .catch(() => null) : null,
        client.guilds.fetch(rdp.guild_id).catch(() => null),
        client.channels.fetch(rdp.broadcast_channel).catch(() => null)]);
    return { clan, guild, channel, members: results, options };
}

/**
 * Gets a list of all channelIds
 * @returns string[]
 */
exports.getAllChannels = async () => {
    const query = `SELECT broadcast_channel
                   FROM ${config.guildTable};`
    return dbQuery(query).then(data => data.map(rdp => rdp.broadcast_channel).filter(c => !!c));
}