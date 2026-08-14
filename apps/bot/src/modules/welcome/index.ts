import { EmbedBuilder, type Guild, type GuildMember, type PartialGuildMember } from "discord.js";
import { getWelcomeConfig } from "../../lib/config-cache";

interface SimpleMember {
  id: string;
  username: string;
}

function renderTemplate(template: string, member: SimpleMember, guild: Guild): string {
  return template
    .replaceAll("{user}", `<@${member.id}>`)
    .replaceAll("{username}", member.username)
    .replaceAll("{server}", guild.name)
    .replaceAll("{membercount}", `${guild.memberCount}`);
}

export async function sendWelcomeMessage(member: GuildMember) {
  const config = await getWelcomeConfig(member.guild.id);
  if (!config?.enabled) return;

  const simple: SimpleMember = { id: member.id, username: member.user.username };

  if (config.channelId) {
    const channel = await member.guild.channels.fetch(config.channelId).catch(() => null);
    if (channel?.isTextBased()) {
      const embed = new EmbedBuilder()
        .setDescription(renderTemplate(config.messageTemplate, simple, member.guild))
        .setColor(0x22d3ee)
        .setThumbnail(member.user.displayAvatarURL({ size: 256 }));
      await channel.send({ embeds: [embed] }).catch(() => null);
    }
  }

  if (config.dmEnabled && config.dmTemplate) {
    await member.send(renderTemplate(config.dmTemplate, simple, member.guild)).catch(() => null);
  }
}

export async function sendLeaveMessage(member: GuildMember | PartialGuildMember) {
  const config = await getWelcomeConfig(member.guild.id);
  if (!config?.leaveEnabled || !config.leaveChannelId) return;

  const channel = await member.guild.channels.fetch(config.leaveChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  const simple: SimpleMember = { id: member.id, username: member.user?.username ?? "Utente" };

  const embed = new EmbedBuilder().setDescription(renderTemplate(config.leaveTemplate, simple, member.guild)).setColor(0x71717a);
  await channel.send({ embeds: [embed] }).catch(() => null);
}
