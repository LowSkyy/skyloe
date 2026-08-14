import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  type ButtonInteraction,
} from "discord.js";
import { prisma, TicketStatus } from "@skyle/db";
import { getTicketConfig } from "../../lib/config-cache";

export async function openTicket(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) return;

  const config = await getTicketConfig(interaction.guild.id);
  if (!config?.enabled) {
    await interaction.reply({ content: "Il sistema ticket non è attivo su questo server.", ephemeral: true });
    return;
  }

  const existing = await prisma.ticket.findFirst({
    where: { guildId: interaction.guild.id, openerId: interaction.user.id, status: { not: TicketStatus.CLOSED } },
  });
  if (existing) {
    await interaction.reply({ content: `Hai già un ticket aperto: <#${existing.channelId}>.`, ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`.slice(0, 90),
    type: ChannelType.GuildText,
    parent: config.categoryId ?? undefined,
    permissionOverwrites: [
      { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: interaction.client.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
      },
      ...config.supportRoleIds.map((roleId) => ({
        id: roleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      })),
    ],
  });

  await prisma.ticket.create({
    data: { guildId: interaction.guild.id, channelId: channel.id, openerId: interaction.user.id },
  });

  const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("ticket:close").setLabel("Chiudi ticket").setEmoji("🔒").setStyle(ButtonStyle.Danger),
  );

  const embed = new EmbedBuilder()
    .setTitle(`Ticket di ${interaction.user.username}`)
    .setDescription("Descrivi il tuo problema, lo staff ti risponderà appena possibile.")
    .setColor(0x5865f2);

  const mentions = config.supportRoleIds.map((id) => `<@&${id}>`).join(" ");
  await channel.send({ content: `${interaction.user}${mentions ? ` ${mentions}` : ""}`, embeds: [embed], components: [closeRow] });

  await interaction.editReply(`✅ Ticket creato: <#${channel.id}>`);
}

export async function closeTicket(interaction: ButtonInteraction) {
  if (!interaction.inCachedGuild()) return;

  const ticket = await prisma.ticket.findFirst({
    where: { channelId: interaction.channelId, status: { not: TicketStatus.CLOSED } },
  });
  if (!ticket) {
    await interaction.reply({ content: "Questo non è un canale ticket aperto.", ephemeral: true });
    return;
  }

  await interaction.reply(`🔒 Ticket chiuso da ${interaction.user}. Il canale verrà eliminato tra 5 secondi.`);

  await prisma.ticket.update({ where: { id: ticket.id }, data: { status: TicketStatus.CLOSED, closedAt: new Date() } });

  const config = await getTicketConfig(interaction.guild.id);
  if (config?.transcriptChannelId) {
    const logChannel = await interaction.guild.channels.fetch(config.transcriptChannelId).catch(() => null);
    const channelName = interaction.guild.channels.cache.get(interaction.channelId)?.name ?? interaction.channelId;
    if (logChannel?.isTextBased()) {
      const embed = new EmbedBuilder()
        .setTitle("Ticket chiuso")
        .addFields(
          { name: "Aperto da", value: `<@${ticket.openerId}>`, inline: true },
          { name: "Chiuso da", value: `${interaction.user}`, inline: true },
          { name: "Canale", value: `#${channelName}`, inline: true },
        )
        .setColor(0x71717a)
        .setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => null);
    }
  }

  const guildChannel = interaction.guild.channels.cache.get(interaction.channelId);
  setTimeout(() => {
    guildChannel?.delete("Ticket chiuso").catch(() => null);
  }, 5_000);
}
