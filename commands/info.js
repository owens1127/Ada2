const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { dbQuery } = require('../database/util.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Information about you or the guild')
        .addSubcommand(subcommand =>
            subcommand
                .setName('me')
                .setDescription('Information about yourself'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Information about your server')),
    async execute(interaction) {
        await interaction.deferReply();
        if (interaction.options.getSubcommand() === 'me') {
            const query = `SELECT *
                           FROM ${config.userTable}
                           WHERE discord_id = ${interaction.member.id}`
            await dbQuery(query).then(async data => {
                const { client } = interaction;
                const info = data[0];
                if (!info) {
                    return interaction.editReply(
                        { content: 'You are not registered with the bot' })
                }
                const raw = `\`\`\`${JSON.stringify(info, null, 2)}\`\`\``
                const [user, guild] = await Promise.all([
                    client.users.fetch(info.discord_id).then(g => g.toString())
                        .catch(() => 'Not available'),
                    info.primary_guild ? client.guilds.fetch(info.primary_guild).then(g => g.name)
                        .catch(() => 'Not available') : 'Not Set'
                ])
                const fields = [{
                    name: 'User',
                    value: user
                }, {
                    name: 'Primary Server',
                    value: guild
                }, {
                    name: 'Bungie Name',
                    value: info.destiny_cached_username
                }, {
                    name: 'Mentionable',
                    value: (!!info.mentionable).toString()
                }, {
                    name: 'Reminder Time',
                    value: info.remind_time + ' hours relative to reset'
                }, {
                    name: 'Raw',
                    value: raw
                }]
                const embed = new EmbedBuilder()
                    .setTitle(`Information for ${interaction.member.user.tag}`)
                    .setTimestamp(Date.now())
                    .addFields(fields)
                    .setFooter({
                        icon: interaction.client.user.displayAvatarURL(),
                        text: 'Provided by Ada-2'
                    })
                    .setThumbnail(interaction.member.user.displayAvatarURL())
                return interaction.editReply({ embeds: [embed], ephemeral: true })
            })
        } else if (interaction.options.getSubcommand() === 'server') {
            const query = `SELECT *
                           FROM ${config.guildTable}
                           WHERE guild_id = ${interaction.guild.id}`
            await dbQuery(query).then(async data => {
                const { client } = interaction;
                const info = data[0];
                if (!info) {
                    return interaction.editReply(
                        { content: 'This server is not yet registered' })
                }
                const raw = `\`\`\`${JSON.stringify(info, null, 2)}\`\`\``
                const [guild, channel, clan] = await Promise.all([
                    client.guilds.fetch(info.guild_id).then(g => g.name)
                        .catch(() => 'Not available'),
                    info.broadcast_channel ? client.channels.fetch(info.broadcast_channel)
                        .then(c => c.toString())
                        .catch(() => 'Not available') : 'Not Set',
                    info.clan_id ? import('../bungie-net-api/clan.mjs').then(imp => imp.getClan(info.clan_id))
                        .then(gv2 => gv2.name) : 'Not Set'
                ])
                const fields = [{
                    name: 'Server',
                    value: guild
                }, {
                    name: 'Broadcast Channel',
                    value: channel
                }, {
                    name: 'Clan',
                    value: clan
                }, {
                    name: 'Raw',
                    value: raw
                }]
                const embed = new EmbedBuilder()
                    .setTitle(`Information for ${interaction.guild.name}`)
                    .setTimestamp(Date.now())
                    .addFields(fields)
                    .setFooter({
                        icon: interaction.client.user.displayAvatarURL(),
                        text: 'Provided by Ada-2'
                    })
                    .setThumbnail(interaction.guild.iconURL())
                return interaction.editReply({ embeds: [embed], ephemeral: true })
            })
        }
    }
};