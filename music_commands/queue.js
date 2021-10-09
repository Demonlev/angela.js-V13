const { CommandInteraction, MessageEmbed } = require("discord.js");
const sysColor = require("../angImg").sysColor;
const player = require("../index").player;

module.exports.queue_command = async function (
  /** @type {CommandInteraction} */ inter
) {
  const queue = player.getQueue(inter.guildId);
  if (queue && queue.tracks) {
    const current = queue.current;
    const tracks = queue.tracks;
    // CURRENT SONG
    const embed = new MessageEmbed()
      .setColor("#9B59B6")
      .setFooter("os:/music/track.info", sysColor("red"))
      .setTimestamp(new Date())
      .setThumbnail(current.thumbnail)
      .setAuthor("Сейчас играет");
    embed.addField(current.url, current.title);
    embed.addField("Длительность", current.duration);

    let secondsLeft = current.durationMS;

    tracks.slice(0, 4).forEach((track, index) => {
      secondsLeft += track.durationMS;
      embed.addField(
        `========== В очереди #${index + 2} ==========`,
        `${track.title}\n${track.url}`
      );
      embed.addField("Длительность", `${track.duration}`);
      embed.addField(
        "Будет играть через: ",
        `${new Date(secondsLeft).toISOString().substr(11, 8)}`
      );
    });

    embed.addField("Всего в очереди: ", `${tracks.length} треков`);

    return await inter.followUp({ content: "\u200b", embeds: [embed] });
  } else {
    return await inter.followUp({ content: "Очереди нет.", ephemeral: true });
  }
};
