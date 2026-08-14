const DISCORD_API = "https://discord.com/api/v10";

const MANAGE_GUILD = BigInt(0x20);
const ADMINISTRATOR = BigInt(0x8);

export interface DiscordGuildSummary {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
}

export function hasManageGuild(permissions: string): boolean {
  const bits = BigInt(permissions);
  return (bits & MANAGE_GUILD) === MANAGE_GUILD || (bits & ADMINISTRATOR) === ADMINISTRATOR;
}

/** Server dell'utente su cui ha Manage Server o Administrator, secondo l'API Discord. */
export async function fetchUserManageableGuilds(accessToken: string): Promise<DiscordGuildSummary[]> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];

  const guilds = (await res.json()) as DiscordGuildSummary[];
  return guilds.filter((guild) => hasManageGuild(guild.permissions));
}

export function guildIconUrl(guildId: string, icon: string | null, size = 64): string | null {
  if (!icon) return null;
  const extension = icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${extension}?size=${size}`;
}
