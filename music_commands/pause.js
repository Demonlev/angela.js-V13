const { CommandInteraction } = require("discord.js");
const player = require("../index").player;

module.exports.pause_command = async function (
  /** @type {CommandInteraction} */ inter
) {
  const queue = player.getQueue(inter.guildId);
  if (queue && queue.tracks) {
    const state = inter.options.getBoolean("пауза");

    if (state === false) {
      player.getQueue(inter.guildId).setPaused(false);
      return await inter.followUp({
        content: "Плеер снят с паузы!",
        ephemeral: false,
      });
    } else if (state === true) {
      player.getQueue(inter.guildId).setPaused(true);
      return await inter.followUp({
        content: "Плеер поставлен на паузу!",
        ephemeral: false,
      });
    }

    return await inter.followUp({ content: "Произошла ошибка.", ephemeral: true });
  } else {
    return await inter.followUp({ content: "Очереди нет.", ephemeral: true });
  }
};
