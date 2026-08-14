import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { Command } from "../../types";

export const command: Command = {
  category: "utility",
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Mostra l'avatar di un utente")
    .addUserOption((option) => option.setName("utente").setDescription("Utente da controllare (default: tu)")),

  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser("utente") ?? interaction.user;

    const embed = new EmbedBuilder()
      .setTitle(`Avatar di ${user.username}`)
      .setImage(user.displayAvatarURL({ size: 1024 }))
      .setColor(0x0e7c86);

    await interaction.reply({ embeds: [embed] });
  },
};
