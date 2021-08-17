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
    },
    {
      name: 'version',
      description: 'Показывает изменения в боте.',
      options: [
        {
          name: 'версия',
          type: 'STRING',
          description: '0.5 | old',
          require: false
        }
      ]
    },
    {
      name: 'music',
      description: 'Настройки музыки.',
      options: [
        {
          name: 'play',
          type: 'SUB_COMMAND',
          description: 'Воспроиводит музыку.',
          require: true,
          options: [
            {
              name: 'поиск',
              type: 'STRING',
              description: 'Укажите ссылку на ютубе или название видео.',
              require: true
            }
          ]
        },
        {
          name: 'stop',
          type: 'SUB_COMMAND',
          description: 'Останавливает музыку и выходит из канала.',
          require: true
        },
        // {
        //   name: 'queue',
        //   type: 'SUB_COMMAND',
        //   description: 'Показывает список музыки в очереди.',
        //   require: true
        // }
        {
          name: 'skip',
          type: 'SUB_COMMAND',
          description: 'Пропускает текущий трек.',
          require: true
        }
      ]
    },
    {
      name: 'watch',
      description: 'Совместный просмотр ютуба.'
    }
  ];

  await Client.guilds.cache.get(guildId)?.commands.set(data);
}

module.exports = { createCommand };
