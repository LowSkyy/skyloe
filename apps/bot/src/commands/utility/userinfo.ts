import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../types";

export const command: Command = {
  category: "utility",
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Mostra informazioni su un utente")
    .addUserOption((option) => option.setName("utente").setDescription("Utente da controllare (default: tu)")),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const user = interaction.options.getUser("utente") ?? interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(user.username)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .setColor(0x0e7c86)
      .addFields(
        { name: "ID", value: `\`${user.id}\``, inline: true },
        { name: "Account creato", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
      );

    if (member?.joinedTimestamp) {
      embed.addFields({ name: "Entrato nel server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true });
    }
    if (member) {
      const roles = member.roles.cache.filter((r) => r.id !== interaction.guild.id);
      embed.addFields({
        name: `Ruoli (${roles.size})`,
        value: roles.size ? roles.map((r) => `<@&${r.id}>`).join(" ") : "Nessuno",
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
