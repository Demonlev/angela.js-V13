async function createCommand(Client, guildId) {
  const data = [
    {
      name: 'ping',
      description: 'Ping <-=-> Pong'
    },
    {
      name: 'echo',
      description: 'Эхо',
      options: [
        {
          name: 'текст',
          type: 'STRING',
          description: 'Текст, который повторит бот',
          require: true
        }
      ]
    }
  ];

  await Client.guilds.cache.get(guildId)?.commands.set(data);
}

module.exports = { createCommand };
