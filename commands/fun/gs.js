const { CommandInteraction, MessageEmbed } = require('discord.js');
const Client = require('../../index').Client;
const { sysColor } = require('../../angImg');
const firebase = require('firebase/app');
require('firebase/firestore');

/**
 * @param {CommandInteraction} inter
 */
module.exports.run = async (inter) => {
  const interString = inter.options.getString('тег');
  if (!interString) {
    return await inter.reply({ content: 'Введите тег', ephemeral: true });
  }
  const searchString = interString.substr(0, 1).toUpperCase() + interString.substr(1);
  const resultDoc = await firebase.firestore().collection('albums').where('name', '==', searchString).limit(1).get();

  if (resultDoc.empty) {
    return await inter.reply({ content: 'Ничего не найдено.', ephemeral: true });
  }
  const cardsIdArray = resultDoc.docs[0].data().cardsId;

  const cardId = cardsIdArray[Math.floor(Math.random() * (cardsIdArray.length - 0) + 0)];

  const card = await firebase.firestore().collection('cards').where('id', '==', cardId).limit(1).get();

  const cardInfo = card.docs[0].data();

  const embed = new MessageEmbed()
    .setImage(cardInfo.fileURL)
    .setColor('#9B59B6')
    .setFooter('os:/fun/gs.info', sysColor('red'))
    .addField('https://goodsearch.vercel.app/card/' + cardInfo.id, '\u200b');

  return await inter.reply({ content: '\u200b', ephemeral: false, embeds: [embed] });
};

module.exports.help = {
  name: 'gs',
  permission: []
};
