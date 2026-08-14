import type { Message } from "discord.js";
import { AutomodAction, ModerationCaseType } from "@skyle/db";
import { getAutomodRule } from "../../lib/config-cache";
import { createCase } from "../moderation/case-store";
import { logModerationCase } from "../moderation/logger";

const INVITE_REGEX = /(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9-]+)/gi;

interface RuleLike {
  bannedWords: string[];
  blockInvites: boolean;
  allowedInviteCodes: string[];
  maxMentions: number;
  maxCapsPercent: number;
  minLengthForCaps: number;
}

function findViolation(content: string, rule: RuleLike): string | null {
  const lower = content.toLowerCase();

  for (const word of rule.bannedWords) {
    if (word && lower.includes(word.toLowerCase())) return `parola vietata ("${word}")`;
  }

  if (rule.blockInvites) {
    for (const match of content.matchAll(INVITE_REGEX)) {
      const code = match[1];
      if (!rule.allowedInviteCodes.includes(code)) return "invito Discord non autorizzato";
    }
  }

  const mentionCount = (content.match(/<@!?\d+>/g) ?? []).length;
  if (mentionCount > rule.maxMentions) return `troppe menzioni (${mentionCount})`;

  const letters = content.replace(/[^a-zA-Z]/g, "");
  if (letters.length >= rule.minLengthForCaps) {
    const upper = letters.replace(/[^A-Z]/g, "");
    const capsPercent = Math.round((upper.length / letters.length) * 100);
    if (capsPercent > rule.maxCapsPercent) return `troppe maiuscole (${capsPercent}%)`;
  }

  return null;
}

/** Restituisce true se il messaggio è stato rimosso dall'automod (usato da messageCreate per non assegnare XP). */
export async function runAutomod(message: Message): Promise<boolean> {
  if (!message.inGuild() || message.author.bot) return false;

  const rule = await getAutomodRule(message.guildId);
  if (!rule?.enabled) return false;

  const member = message.member;
  if (member && rule.exemptRoleIds.some((id) => member.roles.cache.has(id))) return false;
  if (rule.exemptChannelIds.includes(message.channelId)) return false;

  const violation = findViolation(message.content, rule);
  if (!violation) return false;

  await message.delete().catch(() => null);
  if (rule.action === AutomodAction.DELETE) return true;

  const entry = await createCase({
    guildId: message.guildId,
    type: rule.action === AutomodAction.TIMEOUT ? ModerationCaseType.TIMEOUT : ModerationCaseType.WARN,
    targetId: message.author.id,
    targetTag: message.author.username,
    moderatorId: message.client.user.id,
    reason: `Automod: ${violation}`,
    duration: rule.action === AutomodAction.TIMEOUT ? rule.timeoutMinutes : undefined,
  });

  if (rule.action === AutomodAction.TIMEOUT && member?.moderatable) {
    await member.timeout(rule.timeoutMinutes * 60_000, `Automod: ${violation}`).catch(() => null);
  }

  await logModerationCase(message.guild, entry);
  return true;
}
