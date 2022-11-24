const config = require('../config.json');
const { dbQuery, escape } = require('./util');
const { round } = require('../misc/util');

/**
 * @typedef UsersResponse
 * @property {string} discord_id
 * @property {string} primary_guild
 * @property {string} destiny_membership_id
 * @property {number} destiny_membership_type
 * @property {string} destiny_cached_username
 * @property {boolean} mentionable
 * @property {number} remind_time
 */

/**
 * Toggles the mentionable field to foo for the user
 * @param {string} userId
 * @param {boolean} foo
 * @return {Promise<boolean>}
 */
exports.toggleMentionable = async (userId, foo) => {
    if (!await inDb(userId)) throw new Error('You must /register first');
    const query = `UPDATE ${config.userTable}
                   SET mentionable = ${foo}
                   WHERE discord_id = ${escape(userId)};`
    await dbQuery(query);
    return foo;
}

/**
 * Updates the reminder time for a user
 * @param {string} userId
 * @param {number} delta
 * @return {Promise<string>}
 */
exports.updateReminderTime = async (userId, delta) => {
    if (!await inDb(userId)) throw new Error('You must /register first');
    const query = `UPDATE ${config.userTable}
                   SET remind_time = ${escape(delta % 24)}
                   WHERE discord_id = ${escape(userId)}`
    await dbQuery(query);
    if (delta >= 0) {
        const minutes = Math.round((delta % 1) * 60);
        const hrs = Math.floor(delta);
        return `${hrs} hour${hrs === 1 ? '' : 's'}, ${minutes} minutes after reset`
    } else {
        const minutes = Math.round((delta % 1) * -60);
        const hrs = Math.ceil(delta) / -1;
        return `${hrs} hour${hrs === 1 ? '' : 's'}, ${minutes} minutes before the next reset`
    }
}

/**
 * Removes a reminder time for a user
 * @param {string} userId
 */
exports.disableReminders = async (userId) => {
    if (!await inDb(userId)) throw new Error('You be registered to disable reminders');
    const query = `UPDATE ${config.userTable}
                   SET remind_time = NULL
                   WHERE discord_id = ${escape(userId)};`
    return dbQuery(query);
}

/**
 * Tethers a discord account to a bungie account
 * @param {string} bungieName
 * @param {string} userId
 * @param {Guild} guild
 * @param {boolean} mentionable
 * @return {Promise<string>}
 */
exports.linkAccounts = async (bungieName, userId, guild, mentionable) => {
    const member = await import('../bungie-net-api/profile.mjs')
        .then(({ findMemberDetails }) => findMemberDetails(bungieName));
    const query = `INSERT INTO ${config.userTable} (discord_id, primary_guild,
                                                    destiny_membership_id,
                                                    destiny_membership_type,
                                                    destiny_cached_username, mentionable)
                   VALUES (${escape(userId)}, ${escape(guild.id)}, ${escape(member.membershipId)},
                           ${escape(member.membershipType)}, ${escape(member.name)},
                           ${mentionable}) ON DUPLICATE KEY
    UPDATE destiny_membership_id = ${escape(member.membershipId)},
        primary_guild = ${escape(guild.id)},
        destiny_membership_type = ${escape(member.membershipType)},
        destiny_cached_username = ${escape(member.name)},
        mentionable = ${mentionable};`
    await dbQuery(query);
    return member.name;
}

/**
 * Mutates the members dictionary and the pings array
 * @param {Collection<string, {name}>} members
 * @return {Promise<void>}
 */
exports.bungieMembersToMentionable = async (members) => {
    const snowflakes = members.map((v, k) => k).join(', ');
    const query = `SELECT destiny_membership_id, discord_id, mentionable, remind_time, primary_guild
                   FROM ${config.userTable}
                   WHERE ${snowflakes ? `destiny_membership_id IN (${snowflakes})` : '0'};`
   return dbQuery(query)
        .then(data => {
            data.forEach(/** @type UsersResponse */rdp => {
                if (members.get(rdp.destiny_membership_id)) {
                    members.get(rdp.destiny_membership_id).accounts =
                        [...members.get(rdp.destiny_membership_id).accounts ?? [], {
                            discord: rdp.discord_id,
                            primary_guild: rdp.primary_guild,
                            mentionable: !!rdp.mentionable,
                            remind_time: rdp.remind_time
                        }];
                }
            })
        });
}

/**
 * Gets a list of members with a remind time this minute
 * @param {number} delta
 * @return {Promise<string[]>}
 */
exports.getMembersPerDelta = async (delta) => {
    const query = `SELECT discord_id
                   FROM ${config.userTable}
                   WHERE MOD(remind_time + 24, 24) > ${round(delta - 1 / 60, 2)}
                     AND MOD(remind_time + 24, 24) <= ${round(delta, 2)};`
    return dbQuery(query)
        .then(data => data.map(data => data.discord_id));
}

/**
 * Is a discord user in the database?
 * @param {string} discord
 * @returns {Promise<boolean>}
 */
async function inDb(discord) {
    const query = `SELECT COUNT(1)
                   FROM ${config.userTable}
                   WHERE discord_id = ${discord};`
    return !!(await dbQuery(query))[0]['COUNT(1)'];
}

/**
 *
 * @return {Promise<{membershipType, membershipId}[]>}
 */
exports.getMembersInGuild = async (guildId) => {
    const query = `SELECT destiny_membership_id, destiny_membership_type, destiny_cached_username
                   FROM ${config.userTable}
                   WHERE primary_guild = ${guildId}`
    return dbQuery(query).then(data => data.map(user => {
        return {
            membershipId: user.destiny_membership_id,
            membershipType: user.destiny_membership_type,
            name: user.destiny_cached_username
        }
    }))
}
