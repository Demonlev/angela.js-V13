import { AudioResource } from "@discordjs/voice";
import { Guild, User } from "discord.js";
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

export type sendMessagePlayerType = {
  track?: Track;
  added?: boolean;
  extraField?: {
    title: string;
    description: string;
  };
};

export type cmdHistoryType = {
  cmd: string;
  user: string;
  time: string;
};

export type historyType = {
  title: string;
  description: string;
};

export type playerHistoryType = "current" | "previous" | "commands";
