const { SlashCommandBuilder } = require('discord.js');
const { linkAccounts } = require('../database/users');
const { remindString } = require('../commands/remindme.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Link your discord account to a Bungie profile')
        .addStringOption(option =>
            option.setName('bungie-name')
                .setDescription('your bungie name, i.e. Newo#9010')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('mentionable')
                .setDescription(
                    'Whether or not you want to receive mentions from the bot (default false)')
                .setRequired(false))
        .addNumberOption(option =>
            option.setName('reminder-time')
                .setDescription('What time should the bot remind you about missing mods?')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply()
        /** @type string */
        const name = interaction.options.getString('bungie-name');
        const mentionable = interaction.options.getBoolean('mentionable') || false;
        try {
            const bungieName = await linkAccounts(name, interaction.user.id, interaction.guild, mentionable)
            await interaction.editReply({
                content: `Discord account ${interaction.user.toString()} successfully linked to Bungie.net account \`${bungieName}\` with mentions set to \`${mentionable}\``
            });
            const delta = interaction.options.getNumber('reminder-time');
            if (delta) {
                try {
                    const str = await remindString(interaction.user.id, delta)
                    await interaction.followUp({ content: `Updated reminder time to ${str}.` })
                } catch (e) {
                    console.error(e);
                    await interaction.followUp({ content: `Failed to set reminder time: \`${e.message}\`. You can retry with \`/remind\`.`})
                }
            }
        } catch (e) {
            console.error(e);
            await interaction.editReply({ content: `Failed to link account: \`${e.message}\`` });
        }

    }
};