import { EmbedBuilder, type Message } from "discord.js";
import { prisma } from "@skyle/db";
import { getLevelConfig } from "../../lib/config-cache";

const COOLDOWN_BUFFER_MS = 2_000;

export function xpNeededForLevel(level: number): number {
  return 5 * level * level + 50 * level + 100;
}

export function computeLevel(totalXp: number): { level: number; xpIntoLevel: number; xpForNext: number } {
  let level = 0;
  let remaining = totalXp;
  let needed = xpNeededForLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = xpNeededForLevel(level);
  }
  return { level, xpIntoLevel: remaining, xpForNext: needed };
}

export async function runLeveling(message: Message) {
  if (!message.inGuild() || message.author.bot) return;

  const config = await getLevelConfig(message.guildId);
  if (!config?.enabled) return;

  const existing = await prisma.userLevel.findUnique({
    where: { guildId_userId: { guildId: message.guildId, userId: message.author.id } },
  });

  if (existing) {
    const elapsedMs = Date.now() - existing.updatedAt.getTime();
    if (elapsedMs < config.xpCooldownSeconds * 1000 - COOLDOWN_BUFFER_MS) return;
  }

  const previousXp = existing?.xp ?? 0;
  const newXp = previousXp + config.xpPerMessage;
  const before = computeLevel(previousXp);
  const after = computeLevel(newXp);

  await prisma.userLevel.upsert({
    where: { guildId_userId: { guildId: message.guildId, userId: message.author.id } },
    create: { guildId: message.guildId, userId: message.author.id, xp: newXp, level: after.level },
    update: { xp: newXp, level: after.level },
  });

  if (after.level <= before.level || !config.announceLevelUp) return;

  const embed = new EmbedBuilder()
    .setDescription(`🎉 ${message.author} è salito al livello **${after.level}**!`)
    .setColor(0x22d3ee);

  if (config.levelUpChannelId) {
    const channel = await message.guild.channels.fetch(config.levelUpChannelId).catch(() => null);
    if (channel?.isTextBased()) await channel.send({ embeds: [embed] }).catch(() => null);
    return;
  }

  if (message.channel.isSendable()) await message.channel.send({ embeds: [embed] }).catch(() => null);
}
