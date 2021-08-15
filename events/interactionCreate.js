const Client = require('../index').Client;

Client.on('interactionCreate', async (inter) => {
  if (inter.isCommand()) {
    let slash = Client.SlashCommands.get(inter.commandName);
    if (slash) slash.run(inter);
  }
});
