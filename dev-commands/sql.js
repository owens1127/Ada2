const { SlashCommandBuilder, ChannelType, TextChannel, PermissionFlagsBits } = require(
    'discord.js');
const { dbQuery } = require('../database/util.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sql')
        .setDescription('SQL Query')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Stuff to eval')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();
        await dbQuery(interaction.options.getString('query'))
        .then(async data => {
            await interaction.editReply('\`\`\`' + JSON.stringify(data, null, 2).substring(0,1994) + '\`\`\`');

            let i = 1;
            while (str.length > 2000 * i) {
                await interaction.channel.send('\`\`\`' + str.substring(1994 * i, 1994 * (i+1)) + '\`\`\`');
                i++;
            }
        }).catch(e => {
            interaction.editReply(JSON.stringify(e, null, 2));
        });
    }
};