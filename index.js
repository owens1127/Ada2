'use strict';
const { Client, GatewayIntentBits, Collection, Options, ActivityType } = require('discord.js');
const fs = require('node:fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN

// Create a new main instance
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
    presence: {
        status: 'online',
        activities: [{
            name: 'Ada-1\'s inventory',
            type: ActivityType.Watching
        }]
    },
    makeCache: Options.cacheWithLimits({
        ApplicationCommandManager: 0,
        AutoModerationRuleManager: 0,
        BaseGuildEmojiManager: 0,
        GuildApplicationCommandManager: 0,
        GuildBanManager: 0,
        GuildEmojiManager: 0,
        GuildForumThreadManager: 0,
        GuildInviteManager: 0,
        GuildMemberManager: {
            maxSize: 100,
            keepOverLimit: member => member.id === client.user.id
        },
        GuildScheduledEventManager: 0,
        GuildStickerManager: 0,
        GuildTextThreadManager: 0,
        MessageManager: 150,
        PresenceManager: 0,
        ReactionManager: 0,
        ReactionUserManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        UserManager: {
            maxSize: 1000,
            keepOverLimit: user => user.id === client.user.id
        },
        VoiceStateManager: 0
    }),
    sweepers: {
        messages: {
            interval: 1800,
            lifetime: 3600
        },
        guildMembers: {
            interval: 900,
            filter: () => {
                const { missing } = JSON.parse(fs.readFileSync('./local/reminders.json'));
                return (value, key) => !(key in missing) && value.kickable
            }
        }
    }
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    // Set a new item in the Collection with the key as the command name and the value as the
    // exported module
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(
            `[WARNING] The command ${command} is missing a required "data" or "execute" property.`);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    try {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    } catch (e) {
        e.type = 'EVENT_ERROR'
        console.error(e);
    }
}

client.devCommands = new Collection();
const devCommandsPath = path.join(__dirname, 'dev-commands');
const devCommandFiles = fs.readdirSync(devCommandsPath).filter(file => file.endsWith('.js'));

for (const file of devCommandFiles) {
    const command = require(path.join(devCommandsPath, file));
    // Set a new item in the Collection with the key as the command name and the value as the
    // exported module
    if ('data' in command && 'execute' in command) {
        client.devCommands.set(command.data.name, command);
    } else {
        console.log(
            `[WARNING] The command ${command} is missing a required "data" or "execute" property.`);
    }
}

// Login to Discord with your main's token
client.login(token).catch(console.error);