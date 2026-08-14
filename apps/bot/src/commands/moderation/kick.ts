import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { ModerationCaseType } from "@skyle/db";
import { createCase } from "../../modules/moderation/case-store";
import { logModerationCase } from "../../modules/moderation/logger";
import { describeDiscordError } from "../../lib/discord-errors";
import type { Command } from "../../types";

export const command: Command = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Espelle un utente dal server")
    .addUserOption((option) => option.setName("utente").setDescription("Utente da espellere").setRequired(true))
    .addStringOption((option) => option.setName("motivo").setDescription("Motivo dell'espulsione"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const target = interaction.options.getUser("utente", true);
    const reason = interaction.options.getString("motivo") ?? undefined;

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.reply({ content: "Questo utente non è nel server.", ephemeral: true });
      return;
    }
    if (!member.kickable) {
      await interaction.reply({
        content:
          "Non posso espellere questo utente: è il proprietario del server, o ha un ruolo pari/superiore al ruolo di Skyle. Controlla Impostazioni server → Ruoli.",
        ephemeral: true,
      });
      return;
    }

    try {
      await member.kick(reason);
    } catch (error) {
      await interaction.reply({ content: describeDiscordError(error), ephemeral: true });
      return;
    }

    const entry = await createCase({
      guildId: interaction.guild.id,
      type: ModerationCaseType.KICK,
      targetId: target.id,
      targetTag: target.username,
      moderatorId: interaction.user.id,
      reason,
    });
    await logModerationCase(interaction.guild, entry);

    await interaction.reply(`👢 **${target.username}** è stato espulso. Caso #${entry.caseNumber}.`);
  },
};
