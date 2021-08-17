const { CommandInteraction, MessageEmbed } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType } = require('@discordjs/voice');
const ytdl = require('ytdl-core-discord');
const { YTSearcher } = require('ytsearcher');

let { guild, connection, player } = require('../../index');

const searcher = new YTSearcher({
  key: process.env.YT_API_KEY,
  revealKey: true
});

/**
 * @param {CommandInteraction} inter
 */
module.exports.run = async (inter) => {
  const channel_id = inter.member.voice.channelId;
  if (!channel_id) {
    return await inter.reply({
      content: 'Зайдите в голосовой канал, чтобы использовать музыкальные команды.',
      ephemeral: true
    });
  } else {
    if (inter.options.getSubcommand() === 'play') {
      const value = inter.options.getString('поиск');
      if (!value) {
        return await inter.reply({ content: 'Укажите ссылку или название видео.' });
      }

      // ONE VIDEO BY NAME
      if (value.substr(0, 8) !== 'https://') {
        const result = await searcher.search(value, { type: 'video' });

        if (!result.currentPage[0].url) {
          inter.reply({ content: 'Ничего не найдено.', ephemeral: true });
        }

        play(inter, result.currentPage[0].url);

        return await inter.reply({ content: result.currentPage[0].url });
      }

      // ONE VIDEO BY URL
      if (value.substr(0, 17) === 'https://youtu.be/' || value.substr(0, 29) === 'https://www.youtube.com/watch') {
        play(inter, value);

        return await inter.reply({ content: info.videoDetails.title + 'играет.' });
      }
    }

    if (inter.options.getSubcommand() === 'stop') {
      if (connection) connection.destroy();
      return await inter.reply({ content: 'Выхожу из голосового', ephemeral: false });
    }

    if (inter.options.getSubcommand() === 'skip') {
      player.stop();
      return await inter.reply({ content: 'Пропускаю текущий трек.', ephemeral: false });
    }

    // if (inter.options.getSubcommand() === 'queue') {
    //   const embed = new MessageEmbed()
    //     .setColor('#9B59B6')
    //     .setFooter('os:/music/queue.info', sysColor('red'))
    //     .setTimestamp(new Date())
    //     .setAuthor('Очередь', sysColor('red'));

    //   musicQueue.get('queue').forEach((url) => {
    //     embed.addField(url, '\u200b');
    //   });
    //   return await inter.reply({ content: '\u200b', embeds: [embed] });
    // }
  }

  return await inter.reply({ content: 'music', ephemeral: false });
};

/**
 * @param {CommandInteraction} inter
 */
async function play(inter, url) {
  if (!connection) {
    const channel_id = inter.member.voice.channelId;
    connection = await joinVoiceChannel({
      channelId: channel_id,
      guildId: guild,
      adapterCreator: inter.guild.voiceAdapterCreator
    });
  }

  const stream = await ytdl(url);

  const source = createAudioResource(stream, { inputType: StreamType.Opus, inlineVolume: true });

  player.play(source);

  connection.subscribe(player);
}

module.exports.help = {
  name: 'music',
  permission: []
};
