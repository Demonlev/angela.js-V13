const { CommandInteraction } = require("discord.js");
const player = require("../index").player;

module.exports.skip_command = async function (
  /** @type {CommandInteraction} */ inter
) {
  const queue = player.getQueue(inter.guildId);
  if (queue && queue.tracks) {
    const current = player.getQueue(inter.guildId).current;
    player.getQueue(inter.guildId).skip(true);
    return await inter.followUp({
      content: `**${current.title}** пропущен!`,
    });

  } else {
    return await inter.followUp({ content: "Очереди нет.", ephemeral: true });
  }
};
