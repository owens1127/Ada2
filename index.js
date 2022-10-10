// Require the necessary discord.js classes
import { Client, GatewayIntentBits, Collection} from 'discord.js';
import fs from 'node:fs';

const token = process.env.TOKEN

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
const commandsPath = './commands';
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = './' + commandsPath + '/' + file;
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    import(filePath).then((exports) => {
        const command = exports.default;
        client.commands.set(command.data.name, command);
    });
}

const eventsPath = './events';
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = './' + eventsPath + '/' + file;
    import(filePath).then((exports) => {
        const event = exports.default;
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    });
}

// Login to Discord with your client's token
client.login(token);