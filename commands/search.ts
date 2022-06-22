import { CommandInteraction, MessageAttachment, MessageEmbed, TextChannel } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { findError, isNum, isValidHttpUrl, sysColor, __globaldirname } from "utils/utils";
import pinParser from "@utils/pinParser";
import axios from "axios";
import { firebase } from "@utils/firebase";
import { getBooruPost } from "@utils/booruSearch";
import Canvas from "canvas";
import fs from "node:fs";
import path from "node:path";

const urlMatch =
  /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("s")
    .setDescription("Поиск картинок в GoodSearch или Pinterest.")
    .addSubcommand((opt) =>
      opt
        .setName("goodsearch")
        .setDescription("✅ ⚠️ Поиск на сайте _goodsearch.vercel.app_")
        .addStringOption((opt) =>
          opt.setName("запрос").setDescription("Укажите теги через пробел, айди или ссылку для поиска.").setRequired(true)
        )
    )
    .addSubcommand((opt) =>
      opt
        .setName("pinterest")
        .setDescription("✅ ⚠️ Поиск на сайте pinterest.com_. Требует больше времени на поиск, чем остальные сайты!")
        .addStringOption((opt) =>
          opt.setName("запрос").setDescription("Укажите теги через пробел, айди или ссылку для поиска.").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("скорость")
            .setDescription("Чем ниже, тем больше вероятность нахождения и разнообразия. medium - стандарт.")
            .addChoices(
              { name: "fast ~6s", value: "fast" },
              { name: "medium ~12s", value: "medium" },
              { name: "slow ~24", value: "slow" }
            )
        )
    )
    .addSubcommand((opt) =>
      opt
        .setName("booru")
        .setDescription("✅ 🔞 Поиск на Booru сайтах. При не NSFW канале Вы получите по голове!")
        .addStringOption((opt) =>
          opt
            .setName("запрос")
            .setDescription("Укажите не более 10 тегов через пробел. У некоторых сайтов количество тегов может сокращаться!")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("где")
            .setDescription("Укажите нужный Booru. SafeBooru - стандарт.")
            .addChoices(
              { name: "SafeBooru ✅", value: "safebooru.org" },
              { name: "Konachan ✅", value: "konachan.net" },
              { name: "Konachan 🔞", value: "konachan.com" },
              { name: "Rule 34 🔞", value: "api.rule34.xxx" },
              { name: "Rule 34 Paheal 🔞", value: "rule34.paheal.net" },
              { name: "XBooru 🔞", value: "xbooru.com" },
              { name: "TBib 🔞", value: "tbib.org" },
              { name: "danbooru.donmai.us 🔞", value: "danbooru.donmai.us" },
              { name: "HypnoHub 🔞", value: "hypnohub.net" }
            )
        )
    )
    .addSubcommand((opt) =>
      opt
        .setName("tags")
        .setDescription("Поиск тегов по их недописанным версиям!")
        .addStringOption((opt) =>
          opt.setName("запрос").setDescription("Укажите не более 5 тегов через пробел.").setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("где")
            .setDescription("Укажите нужный Booru или сайт. SafeBooru - стандарт.")
            .addChoices(
              { name: "SafeBooru ✅", value: "safebooru.org" },
              { name: "GoodSearch ✅", value: "goodsearch.vercel.app" },
              { name: "Rule 34 🔞", value: "api.rule34.xxx" },
              { name: "Rule 34 Paheal 🔞", value: "rule34.paheal.net" },
              { name: "XBooru 🔞", value: "xbooru.com" },
              { name: "TBib 🔞", value: "tbib.org" },
              { name: "danbooru.donmai.us 🔞", value: "danbooru.donmai.us" },
              { name: "HypnoHub 🔞", value: "hypnohub.net" }
            )
        )
    )
    .addSubcommand((opt) =>
      opt
        .setName("dalle")
        .setDescription("Генерирует картинки по запросу.")
        .addStringOption((opt) => opt.setName("запрос").setDescription("Любой текст. Не более 100 букв.").setRequired(true))
    ),
  async execute(inter: CommandInteraction) {
    const where = inter.options.getSubcommand();
    let query = inter.options.getString("запрос");
    const site = inter.options.getString("где");
    const pinterestSpeed = inter.options.getString("скорость");

    if (where === "tags") {
      await inter.deferReply({ ephemeral: true });
    } else {
      await inter.deferReply({ ephemeral: false });
    }

    if (query === null) return await findError(inter, "Кажется Вы не ввели теги, айди или ссылку...");

    switch (where) {
      case "pinterest":
        return searcherPinterest(inter, query, pinterestSpeed);
      case "booru":
        return searcherBooru(inter, query, site);
      case "goodsearch":
        return searcherGoodSearch(inter, query);
      case "tags":
        return searcherTags(inter, query, site);
      case "dalle":
        return searcherDalle(inter, query);
      default:
        return await findError(inter, "Кажется Вы не указали где искать...");
    }
  },
};

