import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchUserManageableGuilds, guildIconUrl } from "@/lib/discord-api";

// Kick, Ban, Manage Channels, Manage Guild, View Channel, Send Messages, Manage Messages,
// Embed Links, Read Message History, Moderate Members (timeout), Connect + Speak (per la musica futura).
const INVITE_PERMISSIONS = "1099514866742";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "discord" },
    select: { access_token: true },
  });

  const manageableGuilds = account?.access_token ? await fetchUserManageableGuilds(account.access_token) : [];
  const botGuilds = await prisma.botGuild.findMany({ where: { removedAt: null }, select: { guildId: true } });
  const botGuildIds = new Set(botGuilds.map((g) => g.guildId));

  const clientId = process.env.AUTH_DISCORD_ID;
  const inviteUrl = clientId
    ? `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${INVITE_PERMISSIONS}&scope=bot%20applications.commands`
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold">I tuoi server</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Seleziona un server per configurare Skyle. Mostriamo solo i server dove hai il permesso &quot;Gestisci server&quot;.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {manageableGuilds.map((guild) => {
          const hasBot = botGuildIds.has(guild.id);
          const icon = guildIconUrl(guild.id, guild.icon, 64);

          const card = (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition hover:border-primary">
              {icon ? (
                <img src={icon} alt="" className="h-10 w-10 rounded-full" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {guild.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{guild.name}</p>
                <p className="text-xs text-muted-foreground">
                  {hasBot ? "Skyle è nel server" : "Skyle non è ancora nel server — clicca per invitarlo"}
                </p>
              </div>
            </div>
          );

          if (hasBot) {
            return (
              <Link key={guild.id} href={`/dashboard/${guild.id}/general`}>
                {card}
              </Link>
            );
          }

          return inviteUrl ? (
            <a key={guild.id} href={`${inviteUrl}&guild_id=${guild.id}`} target="_blank" rel="noreferrer">
              {card}
            </a>
          ) : (
            <div key={guild.id}>{card}</div>
          );
        })}
      </div>

      {manageableGuilds.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          Non risultano server dove gestisci i permessi, oppure la sessione Discord è scaduta: prova a rifare il login.
        </p>
      )}
    </div>
  );
}
