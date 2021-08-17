const Client = require('../index').Client;
const guild = require('../index').guild;
const { createCommand } = require('../dataHandler');

Client.on('ready', async () => {
  Client.user.setPresence({ activities: [{ name: 'звуки отчаяния и криков', type: 'LISTENING' }] });
  console.log(`${Client.user.tag} is online!`);

  createCommand(Client, guild);
});
