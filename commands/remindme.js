const { SlashCommandBuilder } = require('discord.js');
const { updateReminderTime, disableReminders } = require('../database/users');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remindme')
        .setDescription('What time should the bot remind you about a mod?')
        .addSubcommand(subcommand =>
            subcommand
                .setName('time')
                .setDescription('Change the time you are reminded')
                .addNumberOption(option =>
                    option.setName('delta')
                        .setDescription('A number from between -23.99 and 23.99, ' +
                            'the delta from reset. Ex: -3.5 means 3.5h BEFORE reset')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable reminders from the bot')),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'time') {
            /** @type number */
            const delta = interaction.options.getNumber('delta');
            if (delta <= -24 || delta >= 24) {
                return await interaction.reply(
                    { content: 'Please enter a valid number between -23.99 and 23.99' });
            }
            await interaction.deferReply();
            try {
                const timeString = await updateReminderTime(interaction.user.id, delta);
                await interaction.editReply(
                    { content: `Updated reminder time to \`${timeString}\`` });
            } catch (e) {
                console.error(e);
                await interaction.editReply(
                    { content: `Failed to update reminder time: \`${e.message}\`` });
            }
        } else if (interaction.options.getSubcommand() === 'disable') {
            await interaction.deferReply();
            try {
                await disableReminders(interaction.user.id)
                await interaction.editReply(
                    { content: `Reminders disabled` })
            } catch (e) {
                console.error(e);
                await interaction.editReply(
                    { content: `Failed to disable reminders: \`${e.message}\`` });
            }
        }
    }
};