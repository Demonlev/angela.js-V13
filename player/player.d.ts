import { AudioResource } from "@discordjs/voice";
import { Guild, User } from "discord.js";
import { Player } from '@player/Player';

export type EngineType = "youtube" | "spotify";

export type guildQueryType = {
  guild: Guild;
  channel: VoiceBasedChannel;
  player: Player;
};

export type isContainMessagePlayerType = {
  isContain: boolean;
  message: Message | null;
};
