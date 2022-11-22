const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require(
    'discord.js');
const { getAllChannels } = require('../database/guilds');

const confirmation = {
    yes: 'broadcast-yes',
    no: 'broadcast-no'
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('broadcast')
        .setDescription('Send an announcement')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('message')
                .setDescription('Message to send')
                .setRequired(true)),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Announcement from the Developer')
            .setThumbnail(interaction.client.user.avatarURL() || interaction.client.user.defaultAvatarURL)
            .setDescription(interaction.options.getString('message'))
            .setFooter({text: `Sent by ${interaction.member.user.username}`})
            .setTimestamp(Date.now());
        const row = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId(confirmation.yes)
					.setStyle(ButtonStyle.Success)
                    .setLabel('Yes'),
                new ButtonBuilder()
                    .setCustomId(confirmation.no)
                    .setStyle(ButtonStyle.Danger)
                    .setLabel('No')
			);
        await interaction.reply({embeds: [embed], components: [row], fetchReply: true })
        .then((message) => {
            const filter = i => {
                i.deferUpdate();
                return i.user.id === interaction.user.id;
            };
            
            message.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 60000 })
                .then(async i => {
                    if (i.customId === confirmation.yes) {
                        interaction.editReply({embeds: [embed], 
                            content: `Sending broadcasts...`, 
                            components: []})
                        const results = await sendBroadcast(embed, interaction.client);
                        console.log(results);
                        interaction.editReply({embeds: [embed], 
                            content: `Broadcasts sent to ${results.successes} / ${results.errors + results.successes} guilds`, 
                            components: []})
                    } else if (i.customId === confirmation.no) {
                        interaction.editReply({embeds: [embed], content: 'Message NOT sent', components: []})
                    }
                })
                .catch(err => console.log(`No interactions were collected.`));
        })
        .catch(console.error);
    }
};

async function sendBroadcast(embed, client) {
    const channelIds = await getAllChannels().catch(console.error)
    let errors = 0;
    let successes = 0;
    const { channels } = client;
    await Promise.all(channelIds.map(id => {
        return channels.fetch(id).then(channel => channel.send({embeds: [embed]})
            .then(m => successes++)
            .catch(e => errors++))
    }))
    return {errors, successes};
}