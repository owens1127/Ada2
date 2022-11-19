const { SlashCommandBuilder } = require('discord.js');
const { modToEmbed } = require('../events/dailyReset')
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mods')
        .setDescription('Queries Ada-1 for her current mods'),
    async execute(interaction) {
        await interaction.deferReply()
        try {
            const mods = require('../local/mods.json');
            if (!Object.keys(mods).length) return await interaction.editReply(
                'Ada is not currently selling any combat style mods.');

            const embeds = await Promise.all(Object.keys(mods).map(k => modToEmbed(mods[k])));
            console.log(Object.keys(mods).map(k => mods[k].inventoryDefinition.displayProperties.name));
            await interaction.editReply({ embeds });
        } catch (e) {
            console.error(e);
            await interaction.editReply(
                { content: `Failed to list the daily mods: \`${e.message}\`` });
        }

    }
};