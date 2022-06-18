import { CommandInteraction, Message, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { findError, isNum, sysColor, __globaldirname } from "utils/utils";
import pinParser from "@utils/pinParser";
import axios from "axios";
import { firebase } from "@utils/firebase";

type pinType = {
  url?: string;
  title?: string;
  desc?: string;
  img: string;
  isGIF: boolean;
};

const urlMatch =
  /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("s")
    .setDescription("Поиск картинок в GoodSearch или Pinterest.")
    .addStringOption((option) =>
      option
        .setName("где")
        .setDescription("где искать")
        .setRequired(true)
        .addChoices(
          { name: "Good Search", value: "gs" },
          { name: "Pinterest", value: "pin" },
          { name: "SafeBooru", value: "sb" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("запрос")
        .setDescription("Укажите теги через пробел, айди или ссылку для поиска. Для айди требуется указать только одно число!")
        .setRequired(true)
    ),
  async execute(inter: CommandInteraction) {
    await inter.deferReply({ ephemeral: false });
    const where = inter.options.getString("где");
    let query = inter.options.getString("запрос");

    if (query) query = query.replace(/\s{1}/g, "%20");

    if (query === null) return await findError(inter, "Кажется Вы не ввели теги, айди или ссылку...");

    switch (where) {
      case "pin":
        return searcherPinterest(inter, query);
      case "sb":
        return searcherSafeBooru(inter, query);
      case "gs":
        return searcherGoodSearch(inter, query);
      default:
        return await findError(inter, "Кажется Вы не указали где искать...");
    }
  },
};

async function searcherPinterest(inter: CommandInteraction, query: string) {
  const pin = await pinParser(query);
  if (pin === null) {
    return await findError(inter);
  }

  const embed = new MessageEmbed();
  embed.setImage(pin.img);
  if (pin.title && pin.title.length !== 0) {
    embed.setTitle(pin.title);
  }
  if (pin.url) {
    embed.setURL(pin.url);
  }
  let description: string | null = null;
  if (pin.isGIF) {
    description = "**GIF**";
  }
  if (pin.desc) {
    if (description) description = description + "\n";
    description = "" + pin.desc;
  }
  if (description) {
    embed.setDescription(description);
  }
  embed.setColor("#b65959");
  const footerText = pin.url ? pin.url : `os:/fun/search?eng=pin&q=${query}`;
  embed.setFooter({ text: footerText, iconURL: sysColor("red") });

  return await inter.editReply({ content: null, embeds: [embed] });
}

async function searcherSafeBooru(inter: CommandInteraction, query: string) {
  const pin: pinType = { img: "", isGIF: false };
  let urlSB = `https://safebooru.org/index.php?page=dapi&s=post&q=index&limit=100&`;
  if (isNum(query)) {
    const id = Number(query.match(/^\d+$/g)![0]);
    urlSB = urlSB + `id=${id}`;
  } else if (query.match(urlMatch) && query.match(urlMatch)![0]) {
    try {
      const urlReg = query.match(urlMatch)![0];
      const idReg = urlReg.match(/id=\d+/g)![0].slice(3);
      const id = Number(idReg);
      urlSB = urlSB + `id=${id}`;
    } catch (error) {
      return await findError(inter, "Кажется в ссылке ошибка...");
    }
  } else {
    urlSB = urlSB + `tags=${query}`;
  }
  const res = await axios(urlSB, { method: "GET" });
  const xml = res.data;
  let isParsed = false;
  try {
    if (xml) {
      const posts = (xml as string).match(/(<post ).+\/>/g);
      if (posts) {
        const post = posts[Math.floor(Math.random() * (posts.length - 1))];
        const postImageReg = post.match(/file_url=".+?"/g);
        const postIdReg = post.match(/ id=".+?"/g);
        const postTagsReg = post.match(/tags=".+?"/g);
        pin.title = "Link to SafeBooru";
        if (postTagsReg && postTagsReg[0]) {
          pin.desc = postTagsReg[0].replace(/(tags=)?(")/g, "");
          if (pin.desc.length > 384) {
            pin.desc = pin.desc.substring(0, 150) + "... **[много тегов]**";
          }
        }
        if (postImageReg && postImageReg[0]) {
          const postImage = postImageReg[0].replace(/(file_url=)?(")/g, "");
          pin.img = postImage;
          isParsed = true;
          if (postImage.endsWith(".gif")) pin.isGIF = true;
        }
        if (postIdReg && postIdReg[0]) {
          const postId = postIdReg[0].replace(/( id=)?(")/g, "");
          pin.url = `https://safebooru.org/index.php?page=post&s=view&id=${postId}`;
        }
      }
    }
    if (isParsed) {
      const embed = new MessageEmbed();
      embed.setImage(pin.img);
      if (pin.title && pin.title.length !== 0) {
        embed.setTitle(pin.title);
      }
      if (pin.url) {
        embed.setURL(pin.url);
      }
      let description: string | null = null;
      if (pin.isGIF) {
        description = "**GIF**";
      }
      if (pin.desc) {
        if (description) description = description + "\n";
        description = "" + pin.desc;
      }
      if (description) {
        embed.setDescription(description);
      }
      embed.setColor("#006ffa");
      const footerText = pin.url ? pin.url : `os:/fun/search?eng=sb&q=${query}`;
      embed.setFooter({ text: footerText, iconURL: sysColor("red") });
      return await inter.editReply({ content: null, embeds: [embed] });
    } else {
      return await findError(inter, "Кажется в ссылке ошибка...");
    }
  } catch (error) {
    return await findError(inter, "Кажется произошла ошибка...");
  }
}

async function searcherGoodSearch(inter: CommandInteraction, query: string) {
  let resultDoc;
  let card;
  if (isNum(query)) {
    const id = Number(query.match(/^\d+$/g)![0]);
    resultDoc = await firebase.firestore().collection("cards").where("id", "==", Number(id)).limit(1).get();
  } else if (query.match(urlMatch) && query.match(urlMatch)![0]) {
    try {
      const urlReg = query.match(urlMatch)![0];
      const idReg = urlReg.match(/\/\d+/g)![0].replace(/\//, "");
      const id = Number(idReg);
      resultDoc = await firebase.firestore().collection("cards").where("id", "==", Number(id)).limit(1).get();
    } catch (error) {
      return await findError(inter, "Кажется в ссылке ошибка...");
    }
  } else {
    const searchString = query.substring(0, 1).toUpperCase() + query.substring(1);
    resultDoc = await firebase.firestore().collection("albums").where("name", "==", searchString).limit(1).get();
  }

  if (resultDoc.empty) {
    return await findError(inter);
  }

  let cardInfo;

  if (query.match(/^\d+$/g)) {
    cardInfo = resultDoc.docs[0].data();
  } else if (query.match(urlMatch) && query.match(urlMatch)![0]) {
    cardInfo = resultDoc.docs[0].data();
  } else {
    const cardsIdArray = resultDoc.docs[0].data().cardsId;
    const cardId = cardsIdArray[Math.floor(Math.random() * (cardsIdArray.length - 0) + 0)];
    card = await firebase.firestore().collection("cards").where("id", "==", cardId).limit(1).get();
    cardInfo = card.docs[0].data();
  }

  if (cardInfo.fileURL && typeof cardInfo.id === "number") {
    const embed = new MessageEmbed()
      .setImage(cardInfo.fileURL)
      .setColor("#9B59B6")
      .setFooter({ text: `https://goodsearch.vercel.app/card/${cardInfo.id}`, iconURL: sysColor("red") });

    embed.setTitle("Link to Good Search");
    embed.setURL(`https://goodsearch.vercel.app/card/${cardInfo.id}`);
    if (cardInfo.infoTags) {
      embed.setDescription((cardInfo.infoTags as string[]).join(" "));
      embed.setURL(`https://goodsearch.vercel.app/card/${cardInfo.id}`);
    }

    return await inter.editReply({
      content: null,
      embeds: [embed],
    });
  } else {
    return await findError(inter);
  }
}
