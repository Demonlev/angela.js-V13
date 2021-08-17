const { DiscordTogether } = require('discord-together');
const { CommandInteraction } = require('discord.js');
const { Client } = require('../../index');

const discordTogether = new DiscordTogether(Client);

/**
 * @param {CommandInteraction} inter
 */
module.exports.run = async (inter) => {
  const channel_id = inter.member.voice.channelId;

  if (channel_id) {
    discordTogether.createTogetherCode(channel_id, 'youtube').then((x) => {
      inter.reply({ content: '**!!! НЕ РАБОТАЕТ НА ТЕЛЕФОНЕ !!!**\n' + x.code });
    });
  } else {
    return await inter.reply({
      content: 'Зайдите в голосовой канал, чтобы использовать эту команду.',
      ephemeral: true
    });
  }
};

module.exports.help = {
  name: 'watch',
  permission: []
};
