const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const { colorFromEnergy } = require('../bungie-net-api/util')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('mods')
        .setDescription('Queries Ada-1 for her current mods'),
    async execute(interaction) {
        await interaction.deferReply()
        const { getAdaCombatModsSaleDefinitons } = await import('../bungie-net-api/vendor.mjs');
        const mods = (await getAdaCombatModsSaleDefinitons()).map(d => {
            console.log(d)
            return {
                // TODO map name to DestinySandboxPerkDefinition?
                name: d.displayProperties?.name,
                icon: 'https://bungie.net' + d.displayProperties?.icon,
                kind: d.itemTypeDisplayName,
                description: [d.displayProperties?.description, d.tooltipNotifications[0].displayString].join('\n'),
                energy: d.plug.energyCost,
            }
        });
        const embeds = mods.map(m => {
            return new EmbedBuilder()
                .setTitle(m.name)
                .setDescription(m.description)
                .setImage(m.icon)
                .setColor(colorFromEnergy(m.energy));
        })
        await interaction.editReply({embeds});

    }
};