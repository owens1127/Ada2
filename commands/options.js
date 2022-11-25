const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { toggleTipsOption } = require('../database/guilds');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('options')
        .setDescription('Manage options for the guild')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addNumberOption(option => option.setName('tips').setDescription('Disable or enable tips')
            .setRequired(false)
            .addChoices({ name: 'enable', value: 1 },
                { name: 'disable', value: 0 })
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const message = [];
        const tips = interaction.options.getNumber('tips');
        if (tips !== null) {
            try {
                await toggleTipsOption(interaction.guild.id, !!tips)
                message.push(`Toggled tips option to \`${!!tips}\`.`);
            } catch (e) {
                message.push(`Failed to toggle tips option: \`${e.message}\``);
            }
        }
        await interaction.editReply({ content: message.join(' ') || 'No options changed'})
    }
};