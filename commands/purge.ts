import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Выебать сообщения.")
    .addNumberOption((option) => option.setName("количество").setDescription("сколько выебать").setRequired(true)),
  async execute(inter: CommandInteraction) {
    const count = inter.options.getNumber("количество");
    if (inter.channel) {
      const messages = await inter.channel.messages.fetch({ limit: count || 5 });
      try {
        messages.each((m) => m.delete());
      } catch (error) {}
    }

    return await inter.reply({ content: "ok", ephemeral: true });
  },
};
