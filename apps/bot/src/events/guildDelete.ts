import { prisma } from "@skyle/db";
import type { SkyleClient } from "../types";

export function registerGuildDelete(client: SkyleClient) {
  client.on("guildDelete", async (guild) => {
    await prisma.botGuild
      .update({ where: { guildId: guild.id }, data: { removedAt: new Date() } })
      .catch((error) => console.error(`Sync BotGuild fallita per ${guild.id}:`, error));
  });
}
