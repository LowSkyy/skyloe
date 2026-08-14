import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@skyle/db";
import type { Command } from "../../types";

export const command: Command = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Mostra gli avvertimenti di un utente")
    .addUserOption((option) => option.setName("utente").setDescription("Utente da controllare").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const target = interaction.options.getUser("utente", true);

    const warns = await prisma.warn.findMany({
      where: { guildId: interaction.guild.id, userId: target.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (warns.length === 0) {
      await interaction.reply({ content: `**${target.username}** non ha avvertimenti.`, ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`Avvertimenti di ${target.username}`)
      .setColor(0xeab308)
      .setDescription(
        warns
          .map((w) => `**Caso #${w.caseNumber}** — <t:${Math.floor(w.createdAt.getTime() / 1000)}:R> — ${w.reason ?? "Nessun motivo"}`)
          .join("\n"),
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
