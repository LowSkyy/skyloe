import { EmbedBuilder, GuildVerificationLevel, type GuildMember } from "discord.js";
import { AntiraidAction } from "@skyle/db";
import { getAntiraidSettings, getGuildConfig } from "../../lib/config-cache";

interface GuildRaidState {
  joinTimestamps: number[];
  lockedUntil?: number;
  previousVerificationLevel?: GuildVerificationLevel;
}

const state = new Map<string, GuildRaidState>();

function getState(guildId: string): GuildRaidState {
  let entry = state.get(guildId);
  if (!entry) {
    entry = { joinTimestamps: [] };
    state.set(guildId, entry);
  }
  return entry;
}

async function sendAlert(member: GuildMember, title: string, description: string) {
  const config = await getGuildConfig(member.guild.id);
  if (!config?.antiraidLogChannelId) return;

  const channel = await member.guild.channels.fetch(config.antiraidLogChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(0xb91c1c).setTimestamp();
  await channel.send({ embeds: [embed] }).catch(() => null);
}

async function applyAction(member: GuildMember, action: AntiraidAction, reason: string): Promise<boolean> {
  if (action === AntiraidAction.NONE) return false;
  try {
    if (action === AntiraidAction.KICK) await member.kick(reason);
    if (action === AntiraidAction.BAN) await member.ban({ reason });
    await sendAlert(member, "🛡️ Anti-raid", `${member.user.username} (\`${member.id}\`) rimosso: ${reason}.`);
    return true;
  } catch {
    // il bot potrebbe non avere i permessi, o l'utente è già uscito: non è un errore fatale
    return false;
  }
}

async function triggerLockdown(member: GuildMember, minutes: number, autoLockdown: boolean) {
  await sendAlert(
    member,
    "🚨 Possibile raid rilevato",
    `Molti utenti si sono uniti in poco tempo.${autoLockdown ? ` Il server verrà bloccato per ${minutes} minuti.` : ""}`,
  );

  if (!autoLockdown) return;

  const guildState = getState(member.guild.id);
  if (guildState.lockedUntil && guildState.lockedUntil > Date.now()) return;

  const guild = member.guild;
  guildState.previousVerificationLevel = guild.verificationLevel;
  guildState.lockedUntil = Date.now() + minutes * 60_000;

  await guild.setVerificationLevel(GuildVerificationLevel.VeryHigh, "Anti-raid: lockdown automatico").catch(() => null);

  setTimeout(() => {
    const current = state.get(guild.id);
    guild
      .setVerificationLevel(current?.previousVerificationLevel ?? GuildVerificationLevel.Medium, "Anti-raid: fine lockdown")
      .catch(() => null);
    if (current) current.lockedUntil = undefined;
  }, minutes * 60_000);
}

/** Restituisce true se il membro è stato rimosso (kick/ban), utile per non mandare il messaggio di benvenuto. */
export async function runAntiraid(member: GuildMember): Promise<boolean> {
  const settings = await getAntiraidSettings(member.guild.id);
  if (!settings?.enabled) return false;

  const accountAgeMinutes = (Date.now() - member.user.createdTimestamp) / 60_000;
  if (accountAgeMinutes < settings.minAccountAgeMinutes) {
    const removed = await applyAction(member, settings.action, "account creato troppo di recente");
    if (removed) return true;
  }

  const guildState = getState(member.guild.id);
  const windowStart = Date.now() - settings.joinWindowSeconds * 1000;
  guildState.joinTimestamps = guildState.joinTimestamps.filter((t) => t > windowStart);
  guildState.joinTimestamps.push(Date.now());

  if (guildState.joinTimestamps.length >= settings.joinThreshold) {
    guildState.joinTimestamps = [];
    await triggerLockdown(member, settings.lockdownMinutes, settings.autoLockdown);
  }

  return false;
}
