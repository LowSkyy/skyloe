import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { describeDiscordError } from "../../lib/discord-errors";
import type { Command } from "../../types";

export const command: Command = {
  category: "moderation",
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Elimina in massa gli ultimi messaggi del canale")
    .addIntegerOption((option) =>
      option.setName("quantita").setDescription("Numero di messaggi da eliminare (1-100)").setMinValue(1).setMaxValue(100).setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild() || !interaction.channel?.isTextBased()) return;

    const amount = interaction.options.getInteger("quantita", true);

    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;
    if (!("bulkDelete" in channel)) {
      await interaction.editReply("Questo tipo di canale non supporta l'eliminazione in massa.");
      return;
    }

    try {
      const deleted = await channel.bulkDelete(amount, true);
      await interaction.editReply(
        `🧹 Eliminati ${deleted.size} messaggi (i messaggi più vecchi di 14 giorni non possono essere eliminati in massa).`,
      );
    } catch (error) {
      await interaction.editReply(describeDiscordError(error));
    }
  },
};
