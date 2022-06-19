import {
  Client,
  Collection,
  CommandInteraction,
  GuildMember,
  Message,
  MessageEmbed,
  TextBasedChannel,
  User,
  VoiceBasedChannel,
} from "discord.js";
import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  joinVoiceChannel,
  PlayerSubscription,
  VoiceConnection,
  createAudioResource,
  AudioResource,
} from "@discordjs/voice";
import {
  EngineType,
  isContainBotMessageType,
  historyType,
  playerHistoryType,
  sendMessagePlayerType,
  cmdHistoryType,
} from "@player/player";
import ytdl from "ytdl-core";
import ytsr from "youtube-sr";
import { isValidHttpUrl } from "@utils/utils";

export class Player {
  public channelVoice!: VoiceBasedChannel;
  public channelText!: TextBasedChannel | null;
  public currentTrack: Track | null = null;
  public guildPrevQuery: Track[] = [];
  public guildQuery: Track[] = [];
  public cmdHistory: cmdHistoryType[] = [];
  private audioPlayer!: AudioPlayer;
  private connection!: VoiceConnection;
  public messagePlayer: Message | null = null;
  public messageHistory: Message | null = null;
  public messageHistoryQuery: playerHistoryType | null = null;
  private subscription: PlayerSubscription | undefined;
  public Client!: Client;
  public isPaused: boolean = true;
  public queryDuration: number = 0;

  constructor(inter: CommandInteraction, query: string, engine: EngineType) {
    this.initiatePlayer(inter, query, engine);
  }

  public addTrack(track: Track) {
    this.addCmdHistory("play", track.addedBy);
    this.getHistory();
    if (this.guildQuery.length === 0 && this.currentTrack === null) {
      this.playTrack(track);
      this.sendMessagePlayer({ track });
    } else if (this.currentTrack !== null) {
      this.guildQuery.push(track);
      this.queryDuration = this.queryDuration + track.duration;
      this.sendMessagePlayer({ track, added: true });
    }
  }

  public shuffle(user?: User) {
    this.guildQuery = this.guildQuery.sort(() => Math.random() - 0.5);
    if (user) {
      this.addCmdHistory("shuffle", user);
      return this.sendMessagePlayer({
        extraField: {
          title: "Перемешиваем очередь",
          description: `Перемешал - ${user.tag}`,
        },
      });
    }
    return this.sendMessagePlayer();
  }

  public pause(user: User, isPause: boolean | null) {
    if (isPause === false) {
      this.isPaused = false;
      this.audioPlayer.unpause();
      if (user) {
        this.addCmdHistory("pause", user);
        return this.sendMessagePlayer({
          extraField: {
            title: "Возобновляем плеер",
            description: `Возобновил - ${user.tag}`,
          },
        });
      }
    } else {
      this.isPaused = isPause || true;
      this.audioPlayer.pause(true);
      if (user) {
        this.addCmdHistory("unpause", user);
        return this.sendMessagePlayer({
          extraField: {
            title: "Останавливаем плеер",
            description: `Остановил - ${user.tag}`,
          },
        });
      }
    }
    return this.sendMessagePlayer();
  }

  public joinVoice(channelVoice: VoiceBasedChannel | null) {
    if (channelVoice) {
      this.connection = joinVoiceChannel({
        channelId: channelVoice.id,
        guildId: channelVoice.guild.id,
        adapterCreator: channelVoice.guild.voiceAdapterCreator,
      });
      this.channelVoice = channelVoice;
    }
  }

  public async search(query: string, engine: EngineType, inter: CommandInteraction) {
    const userChannel = (inter.member as GuildMember).voice.channel;
    if (userChannel && userChannel.id !== this.channelVoice.id) {
      if (this.channelVoice.members.size > 1) {
        return "not same";
      } else {
        this.joinVoice(userChannel);
      }
    }
    let isLink = isValidHttpUrl(query);

    const ytdlVideo = async (url: string) => {
      try {
        const downloadResult = ytdl(url, { filter: "audioonly", quality: "highestaudio" });
        const info = await ytdl.getInfo(url);
        const v = info.videoDetails;
        const resource = createAudioResource(downloadResult);
        const thumbnails = v.thumbnails.sort((a, b) => b.width - a.width);
        const track = new Track(v.title, url, Number(v.lengthSeconds), thumbnails[0].url, engine, inter.user, resource);
        this.addTrack(track);
      } catch (error) {}
    };

    if (isLink === false) {
      switch (engine) {
        case "youtube":
          const searchResult = await ytsr.search(query, { safeSearch: false, type: "all" });
          if (searchResult && searchResult[0].type === "video") {
            const v = searchResult[0];
            try {
              ytdlVideo(v.url);
            } catch (error) {}
            return;
          } else if (searchResult[0].type === "playlist") {
            const v = searchResult[0].videos.slice(0, 15);
            for (let idx = 0; idx < v.length; idx++) {
              ytdlVideo(v[idx].url);
            }
            return;
          }
          return;
        default:
          return;
      }
    } else {
      switch (engine) {
        case "youtube":
          ytdlVideo(query);
          return;
        default:
          return;
      }
    }
  }

