const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'guildCreate',
    on: true,
    execute(guild) {
        const { id, name, channels } = guild;
        console.log('Joined guild:')
        console.log({ id, name });
        sendGreeting(channels, guild)
    }
};

function sendGreeting(channels, guild) {
    let welcome;
    const textChannels = channels.cache.filter(c => c.type === 0);
    if (guild.systemChannelId) {
        welcome = textChannels.get(guild.systemChannelId)
    } else if (guild.widgetChannelId) {
        welcome = textChannels.get(guild.widgetChannelId)
    } else if (textChannels.find(c => c.name === 'general')) {
        welcome = textChannels.find(c => c.name === 'general');
    } else {
        welcome = textChannels.filter(c => !c.nsfw).first();
    }
    welcome.send({
        embeds: [
            new EmbedBuilder()
                .setTitle('Ada-2 Discord Bot')
                .setColor('#ceecf2')
                .setThumbnail(guild.client.user.avatarURL() || guild.client.user.defaultAvatarURL)
                .addFields({
                    name: 'Server Admins',
                    value: 'Setup the bot with `/clan` to link it to your Destiny 2 clan and '
                        + 'then choose a broadcast channel for the daily post with `/channel`',
                    inline: false
                }, {
                    name: 'All Clan Members!',
                    value: 'Want to be pinged when you\'re missing a mod from Ada? `/register` '
                        + 'with your Bungie Name and do `/mentions true` to never miss out!',
                    inline: false
                }, {
                    name: 'Join the Bot Development server if you have any questions!',
                    value: 'https://discord.gg/ezZapxh64y',
                    inline: false
                })
                .setFooter({
                    text: 'Developed by Newo'
                })
        ]
    })
        .catch(console.error)
}