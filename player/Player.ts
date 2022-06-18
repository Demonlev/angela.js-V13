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
import { EngineType, isContainMessagePlayerType } from "@player/player";
import ytdl from "ytdl-core";
import ytsr from "youtube-sr";
import { isValidHttpUrl } from "@utils/utils";

export class Player {
  public channelVoice!: VoiceBasedChannel;
  public channelText!: TextBasedChannel | null;
  public currentTrack: Track | null = null;
  public guildPrevQuery: Track[] = [];
  public guildQuery: Track[] = [];
  private audioPlayer!: AudioPlayer;
  private connection!: VoiceConnection;
  public messagePlayer: Message | null = null;
  private subscription: PlayerSubscription | undefined;
  public Client!: Client;
  public isPaused: boolean = true;
  public queryDuration: number = 0;

  constructor(inter: CommandInteraction, query: string, engine: EngineType) {
    this.initiatePlayer(inter, query, engine);
  }

  public addTrack(track: Track) {
    if (this.guildQuery.length === 0 && this.currentTrack === null) {
      this.playTrack(track);
      this.sendMessagePlayer(track);
    } else if (this.currentTrack !== null) {
      this.guildQuery.push(track);
      this.queryDuration = this.queryDuration + track.duration;
      this.sendMessagePlayer(track, true);
    }
  }

  public shuffle() {
    this.guildQuery = this.guildQuery.sort(() => Math.random() - 0.5);
  }

  public joinVoice(inter: CommandInteraction, query: string, engine: EngineType) {
    this.initiatePlayer(inter, query, engine);
  }

  public async search(query: string, engine: EngineType, inter: CommandInteraction) {
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
          if (searchResult[0].type === "video") {
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

  private playTrack(track: Track) {
    this.audioPlayer.play(track.resource);
    this.currentTrack = track;
  }

  private playNextQuery() {
    const currentTrack = this.currentTrack;
    if (currentTrack) {
      this.queryDuration = this.queryDuration - currentTrack.duration;
    }
    this.currentTrack = null;
    if (this.guildQuery.length !== 0) {
      const nextTrack = this.guildQuery[0];
      if (currentTrack) {
        this.guildPrevQuery.push(currentTrack);
        this.guildPrevQuery = this.guildPrevQuery.slice(0, 5);
      }
      this.guildQuery = this.guildQuery.slice(1);
      this.playTrack(nextTrack);
    }
    this.sendMessagePlayer();
  }

  private async sendMessagePlayer(track?: Track, added?: boolean) {
    const playableTrack = track || this.currentTrack;
    let isEditMessagePlayer = false;
    if (this.channelText) {
      const messages = await this.channelText.messages.fetch({ limit: 5 });
      const { isContain, message } = this.isContainMessagePlayer(messages.reverse(), this.Client);
      isEditMessagePlayer = isContain;
      if (isContain) {
        this.messagePlayer = message;
      }
    }

    const embed = this.createEmbedPlayer();
    if (added && playableTrack) {
      const title = playableTrack.title || playableTrack.url;
      const author = playableTrack.addedBy;
      embed.addField(
        `Добавлено - ${title} - ${getDurationFancy(playableTrack.duration)}`,
        `${author.username + author.discriminator} поставил в очередь трек`
      );
    }
    if (this.messagePlayer && isEditMessagePlayer) {
      this.messagePlayer.edit({ content: null, embeds: [embed] });
    } else if (this.channelText) {
      try {
        const messages = await this.channelText.messages.fetch({ limit: 25 });
        await this.deleteOtherMessagePlayers(messages, this.Client);
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
      embed.setTitle("Команды или используйте реакции");
      embed.setAuthor({ name: "Плеер - пусто" });
      embed.addField("/m play {query}", "Ссылка или запрос", false);
      embed.addField("/m query", "Очередь из 7 треков", true);
      embed.addField("/m query-prev", "5 прослушанных треков", true);
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

  private isContainMessagePlayer(messages: Collection<string, Message<boolean>>, Client: Client): isContainMessagePlayerType {
    let isContain = false;
    let message: Message | null = null;
    messages.each((m) => {
      try {
        if (m.embeds[0].footer && m.client.user && Client.user) {
          const footer = m.embeds[0].footer.text === "Audio Player";
          const isBot = m.client.user.bot;
          const isAngela = m.author.username + m.author.discriminator === Client.user.username + Client.user.discriminator;
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

  private deleteOtherMessagePlayers(messages: Collection<string, Message<boolean>>, Client: Client) {
    messages.each((m) => {
      try {
        if (m.embeds[0].footer && m.client.user && Client.user) {
          const footer = m.embeds[0].footer.text === "Audio Player";
          const isBot = m.client.user.bot;
          const isAngela = m.author.username + m.author.discriminator === Client.user.username + Client.user.discriminator;
          if (footer && isBot && isAngela) {
            m.delete();
          }
        }
      } catch (error) {}
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
