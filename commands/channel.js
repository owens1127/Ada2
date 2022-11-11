const {SlashCommandBuilder, ChannelType, TextChannel} = require('discord.js');
const {updateAnnounceChannel} = require('../database/guilds');
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
            await updateAnnounceChannel(channel.id).then(() => {
                interaction.editReply({content: 'Announcements channel successfully switched to ' + channel.toString()});
            });
        } catch (e) {
            // TODO
            await interaction.editReply({content: 'Failed to update announcement channel'});
        }

    }
};