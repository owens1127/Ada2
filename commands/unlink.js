const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { unlinkGuild } = require('../database/guilds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlink')
        .setDescription('Unlink this server from the currently linked clan')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false),
    async execute(interaction) {
        try {
            await unlinkGuild(interaction.guild.id);
            await interaction.reply({content: `Server successfully unlinked from clan`});
        } catch (e) {
            console.error(e);
            await interaction.reply({content: `Failed to unlink clan: \`${e.message}\``});
        }
    }
};

/**
 * @param {string} link 
 * @returns {string | undefined | null}
 */
function groupIdFromLink(link) {
    try {
        const params = new URL(link).searchParams
        return params.get('groupId') || params.get('groupid');
    } catch (e) {
        return null;
    }
}