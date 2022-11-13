const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { colorFromEnergy } = require('../bungie-net-api/util')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mods')
        .setDescription('Queries Ada-1 for her current mods'),
    async execute(interaction) {
        await interaction.deferReply()
        const { getAdaCombatModsSaleDefinitons } = await import('../bungie-net-api/vendor.mjs');
        const mods = (await getAdaCombatModsSaleDefinitons()).map(d => {
            return {
                // TODO map name to DestinySandboxPerkDefinition?
                name: d.inventoryDefinition.displayProperties?.name,
                icon: 'https://bungie.net' + d.inventoryDefinition.displayProperties?.icon,
                kind: d.inventoryDefinition.itemTypeDisplayName,
                description: [d.inventoryDefinition.displayProperties?.description,
                    d.inventoryDefinition.tooltipNotifications[0].displayString].join('\n'),
                energy: d.inventoryDefinition.plug.energyCost
            }
        });
        const embeds = mods.map(m => {
            return new EmbedBuilder()
                .setTitle(m.name)
                .setDescription(m.description)
                .setImage(m.icon)
                .setColor(colorFromEnergy(m.energy));
        })
        await interaction.editReply({ embeds });

    }
};