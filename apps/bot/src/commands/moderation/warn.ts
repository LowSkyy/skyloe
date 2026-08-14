import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { prisma, ModerationCaseType } from "@skyle/db";
import { createCase } from "../../modules/moderation/case-store";
import { logModerationCase } from "../../modules/moderation/logger";
import type { Command } from "../../types";

export const command: Command = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Assegna un avvertimento a un utente")
    .addUserOption((option) => option.setName("utente").setDescription("Utente da avvertire").setRequired(true))
    .addStringOption((option) => option.setName("motivo").setDescription("Motivo dell'avvertimento").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const target = interaction.options.getUser("utente", true);
    const reason = interaction.options.getString("motivo", true);

    const entry = await createCase({
      guildId: interaction.guild.id,
      type: ModerationCaseType.WARN,
      targetId: target.id,
      targetTag: target.username,
      moderatorId: interaction.user.id,
      reason,
    });

    await prisma.warn.create({
      data: {
        guildId: interaction.guild.id,
        userId: target.id,
        moderatorId: interaction.user.id,
        reason,
        caseNumber: entry.caseNumber,
      },
    });

    await logModerationCase(interaction.guild, entry);

    await target
      .send(`Hai ricevuto un avvertimento su **${interaction.guild.name}**: ${reason}`)
      .catch(() => null);

    await interaction.reply(`⚠️ **${target.username}** avvertito. Caso #${entry.caseNumber}.`);
  },
};
