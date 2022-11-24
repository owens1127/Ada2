const { SlashCommandBuilder, ChannelType, TextChannel, PermissionFlagsBits } = require(
    'discord.js');
const { dbQuery } = require('../database/util.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('custom')
        .setDescription('do stuff')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply();
        dbQuery(`SELECT *
                 FROM ${config.userTable}`).then(data => {
            const total = data.length;
            let count = 0;
            return Promise.all(data.map(async rdp => {
                const value = await import('../bungie-net-api/profile.mjs').then(
                    (n) => n.getProfile(rdp.destiny_membership_id, rdp.destiny_membership_type));
                const name = value.bnetMembership?.supplementalDisplayName
                    ?? value.profiles[0].bungieGlobalDisplayName
                    + value.profiles[0].bungieGlobalDisplayNameCode
                const query = `UPDATE ${config.userTable}
                               SET destiny_cached_username = '${name}'
                               WHERE discord_id = '${rdp.discord_id}';`
                count++;
                return interaction.editReply(`Modifying entry ${count} / ${total}`).then(() => {
                    return dbQuery(query);
                })
            }));
        }).then(() => interaction.editReply('Finished'))
    }
};