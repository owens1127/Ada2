/**
 *
 * @param userId
 * @return {Promise<void>}
 */
exports.toggleMentionable = async (userId) => {
    // TODO
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
    // TODO: database stuff
    return member.name;
}