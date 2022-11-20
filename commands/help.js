const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('list all the available commands'),
    async execute(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('Commands for Ada-2')
                .setColor('#ceecf2')
                .setThumbnail(interaction.client.user.avatarURL() || interaction.client.user.defaultAvatarURL)
                .setFooter({
                    
                })
                .setTimestamp(Date.now());
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
            embed.addFields({
                name: 'Join the Bot Development server if you have any questions!',
                value: 'https://discord.gg/ezZapxh64y',
                inline: false
            })
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (e) {
            console.error(e);
            await interaction.editReply(
                { content: `Command failed \`${e.message}\`` });
        }
    }
};