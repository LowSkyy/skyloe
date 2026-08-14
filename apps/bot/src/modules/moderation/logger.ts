import { EmbedBuilder, type Guild } from "discord.js";
import type { ModerationCase } from "@skyle/db";
import { getGuildConfig } from "../../lib/config-cache";

const typeLabel: Record<string, string> = {
  BAN: "🔨 Ban",
  KICK: "👢 Kick",
  TIMEOUT: "⏱️ Timeout",
  WARN: "⚠️ Warn",
  UNBAN: "✅ Unban",
  UNTIMEOUT: "✅ Rimosso timeout",
};

const typeColor: Record<string, number> = {
  BAN: 0xb91c1c,
  KICK: 0xea580c,
  TIMEOUT: 0xca8a04,
  WARN: 0xeab308,
  UNBAN: 0x16a34a,
  UNTIMEOUT: 0x16a34a,
};

export async function logModerationCase(guild: Guild, entry: ModerationCase) {
  const config = await getGuildConfig(guild.id);
  if (!config?.modLogChannelId) return;

  const channel = await guild.channels.fetch(config.modLogChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setTitle(`${typeLabel[entry.type] ?? entry.type} — Caso #${entry.caseNumber}`)
    .setColor(typeColor[entry.type] ?? 0x71717a)
    .addFields(
      { name: "Utente", value: `${entry.targetTag} (\`${entry.targetId}\`)`, inline: true },
      { name: "Moderatore", value: `<@${entry.moderatorId}>`, inline: true },
    )
    .setTimestamp(entry.createdAt);

  if (entry.duration) {
    embed.addFields({ name: "Durata", value: `${entry.duration} minuti`, inline: true });
  }
  embed.addFields({ name: "Motivo", value: entry.reason ?? "Nessun motivo fornito", inline: false });

  await channel.send({ embeds: [embed] }).catch(() => null);
}
