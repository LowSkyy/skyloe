const DISCORD_API = "https://discord.com/api/v10";

// Valori del campo "type" dei canali Discord, come restituiti dalla REST API.
export const CHANNEL_TYPE = {
  GuildText: 0,
  GuildVoice: 2,
  GuildCategory: 4,
  GuildAnnouncement: 5,
} as const;

export interface DiscordRole {
  id: string;
  name: string;
  position: number;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  position: number;
}

function botHeaders(): Record<string, string> | null {
  const token = process.env.DISCORD_TOKEN;
  return token ? { Authorization: `Bot ${token}` } : null;
}

/** Ruoli del server (esclude @everyone), dal più alto al più basso in gerarchia. */
export async function fetchGuildRoles(guildId: string): Promise<DiscordRole[]> {
  const headers = botHeaders();
  if (!headers) return [];

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, { headers, next: { revalidate: 30 } });
  if (!res.ok) return [];

  const roles = (await res.json()) as DiscordRole[];
  return roles.filter((role) => role.id !== guildId).sort((a, b) => b.position - a.position);
}

/** Tutti i canali del server, ordinati come appaiono su Discord. */
export async function fetchGuildChannels(guildId: string): Promise<DiscordChannel[]> {
  const headers = botHeaders();
  if (!headers) return [];

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, { headers, next: { revalidate: 30 } });
  if (!res.ok) return [];

  const channels = (await res.json()) as DiscordChannel[];
  return channels.sort((a, b) => a.position - b.position);
}
