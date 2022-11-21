'use strict';
const { Client, GatewayIntentBits, Collection, Options } = require('discord.js');
const fs = require('node:fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN

const basicSweeper = {
    interval: 900, // 15 minutes
    filter: () => {
        return () => true // remove all from cache
    } 
}
// Create a new main instance
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds],
    makeCache: Options.cacheWithLimits({
		...Options.DefaultMakeCacheSettings,
        // https://github.com/discordjs/discord.js/tree/main/packages/discord.js/src/managers
		ReactionManager: 0,
        VoiceStateManager: 0,
        PresenceManager: 0,
        GuildStickerManager: 0,
        UserManager: {
            maxSize: 1000,
			keepOverLimit: user => user.id === client.user.id,
        },
		GuildMemberManager: {
			maxSize: 1000,
			keepOverLimit: member => member.id === client.user.id,
		},
	}),
    sweepers: {
        autoModerationRules: basicSweeper,
        applicationCommands: basicSweeper,
        bans: basicSweeper,
        emojis: basicSweeper,
        invites: basicSweeper,
        messages: {
			interval: 1800,
			lifetime: 3600,	
		},
        guildMembers: {
			interval: 900,
			filter: () => {
                const { missing } = JSON.parse(fs.readFileSync('./local/reminders.json'));
                return (value, key) => !(key in missing) && value.kickable
            }
		},
        presences: basicSweeper,
        reactions: basicSweeper,
        stageInstances: basicSweeper,
        stickers: basicSweeper,
        threadMembers: basicSweeper,
		threads: basicSweeper,
		users: basicSweeper,
        voiceStates: basicSweeper,
	},

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
client.login(token);