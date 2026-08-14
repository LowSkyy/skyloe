import Link from "next/link";
import { requireGuildAccess } from "@/lib/require-guild-access";

const categories = [
  { href: "general", label: "Generale", icon: "⚙️" },
  { href: "moderation", label: "Moderazione", icon: "🛡️" },
  { href: "automod", label: "Automod", icon: "🚫" },
  { href: "antiraid", label: "Anti-raid", icon: "🚨" },
  { href: "logging", label: "Log", icon: "📜" },
  { href: "community", label: "Community", icon: "🎉" },
  { href: "tickets", label: "Ticket", icon: "🎫" },
  { href: "giveaways", label: "Giveaway", icon: "🎁" },
  { href: "music", label: "Musica", icon: "🎵" },
];

export default async function GuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const { botGuild } = await requireGuildAccess(guildId);

  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
      <aside className="w-56 shrink-0">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Tutti i server
        </Link>
        <h2 className="mt-3 truncate text-lg font-semibold">{botGuild.name}</h2>
        <nav className="mt-6 flex flex-col gap-1">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={`/dashboard/${guildId}/${cat.href}`}
              className="flex items-center rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
