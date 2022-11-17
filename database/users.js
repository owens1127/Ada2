const config = require('../config.json');
const { dbQuery, escape } = require('./util');
const { updateMissingCache, timeKey, peopleToRemind } = require('../misc/util.js');

/**
 * @typedef UsersResponse
 * @property {string} discord_id
 * @property {string} destiny_membership_id
 * @property {number} destiny_membership_type
 * @property {boolean} mentionable
 * @property {number} remind_time
 */

/**
 *
 * @param userId
 * @param foo
 * @return {Promise<boolean>}
 */
exports.toggleMentionable = async (userId, foo) => {
    const query = `INSERT INTO ${config.userTable} (discord_id, mentionable)
                   VALUES (${escape(userId)}, ${escape(foo)}) ON DUPLICATE KEY
    UPDATE mentionable = ${escape(foo)};`
    await dbQuery(query);
    return foo;
}

/**
 *
 * @param bungieName
 * @param userId
 * @param mentionable
 * @return {Promise<string>}
 */
exports.linkAccounts = async (bungieName, userId, mentionable) => {
    const { findMemberDetails } = await import('../bungie-net-api/profile.mjs');
    const member = await findMemberDetails(bungieName);
    const query = `INSERT INTO ${config.userTable} (discord_id, destiny_membership_id,
                                                    destiny_membership_type, mentionable)
                   VALUES (${escape(userId)}, ${escape(member.membershipId)},
                           ${escape(member.membershipType)}, ${mentionable}) ON DUPLICATE KEY
    UPDATE destiny_membership_id = ${escape(member.membershipId)},
        destiny_membership_type = ${escape(member.membershipType)},
        mentionable = ${mentionable};`
    await dbQuery(query);
    return member.name;
}

/**
 * Mutates the members dictionary and the pings array
 * @return {Promise<void>}
 */
exports.bungieMembersToMentionable = async (members) => {
    return new Promise(async (resolve) => {
        const query = `SELECT destiny_membership_id, discord_id, mentionable, remind_time
                       FROM ${config.userTable}
                       WHERE destiny_membership_id IN (${escape(Object.keys(members))});`
        await dbQuery(query, resolve);
    }).then(data => {
        console.log(data);
        data.forEach(/** @type UsersResponse */rdp => {
            members[rdp.destiny_membership_id].discord = rdp.discord_id
            members[rdp.destiny_membership_id].mentionable = !!rdp.mentionable
            members[rdp.destiny_membership_id].remind_time = rdp.remind_time
        })
    });
}

/**
 *
 * @param userId
 * @param delta
 * @return {Promise<string>}
 */
exports.updateReminderTime = async (userId, delta) => {
    const query = `INSERT INTO ${config.userTable} (discord_id, remind_time)
                   VALUES (${escape(userId)}, ${escape(delta % 24)}) ON DUPLICATE KEY
    UPDATE remind_time = ${escape(delta % 24)};`
    await dbQuery(query);
    if (delta >= 0) {
        const minutes = Math.round((delta % 1) * 60);
        return `${Math.floor(delta)} hours, ${minutes} minutes after reset`
    } else {
        const minutes = Math.round((delta % 1) * -60);
        return `${Math.ceil(delta) / -1} hours, ${minutes} minutes before the next reset`
    }
}

/**
 *
 * @param delta
 * @return {Promise<string[]>}
 */
exports.getMembersPerDelta = async (delta) => {
    return new Promise(async (resolve) => {
        const query = `SELECT discord_id
                       FROM ${config.userTable}
                       WHERE MOD(remind_time + 24, 24) <= ${delta}
                            AND MOD(remind_time + 24, 24) > ${delta - 0.05};`
        await dbQuery(query, resolve);
    }).then(data => {
        return data.map(data => data.discord_id);
    });
}