async function searcherDalle(inter: CommandInteraction, query: string) {
  const subquery = query.slice(0, 100);
  try {
    await inter.followUp({
      content: `🛠️  ${inter.user.tag}, Ваш запрос выполняется. Когда он будет готов, Вам придёт уведомление. Запрос: __${subquery}__  🛠️`,
    });
    const result = await axios.post("https://backend.craiyon.com/generate", {
      prompt: subquery,
    });

    let file: MessageAttachment | null = null;
    const cvs = Canvas.createCanvas(768, 768);
    const ctx = cvs.getContext("2d");

    if (fs.existsSync(path.join(__globaldirname, "temp", inter.user.id))) {
      fs.rmSync(path.join(__globaldirname, "temp", inter.user.id), { recursive: true, force: true });
    }

    if (result && result.data && result.data.images && Array.isArray(result.data.images)) {
      for (let idx = 0; idx < result.data.images.length; idx++) {
        const base64 = result.data.images[idx];
        const img = Buffer.from(base64, "base64");
        const cvsImg = new Canvas.Image();
        cvsImg.src = img;
        ctx.drawImage(cvsImg, 256 * ~~(idx / 3), 256 * ~~(idx % 3), 256, 256);
      }

      file = new MessageAttachment(cvs.createPNGStream());

      if (file !== null) {
        return await inter.followUp({ content: `✅  <@${inter.user.id}> Всё готово! __${subquery}__  ✅`, files: [file] });
      }
    }

    return await inter.followUp({ content: `❌  <@${inter.user.id}>, запрос: __${subquery}__ не смог обработаться... 😔  ❌` });
  } catch (error) {
    return await inter.followUp({ content: `❌  <@${inter.user.id}>, запрос: __${subquery}__ не смог обработаться... 😔  ❌` });
  }
}

async function searcherTags(inter: CommandInteraction, query: string, site: string | null) {
  if (site === null) site = "safebooru.org";
  let url: string | null = null;
  switch (site) {
    case "danbooru.donmai.us":
      url = "https://danbooru.donmai.us/autocomplete.json?search%5Btype%5D=tag_query&limit=10&search%5Bquery%5D=";
      break;
    case "api.rule34.xxx":
      url = "https://rule34.xxx/public/autocomplete.php?q=";
      break;
    case "rule34.paheal.net":
      url = "https://rule34.paheal.net/api/internal/autocomplete?s=";
      break;
    case "hypnohub.net":
      url = "https://hypnohub.net/public/autocomplete.php?q=";
      break;
    default:
    case "safebooru.org":
      url = "https://safebooru.org/autocomplete.php?q=";
      break;
    case "tbib.org":
      url = "https://tbib.org/autocomplete.php?q=";
      break;
    case "xbooru.com":
      url = "https://xbooru.com/autocomplete.php?q=";
      break;
    case "goodsearch.vercel.app":
      break;
  }

  const tags = query.split(" ").slice(0, 5);
  const fullTags: string[] = [];
  const maxTags = ~~(50 / tags.length);
  const canPushTag = (idx: number) => {
    return fullTags.length / tags.length < maxTags * (idx + 1);
  };
  if (site !== "goodsearch.vercel.app" || site === null) {
    for (let idx = 0; idx < tags.length; idx++) {
      const tag = tags[idx];
      const res = await axios.get(url + tag);

      if (res && res.data && Array.isArray(res.data)) {
        const dataTags = (res.data as []).slice(0, maxTags);

        for (let kdx = 0; kdx < dataTags.length; kdx++) {
          const dataTag: any = dataTags[kdx];
          if (dataTag && dataTag.value && canPushTag(idx)) fullTags.push(dataTag.value);
        }
      } else if (res && res.data && res.data.constructor === Object) {
        const dataKeys = Object.keys(res.data).slice(0, maxTags);
        for (let idx = 0; idx < dataKeys.length; idx++) {
          const dataTag = dataKeys[idx];
          if (dataTag && canPushTag(idx)) fullTags.push(dataTag);
        }
      }
    }
  } else if (site === "goodsearch.vercel.app") {
    type albumType = {
      name: string;
      count: number;
      image?: string;
      id: number;
      cardsId: number[];
    };

    for (let idx = 0; idx < tags.length; idx++) {
      const tag = tags[idx].charAt(0).toUpperCase() + tags[idx].slice(1);
      const getAlbums = await firebase
        .firestore()
        .collection("albums")
        .where("name", ">=", tag)
        .where("name", "<=", tag + "\uF7FF")
        .get();

      for (let kdx = 0; kdx < getAlbums.size; kdx++) {
        const album = getAlbums.docs[kdx];
        const albumData = album.data() as albumType;
        fullTags.push(albumData.name);
      }
    }
  }
  if (fullTags.length > 0) {
    return await inter.followUp({
      content: `\`\`\`${fullTags.slice(0, 50).join(" ").substring(0, 950)}\`\`\``,
      ephemeral: true,
    });
  } else return await findError(inter);
}

