const { CommandInteraction } = require("discord.js");
const player = require("../index").player;

module.exports.leave_command = async function (
  /** @type {CommandInteraction} */ inter
) {
  if (player.getQueue(inter.guildId)) {
    player.getQueue(inter.guildId).destroy(true);
    return await inter.followUp({ content: `Выхожу.`, ephemeral: false });
  } else {
    return await inter.followUp({
      content: `Бот не в голосовом канале.`,
      ephemeral: true,
    });
  }
};
