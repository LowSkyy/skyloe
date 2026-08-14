import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getMusicPlayer } from "../../modules/music/player-manager";
import { hasDjPermission } from "../../lib/music-permissions";
import type { Command } from "../../types";

export const command: Command = {
  category: "music",
  data: new SlashCommandBuilder().setName("pause").setDescription("Mette in pausa la riproduzione"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    if (!(await hasDjPermission(interaction.guild.id, interaction.member))) {
      await interaction.reply({ content: "Serve il ruolo DJ per controllare la musica.", ephemeral: true });
      return;
    }

    const player = getMusicPlayer(interaction.guild.id);
    if (!player.current) {
      await interaction.reply({ content: "Non sto riproducendo nulla al momento.", ephemeral: true });
      return;
    }

    player.pause();
    await interaction.reply("⏸️ Riproduzione in pausa.");
  },
};
