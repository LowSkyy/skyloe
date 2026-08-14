import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command, SkyleClient } from "../../types";

const categoryLabel: Record<Command["category"], string> = {
  moderation: "🛡️ Moderazione",
  utility: "🔧 Utility",
  community: "🎉 Community",
  music: "🎵 Musica",
};

export const command: Command = {
  category: "utility",
  data: new SlashCommandBuilder().setName("help").setDescription("Mostra tutti i comandi disponibili"),

  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client as SkyleClient;

    const byCategory = new Map<Command["category"], Command[]>();
    for (const cmd of client.commands.values()) {
      const list = byCategory.get(cmd.category) ?? [];
      list.push(cmd);
      byCategory.set(cmd.category, list);
    }

    const embed = new EmbedBuilder().setTitle("Comandi di Skyle").setColor(0x0e7c86);

    for (const [category, cmds] of byCategory) {
      embed.addFields({
        name: categoryLabel[category],
        value: cmds.map((c) => `\`/${c.data.name}\` — ${c.data.description ?? ""}`).join("\n"),
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