  private playTrack(track?: Track) {
    this.audioPlayer.stop();
    if (track) {
      this.audioPlayer.play(track.resource);
      this.currentTrack = track;
    }
  }

  public playNextQuery(user?: User) {
    const currentTrack = this.currentTrack;
    if (currentTrack) {
      this.queryDuration = this.queryDuration - currentTrack.duration;
    }
    this.currentTrack = null;

    if (currentTrack) {
      this.guildPrevQuery.push(currentTrack);
      this.guildPrevQuery = this.guildPrevQuery.slice(0, 5);
    }
    if (this.guildQuery.length !== 0) {
      const nextTrack = this.guildQuery[0];
      this.guildQuery = this.guildQuery.slice(1);
      this.playTrack(nextTrack);
    } else this.playTrack();
    if (user) {
      if (this.messageHistory) this.getHistory(this.messageHistoryQuery);
      this.addCmdHistory("skip", user);
      return this.sendMessagePlayer({
        extraField: {
          title: "Пропускаем трек",
          description: `Пропустил - ${user.tag}`,
        },
      });
    }
    if (this.messageHistory) this.getHistory(this.messageHistoryQuery);
    return this.sendMessagePlayer();
  }

  private async sendMessagePlayer(arg?: sendMessagePlayerType) {
    const playableTrack = arg?.track || this.currentTrack;
    let isEditMessagePlayer = false;
    if (this.channelText) {
      const messages = await this.channelText.messages.fetch({ limit: 3 });
      const { isContain, message } = this.isContainBotMessages(messages.reverse(), this.Client, "Audio Player");
      isEditMessagePlayer = isContain;
      if (isContain) {
        this.messagePlayer = message;
      }
    }

    const embed = this.createEmbedPlayer();
    if (arg?.added && playableTrack) {
      const title = playableTrack.title || playableTrack.url;
      const author = playableTrack.addedBy;
      embed.addField(
        `Добавлено - ${title} - ${getDurationFancy(playableTrack.duration)}`,
        `${author.tag} поставил в очередь трек`
      );
    }
    if (this.messagePlayer && isEditMessagePlayer) {
      this.messagePlayer.edit({ content: null, embeds: [embed] });
    } else if (this.channelText) {
      try {
        const messages = await this.channelText.messages.fetch({ limit: 25 });
        await this.deleteOtherBotMessages(messages, this.Client, "Audio Player");
      } catch (error) {}
      this.channelText.send({ content: null, embeds: [embed] }).then((msg) => (this.messagePlayer = msg));
    }

    return embed;
  }

  private createEmbedPlayer() {
    const track = this.currentTrack;
    const embed = new MessageEmbed();
    embed.setFooter({ text: "Audio Player" });
    embed.setColor("RANDOM");
    embed.setTimestamp(new Date());
    if (track) {
      embed.setAuthor({ name: "Плеер - играет" });
      if (track.thumbnail) embed.setThumbnail(track.thumbnail);
      const inQueryField = this.guildQuery.length
        ? `${this.guildQuery.length} трек(а/ов) - ${getDurationFancy(this.queryDuration)}`
        : "Пусто";
      embed.addField("Длительность", getDurationFancy(track.duration), true);
      embed.addField("В очереди", inQueryField, true);
      embed.setTitle(track.title || track.url);
      embed.setDescription(`Добавил - <@${track.addedBy.id}>`);
      embed.setURL(track.url);
      const avatarURL = track.addedBy.avatarURL({ size: 64, dynamic: true });
      if (avatarURL) {
        embed.setFooter({ text: "Audio Player", iconURL: avatarURL });
      }
      if (this.guildQuery.length > 0) {
        const nextTrack = this.guildQuery[0];
        const t = nextTrack.title;
        embed.addField(`Следующий трек${t ? " - " + t : ""} - ${getDurationFancy(nextTrack.duration)}`, nextTrack.url);
      }
    } else if (this.currentTrack === null && this.guildQuery.length === 0) {
      embed.setTitle("Используйте команды");
      embed.setAuthor({ name: "Плеер - пусто" });
      embed.addField("/m play {query}", "Ссылка или запрос", false);
    }

    return embed;
  }

