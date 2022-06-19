import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import discord, { Collection, Interaction } from "discord.js";
import { Routes } from "discord-api-types/v10";
import { REST } from "@discordjs/rest";
import { guildQueryType } from "@player/player";

const BOT_TOKEN = process.env.TOKEN || "";
const BOT_APP = process.env.APP || "";
export const ID_ADMINS = ["341647130294747137", "485033648672735253"];
export const guildsQuries: Map<string, guildQueryType> = new Map();

class DisClient extends discord.Client {
  commands: Collection<unknown, any> = new Collection();
}

export const Client = new DisClient({
  intents: [
    discord.Intents.FLAGS.GUILDS,
    discord.Intents.FLAGS.GUILD_MEMBERS,
    discord.Intents.FLAGS.GUILD_MESSAGES,
    discord.Intents.FLAGS.GUILD_VOICE_STATES,
    discord.Intents.FLAGS.DIRECT_MESSAGES,
    discord.Intents.FLAGS.DIRECT_MESSAGE_TYPING,
  ],
  allowedMentions: { parse: ["users", "roles"], repliedUser: true },
});

Client.commands = new Collection();
if (Client.application) {
  Client.application.commands.set([]);
}
const commands: any[] = [];

function handleCommands(arr: any[], callback: (data: any[]) => void) {
  const commandsDir = fs.readdirSync(path.join(__dirname, "commands"));
  for (let idx = 0; idx < commandsDir.length; idx++) {
    const dir = commandsDir[idx];
    if (dir.endsWith(".js") || dir.endsWith(".ts")) {
      const commandFile = require(path.join(__dirname, "commands", dir));
      console.log(`[command_handler] - ${dir} loaded`);
      Client.commands.set(commandFile.data.name, commandFile);
      arr.push(commandFile.data.toJSON());
    } else {
      const commandsTypeDir = fs.readdirSync(path.join(__dirname, "commands", dir));
      for (let kdx = 0; kdx < commandsTypeDir.length; kdx++) {
        const file = commandsTypeDir[kdx];
        const commandFile = require(path.join(__dirname, "commands", dir, file));
        console.log(`[command_handler] - ${file} loaded`);
        Client.commands.set(commandFile.data.name, commandFile);
        arr.push(commandFile.data.toJSON());
      }
    }
  }
  callback(arr);
}

const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

(async () => {
  try {
    handleCommands(commands, async (cmd) => {
      await rest.put(Routes.applicationCommands(BOT_APP), {
        body: cmd,
      });
    });
  } catch (error) {
    console.error(error);
  }
})();

Client.on("interactionCreate", async (inter: Interaction) => {
  if (!inter.isCommand()) return;
  try {
    const command = Client.commands.get(inter.commandName);
    if (!command) return;
    await command.execute(inter);
  } catch (error) {
    console.log(`[inter_error] - ${error}`);
    const ephemeral = inter.ephemeral !== null ? inter.ephemeral : false;
    if (inter.deferred) {
      await inter.followUp({ content: "Что-то пошло не так! Проверьте написание команды.", ephemeral: ephemeral });
    } else {
      await inter.reply({ content: "Что-то пошло не так! Проверьте написание команды.", ephemeral: ephemeral });
    }
  }
});

Client.once("ready", (c) => {
  console.log(`[bot] - ${c.user.tag} is ready`);
});

Client.login(BOT_TOKEN);
