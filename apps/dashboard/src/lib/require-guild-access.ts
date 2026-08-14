import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchUserManageableGuilds } from "@/lib/discord-api";

/** Guild dell'utente loggato su cui ha Manage Server/Administrator — memoizzato per la durata della request. */
export const getManageableGuildIds = cache(async () => {
  const session = await auth();
  if (!session?.user) return { session: null, guildIds: new Set<string>() };

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "discord" },
    select: { access_token: true },
  });
  if (!account?.access_token) return { session, guildIds: new Set<string>() };

  const guilds = await fetchUserManageableGuilds(account.access_token);
  return { session, guildIds: new Set(guilds.map((g) => g.id)) };
});

/** Verifica che l'utente possa amministrare guildId E che il bot sia presente lì; altrimenti reindirizza. */
export async function requireGuildAccess(guildId: string) {
  const { session, guildIds } = await getManageableGuildIds();
  if (!session?.user) redirect("/login");
  if (!guildIds.has(guildId)) redirect("/dashboard");

  const botGuild = await prisma.botGuild.findUnique({ where: { guildId } });
  if (!botGuild || botGuild.removedAt) redirect("/dashboard");

  return { session, botGuild };
}
