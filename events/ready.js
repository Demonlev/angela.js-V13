const Client = require('../index').Client;
const guild = require('../index').guild;
const { createCommand } = require('../dataHandler');

const musicQueue = require('../index').musicQueue;

Client.on('ready', async () => {
  Client.user.setPresence({ activities: [{ name: 'звуки отчаяния и криков', type: 'LISTENING' }] });
  console.log(`${Client.user.tag} is online!`);

  musicQueue.set('queue', []);

  createCommand(Client, guild);
});
