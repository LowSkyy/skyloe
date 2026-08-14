import { prisma } from "@skyle/db";
import type { AntiraidSettings, AutomodRule, GuildConfig, LevelConfig, WelcomeConfig, TicketConfig, MusicSettings } from "@skyle/db";

const TTL_MS = 30_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

function makeCache<T>() {
  const store = new Map<string, CacheEntry<T>>();
  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry || entry.expiresAt < Date.now()) return undefined;
      return entry.value;
    },
    set(key: string, value: T) {
      store.set(key, { value, expiresAt: Date.now() + TTL_MS });
    },
  };
}

const guildConfigCache = makeCache<GuildConfig | null>();
const automodCache = makeCache<AutomodRule | null>();
const antiraidCache = makeCache<AntiraidSettings | null>();
const levelConfigCache = makeCache<LevelConfig | null>();
const welcomeConfigCache = makeCache<WelcomeConfig | null>();
const ticketConfigCache = makeCache<TicketConfig | null>();
const musicSettingsCache = makeCache<MusicSettings | null>();

export async function getGuildConfig(guildId: string) {
  const cached = guildConfigCache.get(guildId);
  if (cached !== undefined) return cached;
  const config = await prisma.guildConfig.findUnique({ where: { guildId } });
  guildConfigCache.set(guildId, config);
  return config;
}

export async function ensureGuildConfig(guildId: string) {
  const existing = await getGuildConfig(guildId);
  if (existing) return existing;
  const created = await prisma.guildConfig.create({ data: { guildId } });
  guildConfigCache.set(guildId, created);
  return created;
}

export async function getAutomodRule(guildId: string) {
  const cached = automodCache.get(guildId);
  if (cached !== undefined) return cached;
  const rule = await prisma.automodRule.findUnique({ where: { guildId } });
  automodCache.set(guildId, rule);
  return rule;
}

export async function getAntiraidSettings(guildId: string) {
  const cached = antiraidCache.get(guildId);
  if (cached !== undefined) return cached;
  const settings = await prisma.antiraidSettings.findUnique({ where: { guildId } });
  antiraidCache.set(guildId, settings);
  return settings;
}

export async function getLevelConfig(guildId: string) {
  const cached = levelConfigCache.get(guildId);
  if (cached !== undefined) return cached;
  const config = await prisma.levelConfig.findUnique({ where: { guildId } });
  levelConfigCache.set(guildId, config);
  return config;
}

export async function getWelcomeConfig(guildId: string) {
  const cached = welcomeConfigCache.get(guildId);
  if (cached !== undefined) return cached;
  const config = await prisma.welcomeConfig.findUnique({ where: { guildId } });
  welcomeConfigCache.set(guildId, config);
  return config;
}

export async function getTicketConfig(guildId: string) {
  const cached = ticketConfigCache.get(guildId);
  if (cached !== undefined) return cached;
  const config = await prisma.ticketConfig.findUnique({ where: { guildId } });
  ticketConfigCache.set(guildId, config);
  return config;
}

export async function getMusicSettings(guildId: string) {
  const cached = musicSettingsCache.get(guildId);
  if (cached !== undefined) return cached;
  const settings = await prisma.musicSettings.findUnique({ where: { guildId } });
  musicSettingsCache.set(guildId, settings);
  return settings;
}
