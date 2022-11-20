const {SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const {linkGuild} = require('../database/guilds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clan')
        .setDescription('Link this server to a clan')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false)
        .addStringOption(option =>
            option.setName('url')
                .setDescription('link to clan page')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply()
        const groupId = groupIdFromLink(interaction.options.getString('url'));
        if (!groupId) {
            await interaction.editReply(
                {content: 'Invalid clan URL. Should match the form <https://www.bungie.net/en/ClanV2?groupId=0000000>'});
            return;
        }

        try {
            const name = await linkGuild(interaction.guild.id, groupId);
            await interaction.editReply({content: `Clan \`${name}\` successfully linked`});
        } catch (e) {
            console.error(e);
            await interaction.editReply({content: `Failed to link clan: \`${e.message}\``});
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