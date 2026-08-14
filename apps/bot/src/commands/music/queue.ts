import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getMusicPlayer } from "../../modules/music/player-manager";
import type { Command } from "../../types";

export const command: Command = {
  category: "music",
  data: new SlashCommandBuilder().setName("queue").setDescription("Mostra la coda musicale attuale"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const player = getMusicPlayer(interaction.guild.id);
    if (!player.current && player.queue.length === 0) {
      await interaction.reply({ content: "La coda è vuota.", ephemeral: true });
      return;
    }

    const upcoming = player.queue.map((track, index) => `${index + 1}. ${track.title} — richiesto da <@${track.requestedBy}>`);

    const embed = new EmbedBuilder()
      .setTitle("🎶 Coda musicale")
      .setDescription(
        `**In riproduzione:** ${player.current ? player.current.title : "Nessuna"}\n\n${
          upcoming.length ? upcoming.join("\n") : "Nessun altro brano in coda."
        }`,
      )
      .setColor(0x5865f2);

    await interaction.reply({ embeds: [embed] });
  },
};
