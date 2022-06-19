import { SlashCommandBuilder } from "@discordjs/builders";
import { findError } from "@utils/utils";
import { CommandInteraction } from "discord.js";
import { ID_ADMINS } from "index";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Удалить сообщения.")
    .addNumberOption((option) => option.setName("количество").setDescription("Сколько удалить?").setRequired(true)),
  async execute(inter: CommandInteraction) {
    await inter.deferReply();
    const count = inter.options.getNumber("количество");

    if (inter.guild && inter.member) {
      if (inter.guild.ownerId === inter.member.user.id || ID_ADMINS.includes(inter.member.user.id)) {
        if (inter.channel) {
          const deleteCount = (count || 5) + 1;
          const messages = await inter.channel.messages.fetch({ limit: deleteCount });
          try {
            messages.each((m) => m.delete());
            return await findError(inter, `Удалено ${deleteCount} сообщений`, true);
          } catch (error) {
            return await findError(inter, "Вы не можете использовать эту команду");
          }
        }
      }
    } else if (inter.guildId === null && inter.user) {
      return await findError(inter, "Эта команда только для гильдий!");
    }

    return await findError(inter, "Вы не можете использовать эту команду");
  },
};
