import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getMusicPlayer } from "../../modules/music/player-manager";
import type { Command } from "../../types";

export const command: Command = {
  category: "music",
  data: new SlashCommandBuilder().setName("nowplaying").setDescription("Mostra la traccia in riproduzione"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const player = getMusicPlayer(interaction.guild.id);
    if (!player.current) {
      await interaction.reply({ content: "Non sto riproducendo nulla al momento.", ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🎵 In riproduzione")
      .setDescription(`[${player.current.title}](${player.current.url})`)
      .addFields(
        { name: "Richiesto da", value: `<@${player.current.requestedBy}>`, inline: true },
        { name: "Durata", value: player.current.durationText, inline: true },
      )
      .setColor(0x5865f2);

    if (player.current.thumbnail) embed.setThumbnail(player.current.thumbnail);

    await interaction.reply({ embeds: [embed] });
  },
};
