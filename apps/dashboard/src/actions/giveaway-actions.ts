"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@skyle/db";
import { requireGuildAccess } from "@/lib/require-guild-access";

function channelIdOrNull(value: FormDataEntryValue | null): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

export async function updateGiveawaySettings(guildId: string, formData: FormData) {
  await requireGuildAccess(guildId);

  const data = { defaultChannelId: channelIdOrNull(formData.get("defaultChannelId")) };

  await prisma.guildConfig.upsert({ where: { guildId }, create: { guildId }, update: {} });
  await prisma.giveawayConfig.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });

  revalidatePath(`/dashboard/${guildId}/giveaways`);
}
