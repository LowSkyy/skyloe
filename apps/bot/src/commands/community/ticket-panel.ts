import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { prisma } from "@skyle/db";
import { ensureGuildConfig } from "../../lib/config-cache";
import type { Command } from "../../types";

export const command: Command = {
  category: "community",
  data: new SlashCommandBuilder()
    .setName("ticket-panel")
    .setDescription("Pubblica il pannello per aprire i ticket di supporto in questo canale")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild() || !interaction.channel?.isSendable()) return;

    const embed = new EmbedBuilder()
      .setTitle("🎫 Supporto")
      .setDescription("Clicca il bottone qui sotto per aprire un ticket privato con lo staff.")
      .setColor(0x5865f2);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("ticket:open").setLabel("Apri ticket").setEmoji("🎫").setStyle(ButtonStyle.Primary),
    );

    const message = await interaction.channel.send({ embeds: [embed], components: [row] });

    await ensureGuildConfig(interaction.guild.id);
    await prisma.ticketConfig.upsert({
      where: { guildId: interaction.guild.id },
      create: {
        guildId: interaction.guild.id,
        enabled: true,
        panelChannelId: interaction.channel.id,
        panelMessageId: message.id,
      },
      update: { enabled: true, panelChannelId: interaction.channel.id, panelMessageId: message.id },
    });

    await interaction.reply({ content: "✅ Pannello ticket pubblicato.", ephemeral: true });
  },
};
