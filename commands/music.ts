import { CommandInteraction, GuildMember } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { findError, __globaldirname } from "@utils/utils";
import { Player } from "@player/Player";
import { Client, guildsQuries } from "index";
import { EngineType, guildQueryType } from "@player/player";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("m")
    .setDescription("Музыкальные команды.")
    .addSubcommand((opt) =>
      opt
        .setName("play")
        .setDescription("Включает музыку.")
        // .addStringOption((opt) =>
        //   opt
        //     .setName("где")
        //     .setDescription("Где искать?")
        //     .addChoices({ name: "Youtube", value: "youtube" })
        //     .setRequired(true)
        // )
        .addStringOption((opt) =>
          opt.setName("запрос").setDescription("Поисковый запрос или ссылка на видео или плейлист.").setRequired(true)
        )
    )
    .addSubcommand((opt) => opt.setName("skip").setDescription("Пропускает текущий трек")),
  async execute(inter: CommandInteraction) {
    await inter.deferReply();
    const subcommand = inter.options.getSubcommand();
    // const engine = inter.options.getString("где") as EngineType | null;
    const engine = "youtube";
    const query = inter.options.getString("запрос");

    const channel = (inter.member as GuildMember).voice.channel;

    const guild = inter.guild;

    if (guild === null) {
      return findError(inter, "Эта команда только для гильдий!");
    }

    if (channel === null) {
      return findError(inter, "Кажется вы не в голосовом чате!");
    }

    if (query === null) {
      return findError(inter, "Кажется вы указали не поисковый параметр!");
    }

    if (engine === null) {
      return findError(inter, "Кажется вы указали не где искать!");
    }

    let player: Player;
    let guildQuery: guildQueryType;
    if (guildsQuries.has(guild.id)) {
      guildQuery = guildsQuries.get(guild.id)!;
      player = guildQuery.player;
      player.search(query, engine, inter);
    } else {
      player = new Player(inter, query, engine);
      guildsQuries.set(guild.id, {
        channel: channel,
        guild: guild,
        player: player,
      });
    }

    if (player) {
      return findError(inter, `${inter.user.username} добавил трек: **${query}**`, true, true);
    } else {
      return findError(inter, "Кажется произошла ошибка...");
    }
  },
};
