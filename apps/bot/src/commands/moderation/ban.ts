import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { ModerationCaseType } from "@skyle/db";
import { createCase } from "../../modules/moderation/case-store";
import { logModerationCase } from "../../modules/moderation/logger";
import { describeDiscordError } from "../../lib/discord-errors";
import type { Command } from "../../types";

export const command: Command = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banna un utente dal server")
    .addUserOption((option) => option.setName("utente").setDescription("Utente da bannare").setRequired(true))
    .addStringOption((option) => option.setName("motivo").setDescription("Motivo del ban"))
    .addIntegerOption((option) =>
      option
        .setName("elimina_messaggi_giorni")
        .setDescription("Giorni di messaggi recenti da eliminare (0-7)")
        .setMinValue(0)
        .setMaxValue(7),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const target = interaction.options.getUser("utente", true);
    const reason = interaction.options.getString("motivo") ?? undefined;
    const deleteDays = interaction.options.getInteger("elimina_messaggi_giorni") ?? 0;

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (member && !member.bannable) {
      await interaction.reply({
        content:
          "Non posso bannare questo utente: è il proprietario del server, o ha un ruolo pari/superiore al ruolo di Skyle. Controlla Impostazioni server → Ruoli.",
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.guild.members.ban(target.id, {
        reason,
        deleteMessageSeconds: deleteDays * 86_400,
      });
    } catch (error) {
      await interaction.reply({ content: describeDiscordError(error), ephemeral: true });
      return;
    }

    const entry = await createCase({
      guildId: interaction.guild.id,
      type: ModerationCaseType.BAN,
      targetId: target.id,
      targetTag: target.username,
      moderatorId: interaction.user.id,
      reason,
    });
    await logModerationCase(interaction.guild, entry);

    await interaction.reply(`🔨 **${target.username}** è stato bannato. Caso #${entry.caseNumber}.`);
  },
};
