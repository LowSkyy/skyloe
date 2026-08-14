import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@skyle/db";
import { ensureGuildConfig } from "../../lib/config-cache";
import type { Command } from "../../types";

function parseEmojiKey(input: string): string {
  const customMatch = input.match(/^<a?:\w+:(\d+)>$/);
  return customMatch ? customMatch[1] : input;
}

export const command: Command = {
  category: "community",
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Gestisce i ruoli assegnati tramite reazione")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Collega un'emoji su un messaggio a un ruolo")
        .addStringOption((o) => o.setName("messaggio_id").setDescription("ID del messaggio").setRequired(true))
        .addChannelOption((o) => o.setName("canale").setDescription("Canale del messaggio").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji da usare").setRequired(true))
        .addRoleOption((o) => o.setName("ruolo").setDescription("Ruolo da assegnare").setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Rimuove un collegamento emoji → ruolo")
        .addStringOption((o) => o.setName("messaggio_id").setDescription("ID del messaggio").setRequired(true))
        .addStringOption((o) => o.setName("emoji").setDescription("Emoji da rimuovere").setRequired(true)),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const messageId = interaction.options.getString("messaggio_id", true);
      const channelOption = interaction.options.getChannel("canale", true);
      const emojiInput = interaction.options.getString("emoji", true);
      const role = interaction.options.getRole("ruolo", true);

      const channel = await interaction.guild.channels.fetch(channelOption.id).catch(() => null);
      if (!channel || !channel.isTextBased()) {
        await interaction.reply({ content: "Canale non valido.", ephemeral: true });
        return;
      }

      const message = await channel.messages.fetch(messageId).catch(() => null);
      if (!message) {
        await interaction.reply({ content: "Messaggio non trovato in quel canale.", ephemeral: true });
        return;
      }

      try {
        await message.react(emojiInput);
      } catch {
        await interaction.reply({ content: "Emoji non valida, o Skyle non può usarla.", ephemeral: true });
        return;
      }

      const emojiKey = parseEmojiKey(emojiInput);

      await ensureGuildConfig(interaction.guild.id);
      await prisma.reactionRoleConfig.upsert({
        where: { messageId_emoji: { messageId, emoji: emojiKey } },
        create: {
          guildId: interaction.guild.id,
          messageId,
          channelId: channel.id,
          emoji: emojiKey,
          roleId: role.id,
        },
        update: { roleId: role.id },
      });

      await interaction.reply(`✅ Chi reagisce con ${emojiInput} a quel messaggio riceverà il ruolo <@&${role.id}>.`);
      return;
    }

    const messageId = interaction.options.getString("messaggio_id", true);
    const emojiInput = interaction.options.getString("emoji", true);
    const emojiKey = parseEmojiKey(emojiInput);

    const deleted = await prisma.reactionRoleConfig
      .delete({ where: { messageId_emoji: { messageId, emoji: emojiKey } } })
      .catch(() => null);

    await interaction.reply({
      content: deleted ? "✅ Collegamento rimosso." : "Non ho trovato un collegamento con questi dati.",
      ephemeral: true,
    });
  },
};
