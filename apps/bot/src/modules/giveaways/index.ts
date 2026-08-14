import { EmbedBuilder, type Client } from "discord.js";
import { prisma } from "@skyle/db";

const scheduled = new Set<string>();

export function scheduleGiveawayEnd(client: Client, giveawayId: string, endsAt: Date) {
  if (scheduled.has(giveawayId)) return;
  scheduled.add(giveawayId);

  const delay = Math.max(0, endsAt.getTime() - Date.now());
  setTimeout(() => {
    scheduled.delete(giveawayId);
    endGiveaway(client, giveawayId).catch((error) => console.error("Errore alla fine del giveaway:", error));
  }, delay);
}

export async function endGiveaway(client: Client, giveawayId: string) {
  const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
  if (!giveaway || giveaway.ended || !giveaway.messageId) return;

  await prisma.giveaway.update({ where: { id: giveawayId }, data: { ended: true } });

  const guild = await client.guilds.fetch(giveaway.guildId).catch(() => null);
  if (!guild) return;
  const channel = await guild.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
  if (!message) return;

  const reaction = message.reactions.cache.get("🎉");
  const users = reaction ? await reaction.users.fetch().catch(() => null) : null;
  const entrants = users ? [...users.values()].filter((u) => !u.bot) : [];

  if (entrants.length === 0) {
    await message.reply("😔 Nessuno ha partecipato a questo giveaway: nessun vincitore.").catch(() => null);
    return;
  }

  const pool = [...entrants];
  const winnerCount = Math.min(giveaway.winnerCount, pool.length);
  const winners: typeof entrants = [];
  for (let i = 0; i < winnerCount; i++) {
    const index = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(index, 1)[0]);
  }

  const embed = new EmbedBuilder()
    .setTitle("🎉 Giveaway concluso!")
    .setDescription(`Premio: **${giveaway.prize}**\nVincitori: ${winners.map((w) => `<@${w.id}>`).join(", ")}`)
    .setColor(0xfacc15);

  await message.reply({ embeds: [embed] }).catch(() => null);
}

/** Da chiamare all'avvio del bot: ripianifica i giveaway ancora attivi (o li chiude se il tempo è già scaduto). */
export async function rescheduleActiveGiveaways(client: Client) {
  const active = await prisma.giveaway.findMany({ where: { ended: false } });
  for (const giveaway of active) {
    if (giveaway.endsAt.getTime() <= Date.now()) {
      await endGiveaway(client, giveaway.id);
    } else {
      scheduleGiveawayEnd(client, giveaway.id, giveaway.endsAt);
    }
  }
}
