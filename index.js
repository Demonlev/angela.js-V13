const { createAudioPlayer } = require('@discordjs/voice');
const discord = require('discord.js');
const fs = require('fs');
require('dotenv').config();
const firebase = require('firebase/app');

const isDev = true;

let guild = null;
let token = null;

if (isDev) {
  token = process.env.TOKEN_DEV;
  guild = process.env.GUILD_DEV;
}

if (!isDev) {
  token = process.env.TOKEN_PROD;
  guild = process.env.GUILD_PROD;
}

const Client = new discord.Client({
  intents: [
    discord.Intents.FLAGS.GUILDS,
    discord.Intents.FLAGS.GUILD_MEMBERS,
    discord.Intents.FLAGS.GUILD_MESSAGES,
    discord.Intents.FLAGS.GUILD_VOICE_STATES
  ],
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true }
});

firebase.initializeApp({
  apiKey: process.env.FB_API_KEY,
  authDomain: process.env.FB_AUTH_DOMAIN,
  databaseURL: process.env.FB_DATABASE_URL,
  projectId: process.env.FB_PROJECT_ID,
  storageBucket: process.env.FB_STORAGE_BUCKET,
  messagingSenderId: process.env.FB_MESSAGING_SENDER_ID,
  appId: process.env.FB_APP_ID
});

Client.SlashCommands = new discord.Collection();
Client.aliases = new discord.Collection();
Client.events = new discord.Collection();
const subscriptions = new Map();
let subscription = subscriptions.get(guild);
module.exports.subscriptions = subscriptions;
module.exports.subscription = subscription;
module.exports.Client = Client;
module.exports.guild = guild;

fs.readdirSync('./commands/').forEach((dir) => {
  fs.readdir(`./commands/${dir}`, (err, files) => {
    if (err) throw err;
    const jsFiles = files.filter((f) => f.split('.').pop() === 'js');
    if (jsFiles.length <= 0) return console.log("[COMMANDS HANDLER] - Can't find any commands!");
    jsFiles.forEach((command) => {
      const commandGet = require(`./commands/${dir}/${command}`);
      console.log(`[COMMANDS HANDLER] - Command ${command} was loaded`);
      try {
        Client.SlashCommands.set(commandGet.help.name, commandGet);
      } catch (err) {
        return console.log('[COMMANDS HANDLER]\n' + err);
      }
    });
  });
});

fs.readdirSync('./events/').forEach((file) => {
  const jsFiles = fs.readdirSync('./events/').filter((f) => f.split('.').pop() === 'js');
  if (jsFiles.length <= 0) return console.log("[EVENTS HANDLER] - Can't find any events!");

  jsFiles.forEach((event) => {
    const eventGet = require(`./events/${event}`);
    let checkerEvent = true;

    try {
      Client.events.set(eventGet.name, eventGet);
      if (checkerEvent) {
        checkerEvent = false;
        console.log(`[EVENTS HANDLER] - Event ${event} was loaded`);
      }
    } catch (err) {
      return console.log('[EVENTS HANDLER]\n' + err);
    }
  });
});

Client.on('error', (err) => {
  console.log(err.message);
});

Client.login(token);
