import { prisma, ModerationCaseType } from "@skyle/db";
import { ensureGuildConfig } from "../../lib/config-cache";

interface CreateCaseInput {
  guildId: string;
  type: ModerationCaseType;
  targetId: string;
  targetTag: string;
  moderatorId: string;
  reason?: string;
  duration?: number;
}

export async function createCase(input: CreateCaseInput) {
  await ensureGuildConfig(input.guildId);

  const last = await prisma.moderationCase.findFirst({
    where: { guildId: input.guildId },
    orderBy: { caseNumber: "desc" },
  });
  const caseNumber = (last?.caseNumber ?? 0) + 1;

  return prisma.moderationCase.create({
    data: {
      guildId: input.guildId,
      type: input.type,
      targetId: input.targetId,
      targetTag: input.targetTag,
      moderatorId: input.moderatorId,
      reason: input.reason ?? null,
      duration: input.duration ?? null,
      caseNumber,
    },
  });
}
