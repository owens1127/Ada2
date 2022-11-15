const config = require('../config.json');
const { dbQuery, escape } = require('./util');

/**
 * @typedef UsersResponse
 * @property {string} discord_id
 * @property {string} destiny_membership_id
 * @property {number} destiny_membership_type
 * @property {boolean} mentionable
 */

/**
 *
 * @param userId
 * @param foo
 * @return {Promise<boolean>}
 */
exports.toggleMentionable = async (userId, foo) => {
    const query = `INSERT INTO ${config.userTable} (discord_id, mentionable) 
                        VALUES(${escape(userId)}, ${escape(foo)}) 
                   ON DUPLICATE KEY UPDATE mentionable = ${escape(foo)};`
    await dbQuery(query);
    return foo;
}

/**
 *
 * @param bungieName
 * @param userId
 * @return {Promise<string>}
 */
exports.linkAccounts = async (bungieName, userId) => {
    const { findMemberDetails } = await import('../bungie-net-api/profile.mjs');
    const member = await findMemberDetails(bungieName);
    const query = `INSERT INTO ${config.userTable} (discord_id, destiny_membership_id, destiny_membership_type) 
                        VALUES(${escape(userId)}, ${escape(member.membershipId)}, ${escape(member.membershipType)}) 
                   ON DUPLICATE KEY UPDATE destiny_membership_id = ${escape(member.membershipId)}, destiny_membership_type = ${escape(member.membershipType)};`
    await dbQuery(query);
    return member.name;
}

/**
 * Mutates the members dictionary and the pings array
 * @param {{[p:string]: {discord: string, name: string}}} members
 * @return {Promise<void>}
 */
exports.bungieMembersToMentionable = async (members) => {
    return new Promise(async (resolve) => {
        const query = `SELECT destiny_membership_id, discord_id, mentionable
                       FROM ${config.userTable}
                       WHERE destiny_membership_id IN (${escape(Object.keys(members))});`
        await dbQuery(query, resolve);
    }).then(data => {
        console.log(data);
        data.forEach(/** @type UsersResponse */ rdp => {
            members[rdp.destiny_membership_id].discord = `<@${rdp.discord_id}>`
        })
    });

}