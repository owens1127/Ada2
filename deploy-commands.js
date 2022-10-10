import { REST, Routes } from 'discord.js';
import fs from 'node:fs';

const token = process.env.TOKEN
const clientId = process.env.CLIENT_ID

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

const rest = new REST({version: '10'}).setToken(token);

(async () => {
    for (const file of commandFiles) {
        const exports = await import(`./commands/${file}`);
        const command = exports.default;
        commands.push(command.data.toJSON());
    }

    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            {body: commands}
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();