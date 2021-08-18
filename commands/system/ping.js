const { MessageEmbed } = require('discord.js');
const Client = require('../../index').Client;
const { sysColor, getEmotion } = require('../../angImg');

module.exports.run = async (inter) => {
  const embed = new MessageEmbed()
    .setColor('#9B59B6')
    .setFooter('os:/system/ping.info', sysColor('red'))
    .setTimestamp(new Date())
    .setThumbnail(getEmotion('stand'))
    .setAuthor('Состояние серверов', sysColor('red'));
  const api = Client.ws.ping;
  let message = 'Everything is working.';
  if (api > 1000) {
    message = 'Discord API overloaded';
  }
  if (api > 2500) {
    message = 'Discord servers were destroyed.';
  }
  embed.addField(`[Discord API] - ${api}мс`, message);
  return await inter.reply({ content: '\u200b', ephemeral: false, embeds: [embed] });
};

module.exports.help = {
  name: 'ping',
  permission: []
};
