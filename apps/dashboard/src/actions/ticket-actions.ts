"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@skyle/db";
import { requireGuildAccess } from "@/lib/require-guild-access";

function idOrNull(value: FormDataEntryValue | null): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

export async function updateTicketSettings(guildId: string, formData: FormData) {
  await requireGuildAccess(guildId);

  const data = {
    enabled: formData.get("enabled") === "on",
    categoryId: idOrNull(formData.get("categoryId")),
    supportRoleIds: formData.getAll("supportRoleIds").map(String),
    transcriptChannelId: idOrNull(formData.get("transcriptChannelId")),
  };

  await prisma.guildConfig.upsert({ where: { guildId }, create: { guildId }, update: {} });
  await prisma.ticketConfig.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });

  revalidatePath(`/dashboard/${guildId}/tickets`);
}
