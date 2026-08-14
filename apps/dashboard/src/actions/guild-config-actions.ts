"use server";

import { revalidatePath } from "next/cache";
import { prisma, AutomodAction, AntiraidAction } from "@skyle/db";
import { requireGuildAccess } from "@/lib/require-guild-access";

function parseIdList(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[\s,]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function channelIdOrNull(value: FormDataEntryValue | null): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

export async function updateGeneralSettings(guildId: string, formData: FormData) {
  await requireGuildAccess(guildId);

  const locale = String(formData.get("locale") ?? "it");

  await prisma.guildConfig.upsert({
    where: { guildId },
    create: { guildId, locale },
    update: { locale },
  });

  revalidatePath(`/dashboard/${guildId}/general`);
}

export async function updateLoggingSettings(guildId: string, formData: FormData) {
  await requireGuildAccess(guildId);

  const data = {
    modLogChannelId: channelIdOrNull(formData.get("modLogChannelId")),
    automodLogChannelId: channelIdOrNull(formData.get("automodLogChannelId")),
    antiraidLogChannelId: channelIdOrNull(formData.get("antiraidLogChannelId")),
  };

  await prisma.guildConfig.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });

  revalidatePath(`/dashboard/${guildId}/logging`);
}

export async function updateAutomodSettings(guildId: string, formData: FormData) {
  await requireGuildAccess(guildId);

  const data = {
    enabled: formData.get("enabled") === "on",
    bannedWords: parseIdList(formData.get("bannedWords")),
    blockInvites: formData.get("blockInvites") === "on",
    allowedInviteCodes: parseIdList(formData.get("allowedInviteCodes")),
    maxMentions: Number(formData.get("maxMentions") ?? 5),
    maxCapsPercent: Number(formData.get("maxCapsPercent") ?? 70),
    minLengthForCaps: Number(formData.get("minLengthForCaps") ?? 10),
    action: (formData.get("action") as AutomodAction) || AutomodAction.DELETE,
    timeoutMinutes: Number(formData.get("timeoutMinutes") ?? 10),
    exemptRoleIds: formData.getAll("exemptRoleIds").map(String),
    exemptChannelIds: formData.getAll("exemptChannelIds").map(String),
  };

  await prisma.guildConfig.upsert({ where: { guildId }, create: { guildId }, update: {} });
  await prisma.automodRule.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });

  revalidatePath(`/dashboard/${guildId}/automod`);
}

export async function updateAntiraidSettings(guildId: string, formData: FormData) {
  await requireGuildAccess(guildId);

  const data = {
    enabled: formData.get("enabled") === "on",
    joinThreshold: Number(formData.get("joinThreshold") ?? 10),
    joinWindowSeconds: Number(formData.get("joinWindowSeconds") ?? 30),
    minAccountAgeMinutes: Number(formData.get("minAccountAgeMinutes") ?? 30),
    action: (formData.get("action") as AntiraidAction) || AntiraidAction.KICK,
    autoLockdown: formData.get("autoLockdown") === "on",
    lockdownMinutes: Number(formData.get("lockdownMinutes") ?? 15),
  };

  await prisma.guildConfig.upsert({ where: { guildId }, create: { guildId }, update: {} });
  await prisma.antiraidSettings.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });

  revalidatePath(`/dashboard/${guildId}/antiraid`);
}
