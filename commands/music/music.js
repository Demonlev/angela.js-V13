const { CommandInteraction, GuildMember, MessageEmbed } = require('discord.js');
const { AudioPlayerStatus, entersState, joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const { YTSearcher } = require('ytsearcher');
const { Track } = require('../../helpers/track');
const { MusicSubscription } = require('../../helpers/subscription');

const { sysColor } = require('../../angImg');
let { guild, connection, subscription, subscriptions } = require('../../index');

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
      inter.deferReply();
      let url = inter.options.getString('поиск');

      if (!url) {
        inter.followUp({ content: 'Введите ссылку или название видео!', ephemeral: true });
        return;
      }

      if (url.substr(0, 17) !== 'https://youtu.be/' || url.substr(0, 29) !== 'https://www.youtube.com/watch') {
        const result = await searcher.search(url, { type: 'video' });
        if (!result.currentPage[0]) {
          inter.followUp({ content: 'Ничего не найдено.', ephemeral: true });
          return;
        }
        if (!result.currentPage[0].url) {
          inter.followUp({ content: 'Ничего не найдено.', ephemeral: true });
          return;
        }
        url = result.currentPage[0].url;
      }

      if (!subscription) {
        if (inter.member instanceof GuildMember && inter.member.voice.channel) {
          subscription = new MusicSubscription(
            joinVoiceChannel({
              channelId: channel_id,
              guildId: guild,
              adapterCreator: inter.guild.voiceAdapterCreator
            })
          );
          subscription.voiceConnection.on('error', console.warn);
          subscriptions.set(inter.guildId, subscription);
        }
      }

      if (!subscription) {
        await interaction.followUp('Зайдите в голосовой канал, чтобы использовать голосовые команды!');
        return;
      }

      try {
        await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
      } catch (error) {
        console.warn(error);
        await inter.followUp('Не удалось включить трек. Попробуйте позже!');
        return;
      }

      try {
        // Attempt to create a Track from the user's video URL
        const track = await Track.from(url, {
          onStart() {},
          onFinish() {},
          onError(error) {
            console.warn(error);
            inter.followUp({ content: `Error: ${error.message}`, ephemeral: false }).catch(console.warn);
          }
        });
        // Enqueue the track and reply a success message to the user
        subscription.enqueue(track);
        const embed = new MessageEmbed()
          .setColor('#9B59B6')
          .setFooter('os:/music/track.info', sysColor('red'))
          .setTimestamp(new Date())
          .setThumbnail(track.thumbnail)
          .setAuthor('Добавил в очередь', inter.user.avatarURL({ size: 64 }));

        embed.addField(track.url, track.title);
        embed.addField('Длительность', `${new Date(track.duration * 1000).toISOString().substr(11, 8)}`);
        await inter.followUp({ content: '\u200b', embeds: [embed] });
      } catch (error) {
        console.warn(error);
        await inter.reply('Не удалось включить трек. Попробуйте позже!');
      }
    }

    if (inter.options.getSubcommand() === 'stop') {
      if (connection) connection.destroy();
      return await inter.reply({ content: 'Выхожу из голосового', ephemeral: false });
    }

    if (inter.options.getSubcommand() === 'skip') {
      if (subscription) {
        // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
        // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
        // will be loaded and played.
        subscription.audioPlayer.stop();
        await inter.reply({ content: 'Трек пропущен!', ephemeral: false });
      } else {
        await inter.reply({ content: 'Ошибка: music - 100!', ephemeral: true });
      }
    }

    if (inter.options.getSubcommand() === 'queue') {
      if (subscription) {
        const current =
          subscription.audioPlayer.state.status === AudioPlayerStatus.Idle
            ? undefined
            : subscription.audioPlayer.state.resource.metadata;

        const queue = subscription.queue.slice(0, 2).map((track, index) => {
          return {
            title: track.title,
            thumbnail: track.thumbnail,
            duration: track.duration,
            url: track.url,
            queue: index
          };
        });

        const embed = new MessageEmbed()
          .setColor('#9B59B6')
          .setFooter('os:/music/track.info', sysColor('red'))
          .setTimestamp(new Date())
          .setThumbnail(current.thumbnail)
          .setAuthor('Сейчас играет');
        embed.addField(current.url, current.title);
        embed.addField('Длительность', `${new Date(current.duration * 1000).toISOString().substr(11, 8)}`);

        let secondsLeft = current.duration * 1000;

        queue.forEach((track) => {
          secondsLeft = secondsLeft + track.duration * 1000;
          embed.addField('\u200b', '\u200b');
          embed.addField(`========== В очереди #${track.queue + 2} ==========`, `${track.title}\n${track.url}`);
          embed.addField('Длительность', `${new Date(track.duration * 1000).toISOString().substr(11, 8)}`);
          embed.addField('До трека примерно осталось', `${new Date(secondsLeft).toISOString().substr(11, 8)}`);
        });

        await inter.reply({ content: '\u200b', embeds: [embed], ephemeral: false });
      } else {
        await inter.reply({ content: 'Очереди нет.', ephemeral: true });
      }
    }

    if (inter.options.getSubcommand() === 'pause') {
      if (subscription) {
        subscription.audioPlayer.pause();
        await inter.reply({ content: `Ставлю на паузу!`, ephemeral: false });
      } else {
        await inter.reply({ content: 'Ошибка: music - 127!', ephemeral: true });
      }
    }

    if (inter.options.getSubcommand() === 'resume') {
      if (subscription) {
        subscription.audioPlayer.unpause();
        await inter.reply({ content: `Продолжаю играть трек!`, ephemeral: false });
      } else {
        await inter.reply({ content: 'Ошибка: music - 136!', ephemeral: true });
      }
    }

    if (inter.options.getSubcommand() === 'leave') {
      if (subscription) {
        subscription.voiceConnection.destroy();
        subscriptions.delete(guild);
        await inter.reply({ content: `Покидаю канал!`, ephemeral: false });
      } else {
        await inter.reply({ content: 'Ошибка: music - 146!', ephemeral: true });
      }
    }
  }
};

module.exports.help = {
  name: 'music',
  permission: []
};
