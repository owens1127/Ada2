const { SlashCommandBuilder, ChannelType, TextChannel } = require('discord.js');
const { updateAnnounceChannel } = require('../database/guilds.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Change the channel in which the announcements happen')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to announce in')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply()
        /** @type {TextChannel} */
        const channel = interaction.options.getChannel('channel');
        try {
            const updatedChannel = await updateAnnounceChannel(interaction.guild.id, channel);
            await interaction.editReply({
                content: 'Announcements channel successfully switched to '
                    + updatedChannel.toString()
            });
        } catch (e) {
            await interaction.editReply(
                { content: `Failed to update announcement channel: \`${e.message}\`` });
        }

    }
};