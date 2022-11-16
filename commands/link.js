const {SlashCommandBuilder} = require('discord.js');
const {linkGuild} = require('../database/guilds');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link this server to a clan')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('link to clan page')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply()
        /** @type string */
        const groupId = groupIdFromLink(interaction.options.getString('url'));
        if (!groupId) {
            await interaction.editReply(
                {content: 'Invalid clan URL. Should match the form https://www.bungie.net/en/ClanV2?groupid=0000000'});
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

function groupIdFromLink(link) {
    try {
        return new URL(link).searchParams.get('groupid');
    } catch (e) {
        return null;
    }
}