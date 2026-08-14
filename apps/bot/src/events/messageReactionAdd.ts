import { prisma } from "@skyle/db";
import type { SkyleClient } from "../types";

export function registerMessageReactionAdd(client: SkyleClient) {
  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;

    try {
      if (reaction.partial) await reaction.fetch();
    } catch {
      return;
    }

    const guild = reaction.message.guild;
    if (!guild) return;

    const emojiKey = reaction.emoji.id ?? reaction.emoji.name;
    if (!emojiKey) return;

    const config = await prisma.reactionRoleConfig
      .findUnique({ where: { messageId_emoji: { messageId: reaction.message.id, emoji: emojiKey } } })
      .catch(() => null);
    if (!config) return;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    await member.roles.add(config.roleId).catch(() => null);
  });
}
