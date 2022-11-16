const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('list all the available commands'),
    async execute(interaction) {
        try {
            const embed = new EmbedBuilder();
            interaction.client.commands.forEach(command => {
                const usage = command.data.options.map(o => {
                    if (o.required) return `[${o.name}]`;
                    else return `(${o.name})`;
                }).join(' ');
                embed.addFields({
                    name: `/${command.data.name} ${usage}`,
                    value: command.data.description
                });
            });
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (e) {
            console.error(e);
            await interaction.editReply(
                { content: `Command failed \`${e.message}\`` });
        }
    }
};