  private initiatePlayer(inter: CommandInteraction, query: string, engine: EngineType) {
    const channelVoice = (inter.member as GuildMember).voice.channel;
    const channelText = inter.channel;
    const Client = inter.client;
    if (channelVoice === null) return;
    this.channelVoice = channelVoice;
    this.channelText = channelText;
    this.Client = Client;
    this.connection = joinVoiceChannel({
      channelId: this.channelVoice.id,
      guildId: this.channelVoice.guild.id,
      adapterCreator: this.channelVoice.guild.voiceAdapterCreator,
    });
    this.audioPlayer = createAudioPlayer();
    this.subscription = this.connection.subscribe(this.audioPlayer);
    this.search(query, engine, inter);
    this.stateChanges();
  }

  private stateChanges() {
    this.audioPlayer.on<"stateChange">("stateChange", (oldState, newState) => {
      if (this.channelText) {
        if (oldState.status === AudioPlayerStatus.AutoPaused && newState.status === AudioPlayerStatus.Playing) {
          this.sendMessagePlayer();
          this.isPaused = false;
        } else if (newState.status === AudioPlayerStatus.Idle) {
          this.playNextQuery();
        } else if (oldState.status === AudioPlayerStatus.Buffering && newState.status === AudioPlayerStatus.Playing) {
          this.sendMessagePlayer();
          this.isPaused = false;
        }
      }
    });
  }

  private isContainBotMessages(
    messages: Collection<string, Message<boolean>>,
    Client: Client,
    footerText: string
  ): isContainBotMessageType {
    let isContain = false;
    let message: Message | null = null;
    messages.each((m) => {
      try {
        if (m.embeds[0].footer && m.client.user && Client.user) {
          const footer = m.embeds[0].footer.text === footerText;
          const isBot = m.client.user.bot;
          const isAngela = m.author.tag === Client.user.tag;
          if (footer && isBot && isAngela) {
            isContain = true;
            message = m;
          }
        }
      } catch (error) {}
    });
    return {
      isContain,
      message,
    };
  }

  private deleteOtherBotMessages(messages: Collection<string, Message<boolean>>, Client: Client, footerText: string) {
    messages.each((m) => {
      try {
        if (m.embeds && m.embeds[0].footer && m.client.user && Client.user) {
          const footer = m.embeds[0].footer.text === footerText;
          const isBot = m.client.user.bot;
          const isAngela = m.author.tag === Client.user.tag;
          if (footer && isBot && isAngela) {
            if (m.deletable) m.delete().catch();
          }
        }
      } catch (error) {}
    });
  }

  private addCmdHistory(cmd: string, user: User) {
    this.cmdHistory.unshift({ cmd, user: user.tag, time: `<t:${~~(new Date().getTime() / 1000)}>` });
    this.cmdHistory = this.cmdHistory.slice(0, 7);
  }

  public async getHistory(history?: playerHistoryType | null, inter?: CommandInteraction) {
    this.messageHistoryQuery = history || null;
    let isEditMessage = false;
    if (this.channelText) {
      const messages = await this.channelText.messages.fetch({ limit: 3 });
      const isContain = this.isContainBotMessages(messages, this.Client, "Player History");
      isEditMessage = isContain.isContain;
      this.messageHistory = isContain.message;
      if (isEditMessage === false) {
        const messages = await this.channelText.messages.fetch({ limit: 25 });
        await this.deleteOtherBotMessages(messages, this.Client, "Player History");
      }
    }

    const embed = this.createEmbedHistory(inter ? inter.user.id : undefined);

    if (isEditMessage && this.messageHistory) {
      return await this.messageHistory.edit({ content: null, embeds: [embed] });
    } else if (this.channelText) {
      return await this.channelText.send({ content: null, embeds: [embed] }).then((msg) => (this.messageHistory = msg));
    }
  }

