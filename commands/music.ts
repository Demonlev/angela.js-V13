import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { findError, __globaldirname } from "@utils/utils";
import { Player } from "@player/Player";
import { guildsQuries } from "index";
import { guildQueryType, playerHistoryType } from "@player/player";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("m")
    .setDescription("Музыкальные команды")
    .addSubcommand((opt) =>
      opt
        .setName("play")
        .setDescription("Включает трек с указанными параметрами")
        .addStringOption((opt) => opt.setName("query").setDescription("Поисковый запрос или ссылка на видео").setRequired(true))
    )
    .addSubcommand((opt) => opt.setName("skip").setDescription("Пропускает текущий трек"))
    .addSubcommand((opt) => opt.setName("shuffle").setDescription("Перемешивает очередь"))
    .addSubcommand((opt) =>
      opt
        .setName("pause")
        .setDescription("Останавливает или возобновляет")
        .addBooleanOption((opt) => opt.setName("paused").setDescription("true - ставит на паузу / false - снимает с паузы"))
    )
    .addSubcommand((opt) =>
      opt
        .setName("history")
        .setDescription("Показывает историю")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("Цифры показывают длину истории / Цифры с плюсом покажут меньше информации")
            .addChoices(
              { name: "Текущая очередь (7+)", value: "current" },
              { name: "Прослушенные треки (5)", value: "previous" },
              { name: "Манипуляции с плеером (7)", value: "commands" }
            )
        )
    ),
  async execute(inter: CommandInteraction) {
    await inter.deferReply();
    const subcommand = inter.options.getSubcommand();
    // const engine = inter.options.getString("где") as EngineType | null;
    const engine = "youtube";
    const query = inter.options.getString("query");
    const pause = inter.options.getBoolean("paused");
    const playerHistory = (inter.options.getString("type") as playerHistoryType) || null;

    const guild = inter.guild;
    if (guild === null) {
      return findError(inter, "Эта команда только для гильдий!");
    }

    const channel = (inter.member as GuildMember).voice.channel;

    if (channel === null) {
      return findError(inter, "Кажется вы не в голосовом чате!");
    }

    if (query === null && subcommand === "play") {
      return findError(inter, "Кажется вы указали не поисковый параметр!");
    }

    if (engine === null && subcommand === "play") {
      return findError(inter, "Кажется вы указали не где искать!");
    }

    let player: Player;
    let guildQuery: guildQueryType;
    if (guildsQuries.has(guild.id)) {
      guildQuery = guildsQuries.get(guild.id)!;
      player = guildQuery.player;
      switch (subcommand) {
        case "play":
          const res = await player.search(query!, engine, inter);
          if (res) return findError(inter, `Вы не можете добавлять треки, находясь в другом канале, пока в этом есть люди`)
          return findError(inter, `${inter.user.username} добавил трек: **${query}**`, true, true);
        case "skip":
          player.playNextQuery(inter.user);
          return findError(inter, `${inter.user.username} пропустил(а) трек`, true, true);
        case "shuffle":
          player.shuffle(inter.user);
          return findError(inter, `${inter.user.username} перемешал(а) очередь`, true, true);
        case "pause":
          player.pause(inter.user, pause);
          if (pause !== null) {
            if (pause) {
              return findError(inter, `${inter.user.username} поставил(а)Ш плеер на паузу`, true, true);
            } else {
              return findError(inter, `${inter.user.username} возобновляет плеер`, true, true);
            }
          } else return findError(inter, `${inter.user.username} поставил(а) плеер на паузу`, true, true);
        case "history":
          player.getHistory(playerHistory, inter);
          return findError(inter, `${inter.user.username} запросил(а) историю плеера`, true, true);
        default:
          break;
      }
    } else {
      switch (subcommand) {
        case "play":
          player = new Player(inter, query!, engine);
          guildsQuries.set(guild.id, {
            channel: channel,
            guild: guild,
            player: player,
          });
          return findError(inter, `${inter.user.username} добавил трек: **${query}**`, true, true);
        case "history":
          return findError(inter, `Кажется истории ещё нет...`);
        default:
          return findError(inter, `Нельзя использовать эту команду при пустой очереди`);
      }
    }

    return findError(inter, "Кажется произошла ошибка...");
  },
};
