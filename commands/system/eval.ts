import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eval")
    .setDescription("Превращает строку в JS код и возвращает результат или ошибку")
    .addStringOption((option) => option.setName("код").setDescription("Введите код на JS.").setRequired(true)),
  async execute(inter: CommandInteraction) {
    const stringCode = String(inter.options.getString("код", true));
    try {
      const code = await eval(stringCode);

      return await inter.reply({ content: String(code), ephemeral: false });
    } catch (error) {
      return await inter.reply({
        content: "```js\n" + String(error).slice(0, 1536) + "```",
        ephemeral: true,
      });
    }
  },
};
