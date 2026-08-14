import type { ChatInputCommandInteraction, Client, Collection } from "discord.js";

export interface Command {
  data: {
    name: string;
    description?: string;
    toJSON(): unknown;
  };
  category: "moderation" | "utility" | "community" | "music";
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export interface SkyleClient extends Client {
  commands: Collection<string, Command>;
}
