const { SlashCommandBuilder, ChannelType, TextChannel, PermissionFlagsBits } = require(
    'discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('Evalulate some code')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Stuff to eval')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply()
        const query = interaction.options.getString('query');
        const { client } = interaction;
        try {
            const str = JSON.stringify(eval(query), null, 2) || 'void';
            if (str.length > 20_000) {
                console.log(str);
                return await interaction.editReply('Stringified eval length > 20,000');
            }
            await interaction.editReply('\`\`\`' + str.substring(0, 1994) + '\`\`\`');

            let i = 1;
            while (str.length > 2000 * i) {
                await interaction.channel.send('\`\`\`' + str.substring(1994 * i, 1994 * (i+1)) + '\`\`\`');
                i++;
            }
        } catch (e) {
            await interaction.editReply(`Eval caught an error: ${e.message}`);
            console.log(e);
        }
    }
};