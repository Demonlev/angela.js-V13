const { CommandInteraction, MessageEmbed } = require("discord.js");
const sysColor = require("../angImg").sysColor;
const player = require("../index").player;

module.exports.play_command = async function (
  /** @type {CommandInteraction} */ inter
) {
  if (
    inter.guild.me.voice.channelId &&
    inter.member.voice.channelId !== inter.guild.me.voice.channelId
  ) {
    return await inter.followUp({
      content: "Вы должны находиться в том же канале, что и я!",
      ephemeral: true,
    });
  }

  const query = inter.options.getString("поиск");
  if (!query) {
    return await inter.followUp({
      content: "Не найдено.!",
      ephemeral: true,
    });
  }

  const queue = player.createQueue(inter.guild, {
    metadata: {
      channel: inter.channel,
    },
  });

  if (!queue.connection) await queue.connect(inter.member.voice.channel);

  const tracks = await player
    .search(query, {
      requestedBy: inter.user,
    })
    .then((x) => x.tracks.slice(0, 100));

  let tracksDuration = 0;
  const playerQueue = player.getQueue(inter.guildId);
  let secondsLeft = playerQueue.current ? playerQueue.current.durationMS : 0;
  queue.play(tracks[0]);
  const tracksQueue = playerQueue.tracks || [];
  if (tracksQueue.length !== 0 && tracksQueue.length <= 10) {
    tracksQueue.slice(0, 10).forEach((track) => {
      secondsLeft += track.durationMS;
    });
  }

  queue.addTracks(tracks.slice(1));
  tracks.forEach((track, index) => {
    tracksDuration = tracksDuration + track.durationMS;
  });

  const embed = new MessageEmbed()
    .setColor("#9B59B6")
    .setFooter("os:/music/track.info", sysColor("red"))
    .setTimestamp(new Date());

  if (tracks.length === 1) {
    embed.setAuthor(
      "Добавил в очередь 1 трек",
      inter.user.avatarURL({ size: 64 })
    );
    embed.addField(tracks[0].url || "url", tracks[0].title || "title");
    embed.setThumbnail(tracks[0].thumbnail || "thumbnail");
    embed.addField(
      "Длительность трека",
      `${new Date(tracksDuration).toISOString().substr(11, 8) || "duration"}`
    );
  } else {
    embed.setAuthor(
      `Добавил в очередь ${tracks.length} треков`,
      inter.user.avatarURL({ size: 64 })
    );
    if (tracks[0].playlist) {
      embed.addField(
        tracks[0].playlist.url || tracks[0].url || "url",
        tracks[0].playlist.title || tracks[0].title || "title"
      );
      embed.setThumbnail(
        tracks[0].playlist.thumbnail || tracks[0].thumbnail || "thumbnail"
      );
    } else {
      embed.addField(tracks[0].url || "url", tracks[0].title || "url");
      embed.setThumbnail(tracks[0].thumbnail || "thumbnail");
    }
    embed.addField(
      "Общая длительность добавленных треков",
      `${new Date(tracksDuration).toISOString().substr(11, 8) || "duration"}`
    );
  }

  if (tracksQueue.length !== 0) {
    if (tracksQueue.length <= 10 && tracksQueue.length !== 0) {
      embed.addField(
        "Будет играть через: ",
        `${new Date(secondsLeft).toISOString().substr(11, 8) || "after"}`
      );
    } else {
      embed.addField("Будет играть через: ", `${tracksQueue.length} треков.`);
    }
  }

  return await inter.followUp({ content: "\u200b", embeds: [embed] });
};
