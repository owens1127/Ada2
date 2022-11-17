const { SlashCommandBuilder, ChannelType, TextChannel, PermissionFlagsBits } = require('discord.js');
const { updateBroadcastChannel } = require('../database/guilds.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Change the channel in which the announcements happen')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
            const updatedChannel = await updateBroadcastChannel(interaction.guild.id, channel);
            await interaction.editReply({
                content: 'Broadcast channel successfully switched to '
                    + updatedChannel.toString()
            });
        } catch (e) {
            console.error(e);
            await interaction.editReply(
                { content: `Failed to update broadcast channel: \`${e.message}\`` });
        }

    }
};