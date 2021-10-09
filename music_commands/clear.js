const { CommandInteraction } = require("discord.js");
const player = require("../index").player;

module.exports.clear_command = async function (
  /** @type {CommandInteraction} */ inter
) {
  const queue = player.getQueue(inter.guildId);
  if (queue && queue.tracks) {
    player.getQueue(inter.guildId).clear();

    return await inter.followUp({ content: "Очередь очищена!" });
  } else {
    return await inter.followUp({ content: "Очереди нет.", ephemeral: true });
  }
};
