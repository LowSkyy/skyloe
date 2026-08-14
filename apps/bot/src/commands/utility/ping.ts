import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../types";

export const command: Command = {
  category: "utility",
  data: new SlashCommandBuilder().setName("ping").setDescription("Controlla la latenza del bot"),

  async execute(interaction: ChatInputCommandInteraction) {
    const start = Date.now();
    await interaction.reply("Calcolo...");
    const roundTrip = Date.now() - start;

    await interaction.editReply(
      `🏓 Pong! Latenza round-trip: ${roundTrip}ms — Latenza WebSocket: ${interaction.client.ws.ping}ms`,
    );
  },
};
