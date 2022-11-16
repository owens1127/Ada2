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
            const result = await toggleMentionable(interaction.user.id, mentionable);
            if (result) {
                await interaction.editReply({content: 'You will now be mentioned in this server when you are missing a mod.'});
            } else {
                await interaction.editReply({content: 'You will no longer be mentioned in this server when you are missing a mod.'});
            }
        } catch (e) {
            console.error(e);
            await interaction.editReply({content: `Failed to update mentionable status: \`${e.message}\``});
        }


    }
};