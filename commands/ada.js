const { SlashCommandBuilder } = require('discord.js');
const bungieClient = require('../bungie-net-api/client');
const { BungieMembershipType } = require('oodestiny/schemas');
const { DestinyComponentType } = require('oodestiny/schemas/Destiny');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ada')
        .setDescription('Tests the BungieNet API and logs stuff')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('The input in some capacity')
                .setRequired(false)),
    async execute(interaction) {
        bungieClient.Destiny2.GetPublicVendors({
            components: [DestinyComponentType.VendorSales]
        })
            .then((data) => {
                console.log(data.Response)
            })
            .catch(console.error);

        await interaction.reply({ content: 'Ada 1!', ephemeral: true });

    },
};