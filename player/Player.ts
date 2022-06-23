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
  createAudioResource,
  joinVoiceChannel,
  PlayerSubscription,
  VoiceConnection,
} from "@discordjs/voice";
import {
  EngineType,
  isContainBotMessageType,
  playerHistoryType,
  sendMessagePlayerType,
  cmdHistoryType,
  Track,
  playerExtraFieldType,
  searchType,
  queryPlaylistType,
  guildQueryType,
} from "@player/playerTypes";
import ytsr from "youtube-sr";
import { isValidHttpUrl } from "@utils/utils";
import ytdl from "ytdl-core";
import { exec as ytdlexec } from "youtube-dl-exec";

export const guildsQuries: Map<string, guildQueryType> = new Map();

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
  public messageHistoryQuery: playerHistoryType = "next";
  private subscription: PlayerSubscription | undefined;
  public Client!: Client;
  public isPaused: boolean = false;
  public queryDuration: number = 0;
  private extraField: playerExtraFieldType | null = null;

  constructor(
    inter: CommandInteraction,
    query: string,
    engine: EngineType,
    searchBy: searchType
  ) {
    this.initiatePlayer(inter, query, engine, searchBy);
    if (inter.channel) this.initiateMessages(inter.channel);
  }

  public initiateMessages(channel: TextBasedChannel) {
    const embedAudio = new MessageEmbed();
    embedAudio.setAuthor({ name: "Плеер - 💠 инициализация 💠" });
    embedAudio.setTitle("Инициализация");
    embedAudio.setDescription("Загружаем треки...");
    embedAudio.setFooter({ text: "Audio Player" });
    embedAudio.setColor("RANDOM");
    embedAudio.setTimestamp(new Date());

    const embedHistory = new MessageEmbed();
    embedHistory.setTitle("💠 Инициализация 💠");
    embedHistory.setDescription("Загружаем треки...");
    embedHistory.setColor("RANDOM");
    embedHistory.setTimestamp(new Date());
    embedHistory.setFooter({ text: "Player History" });

    channel.send({ content: null, embeds: [embedAudio] });
    channel.send({ content: null, embeds: [embedHistory] });
    this.createReactionListener();
  }

  public addTrack(query: Track | queryPlaylistType) {
    if (query instanceof Track) {
      this.addCmdHistory("play - " + query.title || query.url, query.addedBy);
      if (this.guildQuery.length === 0 && this.currentTrack === null) {
        this.playTrack(query);
        this.getHistory();
        this.sendMessagePlayer({ track: query });
      } else if (this.currentTrack !== null) {
        this.guildQuery.push(query);
        this.queryDuration = this.queryDuration + query.duration;
        this.getHistory();
        this.sendMessagePlayer({ track: query, added: true });
      }
    } else if (Array.isArray(query.tracks)) {
      this.addCmdHistory("play [playlist] - " + query.title, query.user);
      let pldur = 0;
      if (this.guildQuery.length === 0 && this.currentTrack === null) {
        const tracksQuery = query.tracks.slice(1);
        for (let idx = 0; idx < tracksQuery.length; idx++) {
          const track = tracksQuery[idx];
          pldur += track.duration;
          this.guildQuery.push(track);
          this.queryDuration = this.queryDuration + track.duration;
        }
        this.extraField = {
          title: `Добавлено [плейлист] - ${query.title} - ${getDurationFancy(
            pldur
          )}`,
          description: `${query.user.tag} поставил в очередь плейлист из ${query.tracks.length} трек(а/ов)`,
        };
        this.playTrack(query.tracks[0]);
        this.getHistory();
        this.sendMessagePlayer({ track: query.tracks[0] });
      } else if (this.currentTrack !== null) {
        for (let idx = 0; idx < query.tracks.length; idx++) {
          const track = query.tracks[idx];
          pldur += track.duration;
          this.guildQuery.push(track);
          this.queryDuration = this.queryDuration + track.duration;
        }
        this.extraField = {
          title: `Добавлено [плейлист] - ${query.title} - ${getDurationFancy(
            pldur
          )}`,
          description: `${query.user.tag} поставил в очередь плейлист из ${query.tracks.length} трек(а/ов)`,
        };
        this.getHistory();
        this.sendMessagePlayer();
      }
    }
  }

  public shuffle(user?: User) {
    this.messageHistoryQuery = "current";
    this.guildQuery = this.guildQuery.sort(() => Math.random() - 0.5);
    if (user) {
      this.addCmdHistory("shuffle", user);
      this.extraField = {
        title: "Shuffle",
        description: `${user.tag} перемешал очередь.`,
      };
      this.sendMessagePlayer();
      this.getHistory();
    }
    return;
  }

  public pause(user: User) {
    if (this.isPaused === true) {
      this.isPaused = false;
      this.audioPlayer.unpause();
      if (user) {
        this.addCmdHistory("unpause", user);
        this.extraField = {
          title: "Pause",
          description: `${user.tag} снял с паузы.`,
        };
        this.sendMessagePlayer();
      }
    } else if (this.isPaused === false) {
      this.isPaused = true;
      this.audioPlayer.pause(true);
      if (user) {
        this.addCmdHistory("pause", user);
        this.extraField = {
          title: "Pause",
          description: `${user.tag} поставил на паузу.`,
        };
        this.sendMessagePlayer();
      }
    }
    return;
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

  public async search(
    query: string,
    engine: EngineType,
    inter: CommandInteraction,
    st: searchType
  ) {
    const userChannel = (inter.member as GuildMember).voice.channel;
    if (userChannel && userChannel.id !== this.channelVoice.id) {
      if (this.channelVoice.members.size > 1) {
        return "NOT_SAME";
      } else {
        this.joinVoice(userChannel);
      }
    }
    if (
      inter.channel &&
      this.channelText &&
      inter.channel.id !== this.channelText.id
    ) {
      this.channelText = inter.channel;
    }
    let isLink = isValidHttpUrl(query);

    const ytdlInfo = async (urls: string[], title: string | null) => {
      try {
        const tracks: Track[] = [];

        for (let idx = 0; idx < urls.length; idx++) {
          const url = urls[idx];

          const info = await ytdl.getInfo(url).catch((_) => {
            this.sendMessagePlayer({
              error: {
                title: "Не найдено",
                description: `❌ Запрос ${query} типа ${
                  st === "playlist" ? "Плейлист" : "Видео"
                } не найден. ❌`,
              },
            });
          });

          if (info) {
            const v = info.videoDetails;
            const thumbnails = v.thumbnails.sort((a, b) => b.width - a.width);
            const track = new Track(
              v.title,
              v.video_url,
              Number(v.lengthSeconds),
              thumbnails[0].url,
              engine,
              inter.user
            );
            tracks.push(track);
          } else {
            this.sendMessagePlayer({
              error: {
                title: "Не найдено",
                description: `❌ Запрос ${query} типа ${
                  st === "playlist" ? "Плейлист" : "Видео"
                } не найден. ❌`,
              },
            });
          }
        }

        if (title) {
          this.addTrack({ tracks, title: title, user: inter.user });
        } else {
          this.addTrack(tracks[0]);
        }
      } catch (error) {
        this.sendMessagePlayer({
          error: {
            title: "Не найдено",
            description: `❌ Запрос ${query} типа ${
              st === "playlist" ? "Плейлист" : "Видео"
            } не найден. ❌`,
          },
        });
      }
    };

    if (isLink === false) {
      switch (engine) {
        case "youtube":
          switch (st) {
            default:
            case "video":
              const video = await ytsr.searchOne(query, "video").catch((_) => {
                this.sendMessagePlayer({
                  error: {
                    title: "Не найдено",
                    description: `❌ Запрос ${query} типа Видео не найден. ❌`,
                  },
                });
              });

              if (video && video.url) {
                ytdlInfo([video.url], null);
              } else {
                this.sendMessagePlayer({
                  error: {
                    title: "Не найдено",
                    description: `❌ Запрос ${query} типа Видео не найден. ❌`,
                  },
                });
              }
              break;
            case "playlist":
              const playlistSearch = await ytsr
                .searchOne(query, "playlist")
                .catch((_) => {
                  this.sendMessagePlayer({
                    error: {
                      title: "Не найдено",
                      description: `❌ Запрос ${query} типа Плейлист не найден. ❌`,
                    },
                  });
                });
              if (playlistSearch && playlistSearch.url) {
                const playlist = await ytsr
                  .getPlaylist(playlistSearch.url)
                  .catch((_) => {
                    this.sendMessagePlayer({
                      error: {
                        title: "Не найдено",
                        description: `❌ Запрос ${query} типа Плейлист не найден. ❌`,
                      },
                    });
                  });

                if (playlist) {
                  const videos = playlist.videos;

                  const urls: string[] = [];

                  for (let idx = 0; idx < videos.length; idx++) {
                    const v = videos[idx];
                    urls.push(v.url);
                  }

                  ytdlInfo(
                    urls,
                    playlist.title ? playlist.title : "Playlist title"
                  );

                  if (videos.length === 0) {
                    this.sendMessagePlayer({
                      error: {
                        title: "Не найдено",
                        description: `❌ Видео в плейлисте ${query} не найдено. ❌`,
                      },
                    });
                  }
                } else {
                  this.sendMessagePlayer({
                    error: {
                      title: "Не найдено",
                      description: `❌ Плейлист ${query} не найден. ❌`,
                    },
                  });
                }
              }
              break;
          }
          break;
        default:
          break;
      }
    } else {
      switch (engine) {
        case "youtube":
          try {
            const playlist = await ytsr.getPlaylist(query);

            if (playlist) {
              const videos = playlist.videos;
              const urls: string[] = [];
              for (let idx = 0; idx < videos.length; idx++) {
                const v = videos[idx];
                urls.push(v.url);
              }

              ytdlInfo(
                urls,
                playlist.title ? playlist.title : "Playlist title"
              );

              if (videos.length === 0) {
                this.sendMessagePlayer({
                  error: {
                    title: "Не найдено",
                    description: `❌ Видео в плейлисте ${query} не найдено. ❌`,
                  },
                });
              }
            } else {
              ytdlInfo([query], null);
            }
          } catch (error) {
            try {
              ytdlInfo([query], null);
            } catch (error) {
              this.sendMessagePlayer({
                error: {
                  title: "Не найдено",
                  description: `❌ Ссылка ${query} не найдена. ❌`,
                },
              });
            }
          }
          break;
        default:
          break;
      }
    }
  }

  public async leave(user: User) {
    if (this.channelVoice) {
      const users = this.channelVoice.members.filter(u => u.user.bot === false);
      if (users.size === 1 && users.has(user.id) || users.size === 0) {
        this.audioPlayer.stop();
        this.connection.disconnect();
        this.currentTrack = null;
        this.guildQuery = [];
        this.sendMessagePlayer();
        this.getHistory()
        guildsQuries.delete(this.channelVoice.guildId)
      }
    }
  }

  private playTrack(track?: Track) {
    this.audioPlayer.stop(false);
    if (track) {
      const resource = createAudioResourceYTDLE(track.url);
      if (resource) {
        this.currentTrack = track;
        this.audioPlayer.play(resource);
      } else {
        this.playNextQuery();
      }
    }
  }

  public playNextQuery(user?: User, skip?: boolean) {
    this.messageHistoryQuery = "next";
    if (skip === undefined || skip === false) {
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
        this.isPaused = false;
        this.playTrack(nextTrack);
      } else this.playTrack();
      if (user) {
        this.addCmdHistory("skip", user);
        this.extraField = {
          title: "Пропускаем трек",
          description: `Пропустил(а) - ${user.tag}`,
        };
      }
      if (this.messageHistory) this.getHistory();
      return this.sendMessagePlayer();
    } else if (skip === true) {
      const guildQuery = this.currentTrack
        ? [...this.guildQuery.reverse().slice(0, 4), this.currentTrack]
        : this.guildQuery.reverse().slice(0, 5);
      for (let idx = 0; idx < guildQuery.length; idx++) {
        this.guildPrevQuery.push(guildQuery[idx]);
        this.guildPrevQuery = this.guildPrevQuery.slice(0, 5);
      }
      this.guildQuery = [];
      this.isPaused = false;
      this.playTrack();
      if (this.messageHistory) this.getHistory();
      if (user) {
        this.addCmdHistory("skip-all", user);
        this.extraField = {
          title: "Пропускаем все треки",
          description: `Пропустил(а) - ${user.tag}`,
        };
        return this.sendMessagePlayer();
      } else if (user === undefined) {
        this.extraField = {
          title: "Пропускаем все треки",
          description: `Пропустил(а) - плеер`,
        };
        return this.sendMessagePlayer();
      }
    }

    return 0
  }

  private async sendMessagePlayer(arg?: sendMessagePlayerType) {
    const playableTrack = (arg && arg.track) || this.currentTrack;

    const embed = this.createEmbedPlayer();
    if (arg && arg.added && playableTrack) {
      const title = playableTrack.title || playableTrack.url;
      const author = playableTrack.addedBy;
      embed.addField(
        `Добавлено - ${title} - ${getDurationFancy(playableTrack.duration)}`,
        `${author.tag} поставил в очередь трек`
      );
    }
    if (this.extraField) {
      embed.addField(this.extraField.title, this.extraField.description);
    }
    if (arg && arg.error) {
      embed.addField(arg.error.title, arg.error.description);
    }
    this.extraField = null;
    let isEditMessagePlayer = false;
    if (this.channelText) {
      const messages = await this.channelText.messages.fetch({ limit: 3 });
      const { isContain, message } = this.isContainBotMessages(
        messages.reverse(),
        this.Client,
        "Audio Player"
      );
      isEditMessagePlayer = isContain;
      if (isContain) {
        this.messagePlayer = message;
      }
    }
    if (this.messagePlayer && isEditMessagePlayer) {
      this.messagePlayer
        .edit({ content: null, embeds: [embed] })
        .then(async (msg) => {
          const messages = await msg.channel.messages.fetch({ limit: 25 });
          this.deleteOtherBotMessages(
            messages,
            this.Client,
            "Audio Player",
            msg
          );
        });
    } else if (this.channelText) {
      this.channelText
        .send({ content: null, embeds: [embed] })
        .then(async (msg) => {
          this.messagePlayer = msg;
          const messages = await msg.channel.messages.fetch({ limit: 25 });
          this.deleteOtherBotMessages(
            messages,
            this.Client,
            "Audio Player",
            msg
          );
        });
    }

    if (!(arg && arg.added)) {
      this.initReactionsOnPlayers("audio");
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
      if (this.isPaused === true) {
        embed.setAuthor({ name: "Плеер - ⏸️ на паузе ⏸️" });
      } else {
        embed.setAuthor({ name: "Плеер - 🎶 играет 🎶" });
      }
      if (track.thumbnail) embed.setThumbnail(track.thumbnail);
      const inQueryField = this.guildQuery.length
        ? `${this.guildQuery.length} трек(а/ов) - ${getDurationFancy(
            this.queryDuration
          )}`
        : "Пусто";
      embed.addField("Длительность", getDurationFancy(track.duration), true);
      embed.addField("В очереди", inQueryField, true);
      embed.setTitle(track.title || track.url);
      embed.setDescription(`Добавил(а) - <@${track.addedBy.id}>`);
      embed.setURL(track.url);
      const avatarURL = track.addedBy.avatarURL({ size: 64, dynamic: true });
      if (avatarURL) {
        embed.setFooter({ text: "Audio Player", iconURL: avatarURL });
      }
    } else if (this.currentTrack === null && this.guildQuery.length === 0) {
      embed.setTitle("Используйте команды");
      embed.setAuthor({ name: "Плеер - ⏹️ пусто ⏹️" });
      embed.addField("/m play {query}", "Ссылка или запрос", false);
    }

    return embed;
  }

  private initiatePlayer(
    inter: CommandInteraction,
    query: string,
    engine: EngineType,
    searchBy: searchType
  ) {
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
    this.search(query, engine, inter, searchBy);
    this.stateChanges();

    this.connection.on<"stateChange">("stateChange", (oldState, newState) => {
      if (newState.status === "disconnected") {
        guildsQuries.delete(this.channelVoice.guildId);
      }
    });
  }

  private stateChanges() {
    this.audioPlayer.on<"stateChange">("stateChange", (oldState, newState) => {
      if (this.channelText) {
        if (
          oldState.status === AudioPlayerStatus.AutoPaused &&
          newState.status === AudioPlayerStatus.Playing
        ) {
          this.isPaused = false;
        } else if (newState.status === AudioPlayerStatus.Idle) {
          this.playNextQuery();
        } else if (
          oldState.status === AudioPlayerStatus.Buffering &&
          newState.status === AudioPlayerStatus.Playing
        ) {
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
    messages.reverse().each((m) => {
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

  private deleteOtherBotMessages(
    messages: Collection<string, Message<boolean>>,
    Client: Client,
    footerText: string,
    notDeleteMessage: Message | null
  ) {
    messages.each((m) => {
      if (
        m.embeds &&
        m.embeds[0] &&
        m.embeds[0].footer &&
        m.client.user &&
        Client.user
      ) {
        const footer = m.embeds[0].footer.text === footerText;
        const isBot = m.client.user.bot;
        const isAngela = m.author.tag === Client.user.tag;
        const isDeletable = notDeleteMessage
          ? notDeleteMessage.id !== m.id
          : true;
        if (footer && isBot && isAngela && isDeletable) {
          if (m.deletable) {
            m.delete().catch(console.error);
          }
        }
      }
    });
  }

  private addCmdHistory(cmd: string, user: User) {
    this.cmdHistory.unshift({
      cmd,
      user: user.tag,
      time: `<t:${~~(new Date().getTime() / 1000)}>`,
    });
    this.cmdHistory = this.cmdHistory.slice(0, 7);
  }

  public async getHistory(
    history?: playerHistoryType | null,
    inter?: CommandInteraction,
    userId?: string
  ) {
    this.messageHistoryQuery = history || this.messageHistoryQuery;
    let isEditMessage = false;
    if (
      inter &&
      inter.channel &&
      this.channelText &&
      inter.channel.id !== this.channelText.id
    ) {
      this.channelText = inter.channel;
    }
    if (this.channelText) {
      const messagesThatContain = await this.channelText.messages.fetch({
        limit: 3,
      });
      const { isContain, message } = this.isContainBotMessages(
        messagesThatContain,
        this.Client,
        "Player History"
      );
      isEditMessage = isContain;
      this.messageHistory = message;
    }

    const embed = this.createEmbedHistory(
      inter ? inter.user.id : userId ? userId : undefined
    );

    if (isEditMessage && this.messageHistory) {
      await this.messageHistory
        .edit({ content: null, embeds: [embed] })
        .then(async (msg) => {
          this.messageHistory = msg;
          const messages = await msg.channel.messages.fetch({ limit: 25 });
          this.deleteOtherBotMessages(
            messages,
            this.Client,
            "Player History",
            msg
          );
        });
    } else if (this.channelText) {
      await this.channelText
        .send({ content: null, embeds: [embed] })
        .then(async (msg) => {
          this.messageHistory = msg;
          const messages = await msg.channel.messages.fetch({ limit: 25 });
          this.deleteOtherBotMessages(
            messages,
            this.Client,
            "Player History",
            msg
          );
        });
    }

    this.initReactionsOnPlayers("history");
  }

  private createEmbedHistory(userId?: string) {
    const embed = new MessageEmbed();
    let title = "";
    if (this.messageHistoryQuery === "current") title = "Текущая очередь";
    if (this.messageHistoryQuery === "previous") title = "Последние 5 треков";
    if (this.messageHistoryQuery === "commands") title = "Последние 7 команд";
    if (this.messageHistoryQuery === "next") title = "Следующие 2 трека";
    embed.setTitle(title);
    if (userId) {
      embed.setDescription(`Запросил(а) - <@${userId}>`);
    } else {
      embed.setDescription(
        `Очередь обновлена. <t:${~~(new Date().getTime() / 1000)}>`
      );
    }
    embed.setColor("RANDOM");
    embed.setTimestamp(new Date());
    embed.setFooter({ text: "Player History" });
    switch (this.messageHistoryQuery) {
      default:
      case "current":
        const gq = this.guildQuery.slice(0, 5);
        if (gq.length > 0) {
          let gqDuration = 0;
          for (let idx = 0; idx < gq.length; idx++) {
            gqDuration += gq[idx].duration;
            const title = gq[idx].title;
            const desc = `${gq[idx].url} | Добавил(а) - ${
              gq[idx].addedBy.tag
            } | ${getDurationFancy(gq[idx].duration)}`;
            embed.addField(title || gq[idx].url, desc);
          }
          const endTime = ~~(new Date().getTime() / 1000 + this.queryDuration);
          if (this.guildQuery.length > 5) {
            const thisTracks = getDurationFancy(
              this.queryDuration - gqDuration
            );
            embed.addField(
              `Ещё в очереди - ${
                this.guildQuery.length - gq.length
              } трек(а/ов) | ${thisTracks}`,
              `Общее время всех треков - ${getDurationFancy(
                this.queryDuration
              )} | Конец в <t:${endTime}>`
            );
          } else {
            embed.addField(
              `Всего в очереди - ${this.guildQuery.length} трек(а/ов)`,
              `Общее время всех треков - ${getDurationFancy(
                this.queryDuration
              )} | Конец в <t:${endTime}>`
            );
          }
        } else {
          embed.addField(
            "Очередь пуста",
            "/m play {query} - для добавления в очередь"
          );
        }
        break;
      case "previous":
        const gpq = this.guildPrevQuery.slice(0, 5);
        let gpqDuration = 0;
        for (let idx = 0; idx < gpq.length; idx++) {
          gpqDuration += gpq[idx].duration;
          const title = gpq[idx].title;
          const desc = `${gpq[idx].url} | Добавил(а) - ${
            gpq[idx].addedBy.tag
          } | ${getDurationFancy(gpq[idx].duration)}`;
          embed.addField(title || gpq[idx].url, desc);
        }
        embed.addField(
          `Общее время этих треков - ${getDurationFancy(gpqDuration)}`,
          "\u200b"
        );
        break;
      case "commands":
        const cq = this.cmdHistory.slice(0, 7);
        for (let idx = 0; idx < cq.length; idx++) {
          const title = cq[idx].cmd;
          const desc = cq[idx].user + " | " + cq[idx].time;
          embed.addField(title, desc);
        }
        break;
      case "next":
        const nq = this.guildQuery.slice(0, 2);
        if (nq.length) {
          for (let idx = 0; idx < nq.length; idx++) {
            const title = nq[idx].title;
            const desc = `${nq[idx].url} | Добавил(а) - ${
              nq[idx].addedBy.tag
            } | ${getDurationFancy(nq[idx].duration)}`;
            embed.addField(title || nq[idx].url, desc);
          }
          if (this.guildQuery.length > 2) {
            const endTime = ~~(
              new Date().getTime() / 1000 +
              this.queryDuration
            );
            embed.addField(
              `Ещё в очереди - ${
                this.guildQuery.length - nq.length
              } трек(а/ов)`,
              `Общее время всех треков - ${getDurationFancy(
                this.queryDuration
              )} | Конец в <t:${endTime}>}`
            );
          }
        } else {
          embed.addField(
            "Очередь пуста",
            "/m play {query} - для добавления в очередь"
          );
        }
        break;
    }
    return embed;
  }

  private initReactionsOnPlayers(player: "audio" | "history") {
    if (this.messagePlayer && player === "audio") {
      this.messagePlayer.reactions.removeAll().catch((_) => {});
      if (this.currentTrack === null && this.guildQuery.length === 0) return;
      this.messagePlayer.react("⏹️").catch((_) => {});
      if (this.isPaused === true) {
        this.messagePlayer.react("▶️").catch((_) => {});
      }
      if (this.isPaused === false) {
        this.messagePlayer.react("⏸️").catch((_) => {});
      }
      this.messagePlayer.react("⏭️").catch((_) => {});
      this.messagePlayer.react("🔀").catch((_) => {});
    }

    if (this.messageHistory && player === "history") {
      this.messageHistory.reactions.removeAll().catch((_) => {});
      this.messageHistory.react("⬅️").catch((_) => {});
      this.messageHistory.react("➡️").catch((_) => {});
    }
  }

  private createReactionListener() {
    this.Client.on("messageReactionAdd", (msgreact, user) => {
      if (user.bot === true && user.id === this.Client.user!.id) return;
      if (this.messagePlayer) {
        if (msgreact.message.id === this.messagePlayer.id) {
          switch (msgreact.emoji.name) {
            case "⏹️":
              this.playNextQuery(user as User, true);
              break;
            case "▶️":
              this.pause(user as User);
              break;
            case "⏸️":
              this.pause(user as User);
              break;
            case "⏭️":
              this.playNextQuery(user as User, false);
              break;
            case "🔀":
              this.shuffle(user as User);
              break;
            default:
              break;
          }
        }
      }
      if (this.messageHistory) {
        if (msgreact.message.id === this.messageHistory.id) {
          switch (msgreact.emoji.name) {
            case "➡️":
              switch (this.messageHistoryQuery) {
                case "current":
                  this.getHistory("next", undefined, user.id);
                  break;
                case "next":
                  this.getHistory("previous", undefined, user.id);
                  break;
                case "previous":
                  this.getHistory("commands", undefined, user.id);
                  break;
                case "commands":
                  this.getHistory("current", undefined, user.id);
                  break;
                default:
                  break;
              }
              break;
            case "⬅️":
              switch (this.messageHistoryQuery) {
                case "current":
                  this.getHistory("commands", undefined, user.id);
                  break;
                case "next":
                  this.getHistory("current", undefined, user.id);
                  break;
                case "previous":
                  this.getHistory("next", undefined, user.id);
                  break;
                case "commands":
                  this.getHistory("previous", undefined, user.id);
                  break;
                default:
                  break;
              }
              break;
            default:
              break;
          }
        }
      }
    });
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

function createAudioResourceYTDLE(url: string) {
  try {
    const stream = ytdlexec(
      url,
      {
        output: "-",
        format:
          "bestaudio[ext=webm+acodec=opus+tbr>100]/bestaudio[ext=webm+acodec=opus]/bestaudio/best",
        limitRate: "1M",
        rmCacheDir: true,
        verbose: true,
      },
      { stdio: ["ignore", "pipe", "ignore"] }
    );

    if (stream.stdout) {
      const audioResource = createAudioResource(stream.stdout);

      return audioResource;
    }

    return null;
  } catch (error) {
    return null;
  }
}
