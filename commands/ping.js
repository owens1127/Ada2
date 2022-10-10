import { SlashCommandBuilder } from 'discord.js';
import { setTimeout as wait } from 'node:timers/promises';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('The input to echo back')
                .setRequired(false)),
    async execute(interaction) {
        const string = interaction.options.getString('input');
        await interaction.deferReply({ ephemeral: true });
        await interaction.editReply({ content: 'Pong!', ephemeral: true });
        await wait(2000);
        await interaction.followUp('Pong global');
        const message = await interaction.fetchReply();
        if (string)  await interaction.followUp('Pong ' + string);

    },
};