async function searcherPinterest(inter: CommandInteraction, query: string, mode: string | null) {
  const pin = await pinParser(query, mode as any);
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

async function searcherBooru(inter: CommandInteraction, query: string, site: string | null) {
  const post = await getBooruPost(query, site as any);
  if (post) {
    if (post.nsfw && inter.guild && inter.channel && (inter.channel as TextChannel).nsfw === false) {
      return await bonkHorny(inter);
    }
    if (post.nsfw && inter.guildId && inter.guildId === "682890408967274531") {
      return await bonkHorny(inter, "В этой гильдии запрещены хорни штучки!");
    }
    const tags = post.tags.join(" ");
    if (isVideo(post.image)) {
      const content = `**[${post.booru}]** - <${post.url}>\n\`\`\`[много тегов] ${
        tags.length > 256 ? tags.slice(0, 256) + "..." : tags
      }\`\`\`\n${post.image}`;
      return await inter.editReply({ content });
    } else {
      const embed = new MessageEmbed();
      embed.setTitle(`Link to ${post.booru}`);
      embed.setDescription(tags.length > 384 ? tags.slice(0, 384) + " __**[много тегов]**__" : tags);
      embed.setURL(post.url);
      embed.setColor("#006ffa");
      const footerText = post.url;
      embed.setFooter({ text: footerText, iconURL: sysColor("red") });
      embed.setImage(post.image);
      return await inter.editReply({ content: null, embeds: [embed] });
    }
  }
  return await findError(
    inter,
    "Ничего не найдено. Попробуйте использовать команду **/s tags {query} {booru}**, чтобы узнать какие теги есть."
  );
}

async function searcherGoodSearch(inter: CommandInteraction, query: string) {
  let resultDoc;
  let card;
  if (isNum(query)) {
    const id = Number(query.match(/^\d+$/g)![0]);
    resultDoc = await firebase.firestore().collection("cards").where("id", "==", Number(id)).limit(1).get();
  } else if (isValidHttpUrl(query) && query.match(urlMatch) && query.match(urlMatch)![0]) {
    try {
      const urlReg = query.match(urlMatch)![0];
      const idReg = urlReg.match(/\/\d+/g)![0].replace(/\//, "");
      const id = Number(idReg);
      resultDoc = await firebase.firestore().collection("cards").where("id", "==", Number(id)).limit(1).get();
    } catch (error) {
      return await findError(inter, "Кажется в ссылке ошибка...");
    }
  } else {
    const searchString = query.charAt(0).toUpperCase() + query.substring(1);
    resultDoc = await firebase.firestore().collection("albums").where("name", "==", searchString).limit(1).get();
  }

  if (resultDoc.empty) {
    return await findError(inter);
  }

  let cardInfo;

  if (query.match(/^\d+$/g)) {
    cardInfo = resultDoc.docs[0].data();
  } else if (isValidHttpUrl(query) && query.match(urlMatch) && query.match(urlMatch)![0]) {
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

function isVideo(str: string) {
  return /^.*\.(mp4|ogg|wemb)$/g.test(str);
}

async function bonkHorny(inter: CommandInteraction, text?: string) {
  const cvs = Canvas.createCanvas(600, 461);
  const ctx = cvs.getContext("2d");
  ctx.fillStyle = "#ffffff";
  const bonkBuffer: Buffer = fs.readFileSync(path.join(__globaldirname, "images", `bonk_horny.png`));
  const bonkImg = new Canvas.Image();
  bonkImg.src = bonkBuffer;
  ctx.drawImage(bonkImg, 0, 0, 680, 461);

  const hornyAvatar = inter.user.avatarURL({ format: "jpg", size: 256, dynamic: false });

  const hornyCvs = cvs;
  const hornyCtx = hornyCvs.getContext("2d");
  hornyCtx.fillStyle = "rgb(255, 255, 255)";
  if (hornyAvatar) {
    await Canvas.loadImage(hornyAvatar).then(async (whom_avatar_img) => {
      hornyCtx.drawImage(whom_avatar_img, 414, 242, 128, 128);
    });
  }

  const angelaAvatar = inter.client.user?.avatarURL({ format: "jpg", size: 256, dynamic: false });

  const angelaCvs = cvs;
  const angelaCtx = angelaCvs.getContext("2d");
  angelaCtx.fillStyle = "rgb(255, 255, 255)";
  if (angelaAvatar) {
    await Canvas.loadImage(angelaAvatar).then(async (angelaAvatar_img) => {
      angelaCtx.drawImage(angelaAvatar_img, 184, 100, 128, 128);
    });
  }

  const buffer = cvs.toBuffer("image/png");

  fs.writeFileSync(path.join(__globaldirname, "temp", `bonk_horny.png`), buffer);
  const file = new MessageAttachment(path.join(__globaldirname, "temp", `bonk_horny.png`));
  return await inter.editReply({ content: text ? text : "На этом канале запрещены хорни штучки!", files: [file] });
}
