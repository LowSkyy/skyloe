import { prisma } from "@skyle/db";
import type { SkyleClient } from "../types";

export function registerGuildCreate(client: SkyleClient) {
  client.on("guildCreate", async (guild) => {
    await prisma.botGuild
      .upsert({
        where: { guildId: guild.id },
        create: { guildId: guild.id, name: guild.name, icon: guild.iconURL(), ownerId: guild.ownerId },
        update: { name: guild.name, icon: guild.iconURL(), ownerId: guild.ownerId, removedAt: null },
      })
      .catch((error) => console.error(`Sync BotGuild fallita per ${guild.id}:`, error));
  });
}
