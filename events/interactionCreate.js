module.exports = {
    name: 'interactionCreate',
    execute(interaction) {
        if (interaction.isChatInputCommand()) commandInteraction(interaction);
    },
};

async function commandInteraction(interaction) {
    console.log(
        `${interaction.user.tag} in ${interaction.guild?.name || 'DMs'} #${interaction.channel?.name} triggered an interaction.`);


    const command = interaction.client.commands.get(interaction.commandName) || interaction.client.devCommands.get(interaction.commandName);

    if (!command) return;
    console.log(
        `${interaction.user.tag} used /${interaction.commandName} with params:`);
    console.log(interaction.options._hoistedOptions)

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply(
                {content: 'There was an error while executing this command!', ephemeral: true})
    }
}