import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Полностью повторяет текст, написанный сотрудником.")
    .addStringOption((option) => option.setName("текст").setDescription("Текст для повторения").setRequired(true)),
  async execute(inter: CommandInteraction) {
    const text = inter.options.getString("текст");
    if (text == null) {
      return await inter.reply({ content: "А где текст для повтора?", ephemeral: true });
    }

    return await inter.reply({ content: text });
  },
};
