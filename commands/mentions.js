const {SlashCommandBuilder, ChannelType} = require('discord.js');
const {toggleMentionable} = require('../database/users');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('mentions')
        .setDescription('Enable or disable personal mentions')
        .addBooleanOption(option =>
            option.setName('mentionable')
                .setDescription('Whether or not you want to receive mentions from the bot')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply()
        /** @type boolean */
        const mentionable = interaction.options.getBoolean('mentionable');
        try {
            await toggleMentionable(interaction.user.id).then(() => {
                interaction.editReply({content: 'Personal mentions set to: ' + mentionable});
            })
        } catch (e) {
            // TODO
            await interaction.editReply({content: 'Failed to update mentionable status'});
        }


    }
};