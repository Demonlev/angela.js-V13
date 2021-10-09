const { CommandInteraction, MessageEmbed } = require("discord.js");

const { sysColor } = require("../../angImg");
const { player } = require("../../index");

const { play_command } = require("../../music_commands/play");
const { queue_command } = require("../../music_commands/queue");
const { clear_command } = require("../../music_commands/clear");
const { pause_command } = require("../../music_commands/pause");
const { leave_command } = require("../../music_commands/leave");
const { skip_command } = require("../../music_commands/skip");

/**
 * @param {CommandInteraction} inter
 */
module.exports.run = async (inter) => {
  const channel_id = inter.member.voice.channelId;
  if (!channel_id) {
    return await inter.reply({
      content:
        "Зайдите в голосовой канал, чтобы использовать музыкальные команды.",
      ephemeral: true,
    });
  } else {
    if (inter.options.getSubcommand() === "play") {
      await inter.deferReply();

      try {
        play_command(inter);
      } catch (error) {
        console.log(error);
        return await inter.followUp({
          content: `Произошла ошибка.`,
          ephemeral: true,
        });
      }
    }

    if (inter.options.getSubcommand() === "queue") {
      await inter.deferReply();

      try {
        queue_command(inter);
      } catch (error) {
        console.log(error);
        return await inter.followUp({
          content: `Произошла ошибка.`,
          ephemeral: true,
        });
      }
    }

    if (inter.options.getSubcommand() === "clear") {
      await inter.deferReply();

      try {
        clear_command(inter)
      } catch (error) {
        console.log(error);
        return await inter.followUp({
          content: `Произошла ошибка.`,
          ephemeral: true,
        });
      }
    }

    if (inter.options.getSubcommand() === "pause") {
      await inter.deferReply();

      try {
        pause_command(inter)
      } catch (error) {
        console.log(error);
        return await inter.followUp({
          content: `Произошла ошибка.`,
          ephemeral: true,
        });
      }
    }

    if (inter.options.getSubcommand() === "skip") {
      await inter.deferReply();

      try {
        skip_command(inter)
      } catch (error) {
        console.log(error);
        return await inter.reply({
          content: `Произошла ошибка.`,
          ephemeral: true,
        });
      }
    }

    if (inter.options.getSubcommand() === "leave") {
      await inter.deferReply();

      try {
        leave_command(inter)
      } catch (error) {
        console.log(error);
        return await inter.followUp({
          content: `Произошла ошибка.`,
          ephemeral: true,
        });
      }
    }
  }
};

module.exports.help = {
  name: "music",
  permission: [],
};
