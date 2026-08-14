import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getMusicPlayer } from "../../modules/music/player-manager";
import { hasDjPermission } from "../../lib/music-permissions";
import type { Command } from "../../types";

export const command: Command = {
  category: "music",
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Imposta il volume della musica")
    .addIntegerOption((option) =>
      option.setName("livello").setDescription("0-100").setMinValue(0).setMaxValue(100).setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    if (!(await hasDjPermission(interaction.guild.id, interaction.member))) {
      await interaction.reply({ content: "Serve il ruolo DJ per controllare la musica.", ephemeral: true });
      return;
    }

    const level = interaction.options.getInteger("livello", true);
    const player = getMusicPlayer(interaction.guild.id);
    player.setVolume(level);
    await interaction.reply(`🔊 Volume impostato a ${level}%.`);
  },
};
