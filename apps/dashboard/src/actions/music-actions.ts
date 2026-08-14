"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@skyle/db";
import { requireGuildAccess } from "@/lib/require-guild-access";

function idOrNull(value: FormDataEntryValue | null): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

export async function updateMusicSettings(guildId: string, formData: FormData) {
  await requireGuildAccess(guildId);

  const data = {
    djRoleIds: formData.getAll("djRoleIds").map(String),
    defaultVolume: Number(formData.get("defaultVolume") ?? 80),
    stay247: formData.get("stay247") === "on",
    stay247ChannelId: idOrNull(formData.get("stay247ChannelId")),
    maxQueueSize: Number(formData.get("maxQueueSize") ?? 200),
  };

  await prisma.guildConfig.upsert({ where: { guildId }, create: { guildId }, update: {} });
  await prisma.musicSettings.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });

  revalidatePath(`/dashboard/${guildId}/music`);
}
