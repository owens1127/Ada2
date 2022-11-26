const { SlashCommandBuilder } = require('discord.js');
const { modToEmbed } = require('../events/dailyReset')
const fs = require('fs');
const { nextReset } = require('../misc/util.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mods')
        .setDescription('Queries Ada-1 for her current mods'),
    async execute(interaction) {
        await interaction.deferReply()
        try {
            const time = nextReset();
            time.setUTCHours(config.UTCResetHour)
            const mods = JSON.parse(fs.readFileSync('./local/mods.json', 'utf8'));
            if (!Object.keys(mods).length) return await interaction.editReply(
                `Ada is not currently selling any combat style mods. Next Reset: <t:${time.getTime()/1000}:R>`);

            const embeds = await Promise.all(Object.keys(mods).map(async k => (await modToEmbed(mods[k])).addFields({
                name: 'Next Refresh',
                value: `<t:${time.getTime()/1000}:R>`
            })));
            console.log(Object.keys(mods).map(k => mods[k].inventoryDefinition.displayProperties.name));
            await interaction.editReply({ embeds });
        } catch (e) {
            console.error(e);
            await interaction.editReply(
                { content: `Failed to list the daily mods: \`${e.message}\`` });
        }

    }
};