const { MessageEmbed } = require('discord.js');
const Client = require('../../index').Client;
const { sysColor, getEmotion } = require('../../angImg');

module.exports.run = async (inter) => {
  const version = inter.options.getString('версия');

  const json = require('../../json/versions.json');

  let jsonText = null;
  const embed = new MessageEmbed()
    .setColor('#9B59B6')
    .setFooter('os:/system/version.info', sysColor('red'))
    .setTimestamp(new Date())
    .setThumbnail(getEmotion('stand'));

  if (version === '0.5') {
    jsonText = json['0.5 beta'];

    embed.setAuthor('Просмотр версии 0.5 beta', sysColor('red'));

    jsonText.forEach((note) => {
      embed.addField('\u200b', note);
    });
  }

  if (version === 'old') {
    embed.setAuthor('Просмотр старых версий < 0.5', sysColor('red'));
    const versions = Object.keys(json);

    versions.forEach((version) => {
      if (Number(version.substr(0, 3)) < 0.5) {
        embed.addField(version, '\u200b', true);
      }
    });
  }

  if (version == undefined) {
    embed.setAuthor('Просмотр версий >= 0.5', sysColor('red'));
    const versions = Object.keys(json);

    versions.forEach((version) => {
      if (Number(version.substr(0, 3)) >= 0.5) {
        if (version === '0.5 beta') {
          embed.addField('0.5', 'beta', true);
        } else {
          embed.addField(version, '\u200b', true);
        }
      }
    });
  }

  if (version != undefined && version !== 'old' && version !== '0.5') {
    jsonText = json[version];

    embed.setAuthor(`Просмотр версии ${version}`, sysColor('red'));

    jsonText.forEach((note) => {
      embed.addField('\u200b', note);
    });
  }

  return await inter.reply({ content: ' ', ephemeral: false, embeds: [embed] });
};

module.exports.help = {
  name: 'version',
  permission: []
};
