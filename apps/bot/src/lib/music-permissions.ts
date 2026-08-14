import { PermissionFlagsBits, type GuildMember } from "discord.js";
import { getMusicSettings } from "./config-cache";

/** Senza ruoli DJ configurati, i comandi di controllo musica sono aperti a tutti. */
export async function hasDjPermission(guildId: string, member: GuildMember): Promise<boolean> {
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;

  const settings = await getMusicSettings(guildId);
  if (!settings?.djRoleIds.length) return true;

  return settings.djRoleIds.some((roleId) => member.roles.cache.has(roleId));
}
