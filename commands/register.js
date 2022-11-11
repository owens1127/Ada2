const {SlashCommandBuilder} = require('discord.js');
const {linkAccounts} = require('../database/users');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Link your discord account to a Bungie profile')
        .addStringOption(option =>
            option.setName('bungie-name')
                .setDescription('your bungie name, i.e. Newo#9010')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply()
        /** @type string */
        const name = interaction.options.getString('bungie-name');
        try {
            await linkAccounts(name, interaction.user.id).then((name) => {
                interaction.editReply({
                    content: `Discord account ${interaction.user.toString()} successfully linked to Bungie.net account \`${name}\``});
            });
        } catch (e) {
            await interaction.editReply({content: `Failed to link account: \`${e.message}\``});
        }

    }
};