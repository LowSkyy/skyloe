import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { ModerationCaseType } from "@skyle/db";
import { createCase } from "../../modules/moderation/case-store";
import { logModerationCase } from "../../modules/moderation/logger";
import { describeDiscordError } from "../../lib/discord-errors";
import type { Command } from "../../types";

const MAX_TIMEOUT_MINUTES = 28 * 24 * 60; // limite di Discord: 28 giorni

export const command: Command = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Silenzia temporaneamente un utente")
    .addUserOption((option) => option.setName("utente").setDescription("Utente da silenziare").setRequired(true))
    .addIntegerOption((option) =>
      option
        .setName("minuti")
        .setDescription("Durata in minuti (max 40320 = 28 giorni)")
        .setMinValue(1)
        .setMaxValue(MAX_TIMEOUT_MINUTES)
        .setRequired(true),
    )
    .addStringOption((option) => option.setName("motivo").setDescription("Motivo del timeout"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const target = interaction.options.getUser("utente", true);
    const minutes = interaction.options.getInteger("minuti", true);
    const reason = interaction.options.getString("motivo") ?? undefined;

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.reply({ content: "Questo utente non è nel server.", ephemeral: true });
      return;
    }
    if (!member.moderatable) {
      await interaction.reply({
        content:
          "Non posso silenziare questo utente: è il proprietario del server, o ha un ruolo pari/superiore al ruolo di Skyle. Controlla Impostazioni server → Ruoli.",
        ephemeral: true,
      });
      return;
    }

    try {
      await member.timeout(minutes * 60_000, reason);
    } catch (error) {
      await interaction.reply({ content: describeDiscordError(error), ephemeral: true });
      return;
    }

    const entry = await createCase({
      guildId: interaction.guild.id,
      type: ModerationCaseType.TIMEOUT,
      targetId: target.id,
      targetTag: target.username,
      moderatorId: interaction.user.id,
      reason,
      duration: minutes,
    });
    await logModerationCase(interaction.guild, entry);

    await interaction.reply(`⏱️ **${target.username}** silenziato per ${minutes} minuti. Caso #${entry.caseNumber}.`);
  },
};
