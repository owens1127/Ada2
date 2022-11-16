const {SlashCommandBuilder} = require('discord.js');
const {linkAccounts} = require('../database/users');
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
                .setDescription('Whether or not you want to receive mentions from the bot (default false)')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply()
        /** @type string */
        const name = interaction.options.getString('bungie-name');
        const mentionable = interaction.options.getBoolean('mentionable') || false;
        try {
            const bungieName = await linkAccounts(name, interaction.user.id, mentionable)
            await interaction.editReply({
                    content: `Discord account ${interaction.user.toString()} successfully linked to Bungie.net account \`${bungieName}\` with mentions set to \`${mentionable}\``});
        } catch (e) {
            console.error(e);
            await interaction.editReply({content: `Failed to link account: \`${e.message}\``});
        }

    }
};