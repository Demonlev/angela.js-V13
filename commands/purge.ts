import { SlashCommandBuilder } from "@discordjs/builders";
import { findError } from "@utils/utils";
import { CommandInteraction } from "discord.js";
import { ID_ADMINS } from "index";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Выебать сообщения.")
    .addNumberOption((option) => option.setName("количество").setDescription("сколько выебать").setRequired(true)),
  async execute(inter: CommandInteraction) {
    inter.deferReply();
    const count = inter.options.getNumber("количество");
    if (inter.guild && inter.member) {
      if (inter.guild.ownerId === inter.member.user.id || ID_ADMINS.includes(inter.member.user.id)) {
        if (inter.channel) {
          const deleteCount = count || 5;
          const messages = await inter.channel.messages.fetch({ limit: deleteCount });
          try {
            messages.each((m) => m.delete());
            return findError(inter, `Удалено ${deleteCount} сообщений`, true);
          } catch (error) {}
        }
      }
    }

    return findError(inter, "Вы не можете использовать эту команду");
  },
};
