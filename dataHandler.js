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
          required: true
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
          required: false
        },
        {
          name: 'цель',
          type: 'USER',
          description: 'Сотрудник, которого бонькнут',
          required: false
        },
        {
          name: 'бонькер',
          type: 'USER',
          description: 'Сотрудник, который будет бонькать',
          required: false
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
          required: false
        }
      ]
    },
    {
      name: 'aaam',
      description: 'Сотрудника кормят',
      options: [
        {
          name: 'цель',
          type: 'USER',
          description: 'Сотрудник, которого кормят',
          required: false
        }
      ]
    },
    {
      name: 'up',
      description: 'Сказать сотруднику проснуться',
      options: [
        {
          name: 'цель',
          type: 'USER',
          description: 'Сотрудник, которого нужно разбудить',
          required: false
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
          required: false
        },
        {
          name: 'шлёпальщик',
          type: 'USER',
          description: 'Сотрудник, который будет шлёпать',
          required: false
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
          description: '0.5.1 | 0.5.0 | old | all',
          required: false
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
              required: true
            }
          ]
        },
        {
          name: 'pause',
          type: 'SUB_COMMAND',
          description: 'Останавливает музыку.',
          require: true,
          options: [
            {
              name: 'пауза',
              type: 'BOOLEAN',
              description: 'true - останавливает / false - включает',
              required: true
            }
          ]
        },
        {
          name: 'queue',
          type: 'SUB_COMMAND',
          description: 'Показывает список музыки в очереди.',
          require: true
        },
        {
          name: 'skip',
          type: 'SUB_COMMAND',
          description: 'Пропускает текущий трек.',
          require: true
        },
        {
          name: 'leave',
          type: 'SUB_COMMAND',
          description: 'Покидает канал.',
          require: true
        }
      ]
    },
    {
      name: 'watch',
      description: 'Совместный просмотр ютуба.'
    },
    {
      name: 'gs',
      description: 'Рандомные картинки.',
      options: [
        {
          name: 'тег',
          type: 'STRING',
          description: 'Введите тег. Популярные теги: мем, кот, кошка, рыба, птица, акула, пиксель, змея.',
          required: true
        }
      ]
    },
    {
      name: 'eval',
      description: 'Превращает строку в js код и возвращает результат или ошибку',
      options: [
        {
          name: 'код',
          type: 'STRING',
          description: 'Введите код.',
          required: true
        }
      ]
    }
  ];

  await Client.guilds.cache.get(guildId)?.commands.set(data);
}

module.exports = { createCommand };
