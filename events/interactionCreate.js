module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        console.log(
            `${interaction.user.tag} in ${interaction.guild.name} #${interaction.channel.name} triggered an interaction.`);

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) return;
        console.log(
            `${interaction.user.tag} used /${interaction.commandName} with params:`);
        console.log(interaction.options._hoistedOptions)

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            try {
                await interaction.reply(
                    {content: 'There was an error while executing this command!', ephemeral: true});
            } catch (e) {
                await interaction.editReply(
                    {content: 'There was an error while executing this command!', ephemeral: true});
            }
        }
    },
};