import { SlashCommandBuilder } from "@discordjs/builders";
import { sysColor, getEmotion } from "utils/utils";
import { CommandInteraction, MessageEmbed } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Ping <-=-> Pong"),
  async execute(inter: CommandInteraction) {
    const embed = new MessageEmbed();
    embed.setColor("#9B59B6");
    embed.setTimestamp(new Date());
    embed.setAuthor({
      name: "Состояние серверов",
      iconURL: sysColor("red"),
    });
    embed.setThumbnail(getEmotion("stand"));
    embed.setFooter({ text: "os:/system/ping.info", iconURL: sysColor("red") });
    const delay = inter.client.ws.ping;
    let message = "Всё работает!";
    if (delay > 1000) {
      message = "Небольшая задержка.";
    }
    if (delay > 2500) {
      message = "Есть задержка.";
    }
    embed.addField(`[Discord API] - ${delay}мс`, message);
    await inter.reply({ content: null, ephemeral: true, embeds: [embed] });
  },
};
