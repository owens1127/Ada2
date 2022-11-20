const config = require('../config.json');
const { dbQuery, escape } = require('./util');

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
    if (!await inDb(userId)) throw new Error('You must /register first');
    const query = `UPDATE ${config.userTable}
                   SET mentionable = ${foo}
                   WHERE discord_id = ${escape(userId)};`
    await dbQuery(query);
    return foo;
}

/**
 *
 * @param userId
 * @param delta
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
 *
 * @param userId
 */
exports.disableReminders = async (userId) => {
    if (!await inDb(userId)) throw new Error('You be registered to disable reminders');
    const query = `UPDATE ${config.userTable}
                   SET remind_time = NULL
                   WHERE discord_id = ${escape(userId)};`
    dbQuery(query);
}

/**
 *
 * @param bungieName
 * @param userId
 * @param mentionable
 * @return {Promise<string>}
 */
exports.linkAccounts = async (bungieName, userId, mentionable) => {
    const member = await import('../bungie-net-api/profile.mjs')
    .then(({findMemberDetails}) => findMemberDetails(bungieName));
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
    const query = `SELECT destiny_membership_id, discord_id, mentionable, remind_time
                   FROM ${config.userTable}
                   WHERE destiny_membership_id IN (${escape(Object.keys(members))});`
    return dbQuery(query)
        .then(data => {
            console.log(data);
            data.forEach(/** @type UsersResponse */rdp => {
                members[rdp.destiny_membership_id].accounts = members[rdp.destiny_membership_id].accounts || [];
                members[rdp.destiny_membership_id].accounts.push({
                    discord: rdp.discord_id,
                    mentionable: !!rdp.mentionable,
                    remind_time: rdp.remind_time
                });
            })
        });
}

/**
 *
 * @param {{hours, minutes}}delta
 * @return {Promise<string[]>}
 */
exports.getMembersPerDelta = async (delta) => {
    const query = `SELECT discord_id
                   FROM ${config.userTable}
                   WHERE MOD(remind_time + 24, 24) > ${round(delta - 1 / 60, 2)}
                     AND MOD(remind_time + 24, 24) <= ${round(delta, 2)};`
    return dbQuery(query)
        .then(data => {
            console.log(data);
            return data.map(data => data.discord_id);
        });
}

function round(n, d) {
    const tens = Math.pow(10, d);
    return Math.round(tens * n) / tens;
}

async function inDb(userId) {
    const query = `SELECT COUNT(1)
                   FROM ${config.userTable}
                   WHERE discord_id = ${userId};`
    return !!(await dbQuery(query))[0]['COUNT(1)'];
}