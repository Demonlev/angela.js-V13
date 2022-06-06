const { CommandInteraction, MessageEmbed } = require("discord.js");
const Client = require("../../index").Client;
const { sysColor } = require("../../angImg");
const firebase = require("firebase/app");
require("firebase/firestore");

/**
 * @param {CommandInteraction} inter
 */
module.exports.run = async (inter) => {
  const interString = inter.options.getString("тег_ид");
  if (!interString) {
    return await inter.reply({
      content: "Введите тег или id#<число>",
      ephemeral: true,
    });
  }

  let resultDoc;
  let card;

  if (interString.startsWith("id#")) {
    const id = Number(interString.substr(3));
    resultDoc = await firebase
      .firestore()
      .collection("cards")
      .where("id", "==", Number(id))
      .limit(1)
      .get();
  } else {
    resultDoc = await firebase
      .firestore()
      .collection("albums")
      .where("name", "==", searchString)
      .limit(1)
      .get();
  }

  const searchString =
    interString.substr(0, 1).toUpperCase() + interString.substr(1);

  if (resultDoc.empty) {
    return await inter.reply({
      content: "Ничего не найдено.",
      ephemeral: true,
    });
  }

  let cardInfo;

  if (interString.startsWith("id#")) {
    cardInfo = card.docs[0].data();
  } else {
    const cardsIdArray = resultDoc.docs[0].data().cardsId;
    const cardId =
      cardsIdArray[Math.floor(Math.random() * (cardsIdArray.length - 0) + 0)];
    card = await firebase
      .firestore()
      .collection("cards")
      .where("id", "==", cardId)
      .limit(1)
      .get();
    cardInfo = card.docs[0].data();
  }

  if (cardInfo.fileURL && cardInfo.id) {
    const embed = new MessageEmbed()
      .setImage(cardInfo.fileURL)
      .setColor("#9B59B6")
      .setFooter("os:/fun/gs.info", sysColor("red"))
      .addField("https://goodsearch.vercel.app/card/" + cardInfo.id, "\u200b");

    return await inter.reply({
      content: "\u200b",
      ephemeral: false,
      embeds: [embed],
    });
  } else {
    return await inter.reply({
      content: "Ничего не найдено.",
      ephemeral: true,
    });
  }
};

module.exports.help = {
  name: "gs",
  permission: [],
};
