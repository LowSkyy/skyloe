import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getMusicPlayer } from "../../modules/music/player-manager";
import { hasDjPermission } from "../../lib/music-permissions";
import type { Command } from "../../types";

export const command: Command = {
  category: "music",
  data: new SlashCommandBuilder().setName("resume").setDescription("Riprende la riproduzione in pausa"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    if (!(await hasDjPermission(interaction.guild.id, interaction.member))) {
      await interaction.reply({ content: "Serve il ruolo DJ per controllare la musica.", ephemeral: true });
      return;
    }

    const player = getMusicPlayer(interaction.guild.id);
    player.resumePlayback();
    await interaction.reply("▶️ Riproduzione ripresa.");
  },
};
