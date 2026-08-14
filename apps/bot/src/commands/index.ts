import type { Command } from "../types";

import { command as ban } from "./moderation/ban";
import { command as kick } from "./moderation/kick";
import { command as timeout } from "./moderation/timeout";
import { command as warn } from "./moderation/warn";
import { command as warnings } from "./moderation/warnings";
import { command as purge } from "./moderation/purge";

import { command as ping } from "./utility/ping";
import { command as userinfo } from "./utility/userinfo";
import { command as serverinfo } from "./utility/serverinfo";
import { command as avatar } from "./utility/avatar";
import { command as help } from "./utility/help";

import { command as rank } from "./community/rank";
import { command as leaderboard } from "./community/leaderboard";
import { command as reactionrole } from "./community/reactionrole";
import { command as ticketPanel } from "./community/ticket-panel";
import { command as giveaway } from "./community/giveaway";

import { command as play } from "./music/play";
import { command as skip } from "./music/skip";
import { command as stop } from "./music/stop";
import { command as pause } from "./music/pause";
import { command as resume } from "./music/resume";
import { command as queue } from "./music/queue";
import { command as volume } from "./music/volume";
import { command as nowplaying } from "./music/nowplaying";

export const commands: Command[] = [
  ban,
  kick,
  timeout,
  warn,
  warnings,
  purge,
  ping,
  userinfo,
  serverinfo,
  avatar,
  help,
  rank,
  leaderboard,
  reactionrole,
  ticketPanel,
  giveaway,
  play,
  skip,
  stop,
  pause,
  resume,
  queue,
  volume,
  nowplaying,
];
