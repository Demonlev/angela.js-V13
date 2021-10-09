const Client = require('../index').Client;
const { MessageEmbed } = require('discord.js');
const { sysColor, getEmotion } = require('../angImg');

Client.on('guildMemberAdd', async (event) => {
  const embed = new MessageEmbed();
  embed.setFooter('os:/event/welcome.lc', sysColor('red'));
  embed.setColor('#5865F2');
  embed.setTimestamp(new Date());

  const welcomes = require('../json/memberJoinLeave.json').welcome;

  const rand = Math.floor(Math.random() * (welcomes.length + 1)) + 0;

  const data = welcomes[rand];

  const desc = data[1].replace(/{}/, event.user.username);

  embed.setTitle(`Новый сотрудник - ${event.user.username}`);
  embed.setDescription(desc);
  embed.setThumbnail(data[0]);

  await event.guild.systemChannel.send({ content: '\u200b', embeds: [embed] });
});