  private createEmbedHistory(userId?: string) {
    const embed = new MessageEmbed();
    let title = "";
    if (this.messageHistoryQuery === "current" || this.messageHistoryQuery === null) title = "Текущая очередь";
    if (this.messageHistoryQuery === "previous") title = "Последние 5 треков";
    if (this.messageHistoryQuery === "commands") title = "Последние 7 команд";
    embed.setTitle(title);
    if (userId) {
      embed.setDescription(`Запросил(а) - <@${userId}>`);
    } else {
      embed.setDescription(`Очередь обновлена. <t:${~~(new Date().getTime() / 1000)}>`);
    }
    embed.setColor("RANDOM");
    embed.setTimestamp(new Date());
    embed.setFooter({ text: "Player History" });
    switch (this.messageHistoryQuery) {
      default:
      case "current":
        const gq = this.guildQuery.slice(0, 7);
        if (gq.length > 0) {
          let gqDuration = 0;
          for (let idx = 0; idx < gq.length; idx++) {
            gqDuration += gq[idx].duration;
            const title = gq[idx].title;
            const desc = `${gq[idx].url} | Добавил(а) - ${gq[idx].addedBy.tag} | ${getDurationFancy(gq[idx].duration)}`;
            embed.addField(title || gq[idx].url, desc);
          }
          const endTime = ~~(new Date().getTime() / 1000 + this.queryDuration);
          if (this.guildQuery.length > 7) {
            const thisTracks = getDurationFancy(this.queryDuration - gqDuration);
            embed.addField(
              `Ещё в очереди - ${this.guildQuery.length - gq.length} трек(а/ов) | ${thisTracks}`,
              `Общее время всех треков - ${getDurationFancy(this.queryDuration)} | Конец в <t:${endTime}>}`
            );
          } else {
            embed.addField(
              `Всего в очереди - ${this.guildQuery.length} трек(а/ов)`,
              `Общее время всех треков - ${getDurationFancy(this.queryDuration)} | Конец в <t:${endTime}>`
            );
          }
        } else {
          embed.addField("Очередь пуста", "/m play {query} - для добавления в очередь");
        }
        break;
      case "previous":
        const gpq = this.guildPrevQuery.slice(0, 5);
        let gpqDuration = 0;
        for (let idx = 0; idx < gpq.length; idx++) {
          gpqDuration += gpq[idx].duration;
          const title = gpq[idx].title;
          const desc = `${gpq[idx].url} | Добавил(а) - ${gpq[idx].addedBy.tag} | ${getDurationFancy(gpq[idx].duration)}`;
          embed.addField(title || gpq[idx].url, desc);
        }
        embed.addField(`Общее время этих треков - ${getDurationFancy(gpqDuration)}`, "\u200b");
        break;
      case "commands":
        const cq = this.cmdHistory.slice(0, 7);
        for (let idx = 0; idx < cq.length; idx++) {
          const title = cq[idx].cmd;
          const desc = cq[idx].user + " | " + cq[idx].time;
          embed.addField(title, desc);
        }
        break;
    }
    return embed;
  }
}

function getDurationFancy(duration: number) {
  const hours = ~~(duration / 3600);
  const minutes = ~~((duration % 3600) / 60);
  const seconds = ~~duration % 60;

  let time = "";

  if (hours > 0) {
    time += "" + hours + ":" + (minutes < 10 ? "0" : "");
  }

  time += "" + minutes + ":" + (seconds < 10 ? "0" : "");
  time += "" + seconds;
  return time;
}

class Track {
  title?: string;
  url: string;
  duration: number;
  thumbnail?: string;
  engine: EngineType;
  addedBy: User;
  resource: AudioResource;

  constructor(
    title: string | undefined,
    url: string,
    duration: number,
    thumbnail: string | undefined,
    engine: EngineType,
    addedBy: User,
    resource: AudioResource
  ) {
    this.title = title;
    this.url = url;
    this.duration = duration;
    this.thumbnail = thumbnail;
    this.engine = engine;
    this.addedBy = addedBy;
    this.resource = resource;
  }
}

const getTimeFancy = (time?: number) =>
  new Date(time || new Date().getTime()).toLocaleTimeString("default", {
    weekday: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
