import {
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { prisma } from "@skyle/db";
import { ensureGuildConfig } from "../../lib/config-cache";
import { endGiveaway, scheduleGiveawayEnd } from "../../modules/giveaways";
import type { Command } from "../../types";

export const command: Command = {
  category: "community",
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Gestisce i giveaway")
    .addSubcommand((sub) =>
      sub
        .setName("start")
        .setDescription("Avvia un nuovo giveaway")
        .addStringOption((o) => o.setName("premio").setDescription("Cosa si vince").setRequired(true))
        .addIntegerOption((o) =>
          o.setName("durata_minuti").setDescription("Durata in minuti").setMinValue(1).setRequired(true),
        )
        .addIntegerOption((o) => o.setName("vincitori").setDescription("Numero di vincitori (default 1)").setMinValue(1).setMaxValue(20))
        .addChannelOption((o) => o.setName("canale").setDescription("Canale dove pubblicarlo (default: questo canale)")),
    )
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("Termina subito un giveaway ed estrae i vincitori")
        .addStringOption((o) => o.setName("messaggio_id").setDescription("ID del messaggio del giveaway").setRequired(true)),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "start") {
      const prize = interaction.options.getString("premio", true);
      const minutes = interaction.options.getInteger("durata_minuti", true);
      const winnerCount = interaction.options.getInteger("vincitori") ?? 1;
      const channelOption = interaction.options.getChannel("canale");

      const channel = channelOption
        ? await interaction.guild.channels.fetch(channelOption.id).catch(() => null)
        : interaction.channel;

      if (!channel || !channel.isTextBased()) {
        await interaction.reply({ content: "Canale non valido.", ephemeral: true });
        return;
      }

      const endsAt = new Date(Date.now() + minutes * 60_000);

      const embed = new EmbedBuilder()
        .setTitle("🎉 Giveaway!")
        .setDescription(
          `Premio: **${prize}**\nReagisci con 🎉 per partecipare!\nTermina: <t:${Math.floor(endsAt.getTime() / 1000)}:R>`,
        )
        .setFooter({ text: `Vincitori: ${winnerCount} — organizzato da ${interaction.user.username}` })
        .setColor(0xfacc15);

      const message = await channel.send({ embeds: [embed] });
      await message.react("🎉");

      await ensureGuildConfig(interaction.guild.id);
      const giveaway = await prisma.giveaway.create({
        data: {
          guildId: interaction.guild.id,
          channelId: channel.id,
          messageId: message.id,
          prize,
          winnerCount,
          hostId: interaction.user.id,
          endsAt,
        },
      });

      scheduleGiveawayEnd(interaction.client, giveaway.id, endsAt);

      await interaction.reply({ content: "✅ Giveaway avviato!", ephemeral: true });
      return;
    }

    const messageId = interaction.options.getString("messaggio_id", true);
    const giveaway = await prisma.giveaway.findFirst({ where: { guildId: interaction.guild.id, messageId } });
    if (!giveaway) {
      await interaction.reply({ content: "Nessun giveaway trovato con questo ID messaggio.", ephemeral: true });
      return;
    }

    await interaction.reply({ content: "⏳ Concludo il giveaway...", ephemeral: true });
    await endGiveaway(interaction.client, giveaway.id);
  },
};
