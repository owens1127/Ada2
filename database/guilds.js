
/**
 *
 * @param guildId
 * @return {Promise<void>}
 */
exports.updateAnnounceChannel = async (guildId) => {
    // TODO
}

/**
 *
 * @param guild
 * @param clanId
 * @return {Promise<string>}
 */
exports.linkGuild = async (guild, clanId) => {
    const {getClan} = await import('../bungie-net-api/clan.mjs');
    const clan = await getClan(clanId);
        // TODO: database stuff
    return clan.name.replace(/[^\x00-\x7F]/g, "").trim();
}