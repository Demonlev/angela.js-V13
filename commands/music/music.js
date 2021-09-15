const { CommandInteraction, MessageEmbed } = require('discord.js');

const { sysColor } = require('../../angImg');
let { player } = require('../../index');

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
      if (!inter.member.voice.channelId)
        return await inter.reply({
          content: 'Зайдите в голосовой канал, чтобы использовать музыкальные команды!',
          ephemeral: true
        });
      if (inter.guild.me.voice.channelId && inter.member.voice.channelId !== inter.guild.me.voice.channelId)
        return await inter.reply({ content: 'Вы должны находиться в том же канале, что и я!', ephemeral: true });
      const query = inter.options.getString('поиск');
      const queue = player.createQueue(inter.guild, {
        metadata: {
          channel: inter.channel
        }
      });

      try {
        if (!queue.connection) await queue.connect(inter.member.voice.channel);
      } catch {
        queue.destroy();
        return await inter.reply({ content: 'Не могу зайти в голосовой канал!', ephemeral: true });
      }

      await inter.deferReply();
      const track = await player
        .search(query, {
          requestedBy: inter.user
        })
        .then((x) => x.tracks[0]);
      if (!track) return await inter.followUp({ content: `**${query}** не найден!`, ephemeral: true });

      queue.play(track);
      const embed = new MessageEmbed()
        .setColor('#9B59B6')
        .setFooter('os:/music/track.info', sysColor('red'))
        .setTimestamp(new Date())
        .setThumbnail(track.thumbnail)
        .setAuthor('Добавил в очередь', inter.user.avatarURL({ size: 64 }));

      embed.addField(track.url, track.title);
      embed.addField('Длительность', `${new Date(track.durationMS * 1000).toISOString().substr(11, 8)}`);
      return await inter.followUp({ content: '\u200b', embeds: [embed] });
    }

    if (inter.options.getSubcommand() === 'queue') {
      await inter.deferReply();
      const tracks = player.getQueue(inter.guildId).tracks;

      const embed = new MessageEmbed()
        .setColor('#9B59B6')
        .setFooter('os:/music/track.info', sysColor('red'))
        .setTimestamp(new Date())
        .setThumbnail(player.getQueue(inter.guildId).current.thumbnail)
        .setAuthor('Сейчас играет');
      embed.addField(player.getQueue(inter.guildId).current.url, player.getQueue(inter.guildId).current.title);
      embed.addField('Длительность', `${new Date(player.getQueue(inter.guildId).current.durationMS * 1000).toISOString().substr(11, 8)}`);

      let secondsLeft = player.getQueue(inter.guildId).current.durationMS * 1000;

      tracks.forEach((track, id) => {
        secondsLeft = secondsLeft + track.durationMS * 1000;
        embed.addField('\u200b', '\u200b');
        embed.addField(`========== В очереди #${id + 2} ==========`, `${track.title}\n${track.url}`);
        embed.addField('Длительность', `${new Date(track.durationMS * 1000).toISOString().substr(11, 8)}`);
        embed.addField('Будет играть через: ', `${new Date(secondsLeft).toISOString().substr(11, 8)}`);
      });

      return await inter.followUp({ content: '\u200b', embeds: [embed] });
    }

    if (inter.options.getSubcommand() === 'stop') {
      player.getQueue(inter.guildId).stop();
      return await inter.followUp({ content: 'Плеер выключен' });
    }

    if (inter.options.getSubcommand() === 'pause') {
      await inter.deferReply();
      const state = inter.options.getBoolean('пауза');

      if (state === false) {
        player.getQueue(inter.guildId).setPaused(false);
        return await inter.followUp({content: 'Плеер на паузе!', ephemeral: false});
      } else if (state === true) {
        player.getQueue(inter.guildId).setPaused(true);
        return await inter.followUp({content: 'Плеер снят с паузы!', ephemeral: false});
      } else {
        return await inter.followUp({content: 'Ошибка - music.js 101!', ephemeral: true});
      }
    }

    if (inter.options.getSubcommand() === 'skip') {
      const current = player.getQueue(inter.guildId).current;
      player.getQueue(inter.guildId).skip(true);
      return await inter.reply({content: `**${current.title}** пропущен!`});
    }

    if (inter.options.getSubcommand() === 'leave') {
      player.getQueue(inter.guildId).destroy(true);
      return await inter.reply({content: `Выхожу.`, ephemeral: false});
    }
  }
};

module.exports.help = {
  name: 'music',
  permission: []
};
