import fs from "node:fs";
import path from "node:path";
import Canvas from "canvas";
import { CommandInteraction, MessageAttachment, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { __globaldirname } from "utils/utils";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("i")
    .setDescription("Подставляет аватарки в картинки.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("aaam")
        .setDescription("Покормить сотрудника")
        .addUserOption((option) => option.setName("кого").setDescription("Кого кормить?").setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("bonk")
        .setDescription("Бонькнуть сотрудника")
        .addUserOption((option) => option.setName("кого").setDescription("Кого бонькнуть?").setRequired(false))
        .addUserOption((option) => option.setName("кто").setDescription("Кто бонькает?").setRequired(false))
        .addBooleanOption((option) => option.setName("хорни").setDescription("Сотрудник хорни?").setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("slap")
        .setDescription("Отшлёпать сотрудника")
        .addUserOption((option) => option.setName("кого").setDescription("Кого отшлёпать?").setRequired(false))
        .addUserOption((option) => option.setName("кто").setDescription("Кто шлёпает?").setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("eat")
        .setDescription("Сотрудник ждёт еды")
        .addUserOption((option) => option.setName("кого").setDescription("Кого заставить ждать?").setRequired(false))
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("wakeup")
        .setDescription("Разбудить сотрудника")
        .addUserOption((option) => option.setName("кого").setDescription("Кого разбудить?").setRequired(false))
    ),
  async execute(inter: CommandInteraction) {
    let what = inter.options.getSubcommand();
    const whom = inter.options.getUser("кого");
    const who = inter.options.getUser("кто");
    const horny = inter.options.getBoolean("хорни");

    if (what === "bonk" && horny === true) {
      what = "bonk_horny";
    }

    let text = "";

    const cvs = Canvas.createCanvas(512, 512);
    const ctx = cvs.getContext("2d");
    ctx.fillStyle = "#ffffff";
    const what_buffer: Buffer = fs.readFileSync(path.join(__globaldirname, "images", `${what}.png`));
    const what_img = new Canvas.Image();
    what_img.src = what_buffer;

    switch (what) {
      case "aaam":
        cvs.width = 1080;
        cvs.height = 1078;
        ctx.drawImage(what_img, 0, 0, 1080, 1078);
        text = "Куш0й..."
        break;
      case "bonk":
      case "bonk_horny":
        cvs.width = 680;
        cvs.height = 461;
        ctx.drawImage(what_img, 0, 0, 680, 461);
        text = horny ? "Получай, хорни!" : "Боньк тебя!"
        break;
      case "slap":
        cvs.width = 1000;
        cvs.height = 730;
        ctx.drawImage(what_img, 0, 0, 1000, 730);
        text = "Получай по жопе!"
        break;
      case "eat":
        cvs.width = 800;
        cvs.height = 600;
        ctx.drawImage(what_img, 0, 0, 800, 600);
        text = "Жди..."
        break;
      case "wakeup":
        cvs.width = 770;
        cvs.height = 570;
        ctx.drawImage(what_img, 0, 0, 770, 570);
        text = `Вставай, ${whom ? whom : who ? who : inter.user}!`
        break;
      default:
        break;
    }

    const whom_avatar =
      whom !== null
        ? whom.avatarURL({ format: "jpg", size: 256, dynamic: false })
        : inter.user.avatarURL({ format: "jpg", size: 256, dynamic: false });
    const whom_cvs = cvs;
    const whom_ctx = whom_cvs.getContext("2d");
    whom_ctx.fillStyle = "rgb(255, 255, 255)";
    if (whom_avatar) {
      await Canvas.loadImage(whom_avatar).then(async (whom_avatar_img) => {
        switch (what) {
          case "aaam":
            whom_ctx.drawImage(whom_avatar_img, 439, 193, 256, 256);
            break;
          case "bonk":
          case "bonk_horny":
            whom_ctx.drawImage(whom_avatar_img, 414, 242, 128, 128);
            break;
          case "slap":
            whom_ctx.drawImage(whom_avatar_img, 354, 512, 128, 128);
            break;
          case "eat":
            whom_ctx.drawImage(whom_avatar_img, 342, 88, 128, 128);
            break;
          case "wakeup":
            whom_ctx.drawImage(whom_avatar_img, 240, 240, 256, 256);
            break;
          default:
            break;
        }
      });
    }

    const who_avatar =
      who !== null
        ? who.avatarURL({ format: "jpg", size: 256, dynamic: false })
        : whom === null
        ? inter.client.user?.avatarURL({ format: "jpg", size: 256, dynamic: false })
        : null;
    const who_cvs = cvs;
    const who_ctx = who_cvs.getContext("2d");
    who_ctx.fillStyle = "rgb(255, 255, 255)";
    if (who_avatar) {
      await Canvas.loadImage(who_avatar).then(async (who_avatar_img) => {
        switch (what) {
          case "bonk":
          case "bonk_horny":
            whom_ctx.drawImage(who_avatar_img, 184, 100, 128, 128);
            break;
          case "slap":
            whom_ctx.drawImage(who_avatar_img, 402, 221, 128, 128);
            break;
          default:
            break;
        }
      });
    }

    const buffer = cvs.toBuffer("image/png");

    fs.writeFileSync(path.join(__globaldirname, "temp", `${what}.png`), buffer);
    const file = new MessageAttachment(path.join(__globaldirname, "temp", `${what}.png`));
    return await inter.reply({ content: text, files: [file] });
  },
};
