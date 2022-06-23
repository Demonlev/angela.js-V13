import { Guild, Message, User, VoiceBasedChannel } from "discord.js";
import { Player } from "@player/Player";

export type EngineType = "youtube" | "spotify";

export type guildQueryType = {
  guild: Guild;
  channel: VoiceBasedChannel;
  player: Player;
};

export type isContainBotMessageType = {
  isContain: boolean;
  message: Message | null;
};

export type playerExtraFieldType = {
  title: string;
  description: string;
};

export type sendMessagePlayerType = {
  track?: Track;
  added?: boolean;
  error?: playerExtraFieldType;
};
export type queryPlaylistType = {
  tracks: Track[];
  user: User;
  title: string;
}

export type cmdHistoryType = {
  cmd: string;
  user: string;
  time: string;
};

export type historyType = {
  title: string;
  description: string;
};

export type playerHistoryType = "current" | "next" | "previous" | "commands";

export type searchType = "video" | "playlist";

export class Track {
  title?: string;
  url: string;
  duration: number;
  thumbnail?: string;
  engine: EngineType;
  addedBy: User;

  constructor(
    title: string | undefined,
    url: string,
    duration: number,
    thumbnail: string | undefined,
    engine: EngineType,
    addedBy: User
  ) {
    this.title = title;
    this.url = url;
    this.duration = duration;
    this.thumbnail = thumbnail;
    this.engine = engine;
    this.addedBy = addedBy;
  }
}
