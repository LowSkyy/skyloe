import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../types";

export const command: Command = {
  category: "utility",
  data: new SlashCommandBuilder().setName("serverinfo").setDescription("Mostra informazioni sul server"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const guild = interaction.guild;
    const owner = await guild.fetchOwner().catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .setColor(0x0e7c86)
      .addFields(
        { name: "ID", value: `\`${guild.id}\``, inline: true },
        { name: "Proprietario", value: owner ? `<@${owner.id}>` : "Sconosciuto", inline: true },
        { name: "Creato", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Membri", value: `${guild.memberCount}`, inline: true },
        { name: "Boost", value: `Livello ${guild.premiumTier} (${guild.premiumSubscriptionCount ?? 0} boost)`, inline: true },
        { name: "Canali", value: `${guild.channels.cache.size}`, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
