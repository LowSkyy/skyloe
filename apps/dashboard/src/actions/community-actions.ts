"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@skyle/db";
import { requireGuildAccess } from "@/lib/require-guild-access";

function channelIdOrNull(value: FormDataEntryValue | null): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

export async function updateLevelSettings(guildId: string, formData: FormData) {
  await requireGuildAccess(guildId);

  const data = {
    enabled: formData.get("enabled") === "on",
    xpPerMessage: Number(formData.get("xpPerMessage") ?? 15),
    xpCooldownSeconds: Number(formData.get("xpCooldownSeconds") ?? 60),
    levelUpChannelId: channelIdOrNull(formData.get("levelUpChannelId")),
    announceLevelUp: formData.get("announceLevelUp") === "on",
  };

  await prisma.guildConfig.upsert({ where: { guildId }, create: { guildId }, update: {} });
  await prisma.levelConfig.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });

  revalidatePath(`/dashboard/${guildId}/community`);
}

export async function updateWelcomeSettings(guildId: string, formData: FormData) {
  await requireGuildAccess(guildId);

  const data = {
    enabled: formData.get("enabled") === "on",
    channelId: channelIdOrNull(formData.get("channelId")),
    messageTemplate: String(formData.get("messageTemplate") ?? "").trim() || "Benvenuto/a {user} su {server}! 🎉",
    dmEnabled: formData.get("dmEnabled") === "on",
    dmTemplate: String(formData.get("dmTemplate") ?? "").trim() || null,
    leaveEnabled: formData.get("leaveEnabled") === "on",
    leaveChannelId: channelIdOrNull(formData.get("leaveChannelId")),
    leaveTemplate: String(formData.get("leaveTemplate") ?? "").trim() || "{user} ha lasciato il server.",
  };

  await prisma.guildConfig.upsert({ where: { guildId }, create: { guildId }, update: {} });
  await prisma.welcomeConfig.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });

  revalidatePath(`/dashboard/${guildId}/community`);
}
