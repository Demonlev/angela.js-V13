import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { findError, __globaldirname } from "@utils/utils";
import { guildsQuries, Player } from "@player/Player";
import {
  guildQueryType,
  playerHistoryType,
  searchType,
} from "@player/playerTypes";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("m")
    .setDescription("Музыкальные команды.")
    .addSubcommand((opt) =>
      opt
        .setName("play")
        .setDescription("Включает трек с указанными параметрами.")
        .addStringOption((opt) =>
          opt
            .setName("query")
            .setDescription("Поисковый запрос или ссылка на видео / плейлист.")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription(
              "Тип поиска. Стандарт - Video. Можно не указывать, если запрос - ссылка."
            )
            .addChoices(
              { name: "Playlist", value: "playlist" },
              { name: "Video", value: "video" }
            )
            .setRequired(false)
        )
    )
    .addSubcommand((opt) =>
      opt
        .setName("skip")
        .setDescription("Пропускает текущий трек.")
        .addBooleanOption((opt) =>
          opt
            .setName("skip-all")
            .setDescription("Пропустить всю очередь? False - стандарт.")
            .setRequired(false)
        )
    )
    .addSubcommand((opt) =>
      opt.setName("shuffle").setDescription("Перемешивает очередь.")
    )
    .addSubcommand((opt) =>
      opt.setName("pause").setDescription("Останавливает или возобновляет.")
    )
    .addSubcommand((opt) =>
      opt
        .setName("history")
        .setDescription("Показывает историю.")
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription(
              "Цифры показывают длину истории / Цифры с плюсом покажут меньше информации."
            )
            .addChoices(
              { name: "Текущая очередь (5+)", value: "current" },
              { name: "Прослушенные треки (5)", value: "previous" },
              { name: "Манипуляции с плеером (7)", value: "commands" },
              { name: "Следующие 2 трека (2+)", value: "next" }
            )
        )
    )
    .addSubcommand((opt) =>
      opt
        .setName("leave")
        .setDescription(
          "Покидает голосовой канал. Только при Вас или при отсутствии пользователей. Исключая ботов."
        )
    ),
  async execute(inter: CommandInteraction) {
    await inter.deferReply();
    const subcommand = inter.options.getSubcommand();
    const engine = "youtube";
    const searchBy = (inter.options.getString("type") as searchType) || null;
    const query = inter.options.getString("query");
    const skip = inter.options.getBoolean("skip-all");
    const playerHistory =
      (inter.options.getString("type") as playerHistoryType) || null;

    const guild = inter.guild;
    if (guild === null) {
      return findError(inter, "Эта команда только для гильдий!");
    }

    const channel = (inter.member as GuildMember).voice.channel;

    if (channel === null && subcommand !== "leave") {
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
          const res = await player.search(query!, engine, inter, searchBy);
          if (res)
            return findError(
              inter,
              `Вы не можете добавлять треки, находясь в этом канале, пока в другом есть люди!`
            );
          return findError(inter, `Команда выполнена!`, true, true);
        case "skip":
          player.playNextQuery(inter.user, skip ? skip : undefined);
          return findError(inter, `Команда выполнена!`, true, true);
        case "shuffle":
          player.shuffle(inter.user);
          return findError(inter, `Команда выполнена!`, true, true);
        case "pause":
          player.pause(inter.user);
          return findError(inter, `Команда выполнена!`, true, true);
        case "history":
          player.getHistory(playerHistory, inter);
          return findError(inter, `Команда выполнена!`, true, true);
        case "leave":
          player.leave(inter.user);
          return findError(inter, `Команда выполнена!`, true, true);
        default:
          break;
      }
    } else {
      switch (subcommand) {
        case "play":
          player = new Player(inter, query!, engine, searchBy);
          guildsQuries.set(guild.id, {
            channel: channel!,
            guild: guild,
            player: player,
          });
          return findError(inter, `Команда выполнена!`, true, true);
        case "history":
          return findError(inter, `Кажется истории ещё нет...`);
        case "leave":
          return findError(inter, `Я не в голосовом канале.`, true);
        default:
          return findError(inter, `Нельзя использовать!`);
      }
    }

    return findError(inter, "Кажется произошла ошибка...");
  },
};
