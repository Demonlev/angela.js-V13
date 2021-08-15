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
    },
    {
      name: 'bonk',
      description: 'Бонькает сотрудника',
      options: [
        {
          name: 'хорни',
          type: 'BOOLEAN',
          description: 'Цель - хорни?',
          require: false
        },
        {
          name: 'цель',
          type: 'USER',
          description: 'Сотрудник, которого бонькнут',
          require: false
        },
        {
          name: 'бонькер',
          type: 'USER',
          description: 'Сотрудник, который будет бонькать',
          require: false
        }
      ]
    },
    {
      name: 'eat',
      description: 'Сотрудник ждёт еды',
      options: [
        {
          name: 'цель',
          type: 'USER',
          description: 'Сотрудник, которого накормят',
          require: false
        }
      ]
    },
    {
      name: 'aaam',
      description: 'Сотрудник кормят',
      options: [
        {
          name: 'цель',
          type: 'USER',
          description: 'Сотрудник, которого кормят',
          require: false
        }
      ]
    },
    {
      name: 'slap',
      description: 'Шлёпает сотрудника',
      options: [
        {
          name: 'цель',
          type: 'USER',
          description: 'Сотрудник, которого отшлёпают',
          require: false
        },
        {
          name: 'шлёпальщик',
          type: 'USER',
          description: 'Сотрудник, который будет шлёпать',
          require: false
        }
      ]
    }
  ];

  await Client.guilds.cache.get(guildId)?.commands.set(data);
}

module.exports = { createCommand };
