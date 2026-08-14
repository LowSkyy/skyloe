import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@skyle/db";
import { computeLevel } from "../../modules/leveling";
import type { Command } from "../../types";

const medal = ["🥇", "🥈", "🥉"];

export const command: Command = {
  category: "community",
  data: new SlashCommandBuilder().setName("leaderboard").setDescription("Mostra la classifica dei livelli del server"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const top = await prisma.userLevel.findMany({
      where: { guildId: interaction.guild.id },
      orderBy: { xp: "desc" },
      take: 10,
    });

    if (top.length === 0) {
      await interaction.reply({ content: "Nessuno ha ancora guadagnato esperienza qui.", ephemeral: true });
      return;
    }

    const lines = top.map((entry, index) => {
      const { level } = computeLevel(entry.xp);
      const prefix = medal[index] ?? `${index + 1}.`;
      return `${prefix} <@${entry.userId}> — livello ${level} (${entry.xp} XP)`;
    });

    const embed = new EmbedBuilder()
      .setTitle(`Classifica di ${interaction.guild.name}`)
      .setColor(0x22d3ee)
      .setDescription(lines.join("\n"));

    await interaction.reply({ embeds: [embed] });
  },
};
