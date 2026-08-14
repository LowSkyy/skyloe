import "dotenv/config";
import ffmpegPath from "ffmpeg-static";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import type { SkyleClient } from "./types";

if (ffmpegPath) process.env.FFMPEG_PATH = ffmpegPath;
import { commands } from "./commands";
import { registerReady } from "./events/ready";
import { registerInteractionCreate } from "./events/interactionCreate";
import { registerMessageCreate } from "./events/messageCreate";
import { registerGuildMemberAdd } from "./events/guildMemberAdd";
import { registerGuildMemberRemove } from "./events/guildMemberRemove";
import { registerGuildCreate } from "./events/guildCreate";
import { registerGuildDelete } from "./events/guildDelete";
import { registerMessageReactionAdd } from "./events/messageReactionAdd";
import { registerMessageReactionRemove } from "./events/messageReactionRemove";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.GuildMember, Partials.Message, Partials.Reaction, Partials.User],
}) as SkyleClient;

client.commands = new Collection();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

registerReady(client);
registerInteractionCreate(client);
registerMessageCreate(client);
registerGuildMemberAdd(client);
registerGuildMemberRemove(client);
registerGuildCreate(client);
registerGuildDelete(client);
registerMessageReactionAdd(client);
registerMessageReactionRemove(client);

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error("DISCORD_TOKEN mancante: copia apps/bot/.env.example in apps/bot/.env e compilalo.");
}

client.login(token);
