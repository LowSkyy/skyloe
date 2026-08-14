import { prisma } from "@skyle/db";
import type { SkyleClient } from "../types";
import { rescheduleActiveGiveaways } from "../modules/giveaways";

export function registerReady(client: SkyleClient) {
  client.once("clientReady", async (readyClient) => {
    console.log(`✅ Skyle è online come ${readyClient.user.tag}`);
    readyClient.user.setActivity("/help");

    for (const guild of readyClient.guilds.cache.values()) {
      await prisma.botGuild
        .upsert({
          where: { guildId: guild.id },
          create: { guildId: guild.id, name: guild.name, icon: guild.iconURL(), ownerId: guild.ownerId },
          update: { name: guild.name, icon: guild.iconURL(), ownerId: guild.ownerId, removedAt: null },
        })
        .catch((error) => console.error(`Sync BotGuild fallita per ${guild.id}:`, error));
    }

    await rescheduleActiveGiveaways(readyClient).catch((error) => console.error("Errore ripianificazione giveaway:", error));
  });
}
