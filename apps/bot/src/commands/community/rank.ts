import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { prisma } from "@skyle/db";
import { computeLevel } from "../../modules/leveling";
import type { Command } from "../../types";

export const command: Command = {
  category: "community",
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Mostra il tuo livello ed esperienza (o quelli di un altro utente)")
    .addUserOption((option) => option.setName("utente").setDescription("Utente da controllare (default: tu)")),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const user = interaction.options.getUser("utente") ?? interaction.user;
    const userLevel = await prisma.userLevel.findUnique({
      where: { guildId_userId: { guildId: interaction.guild.id, userId: user.id } },
    });

    if (!userLevel) {
      await interaction.reply({ content: `**${user.username}** non ha ancora guadagnato esperienza qui.`, ephemeral: true });
      return;
    }

    const { level, xpIntoLevel, xpForNext } = computeLevel(userLevel.xp);

    const rank =
      (await prisma.userLevel.count({
        where: { guildId: interaction.guild.id, xp: { gt: userLevel.xp } },
      })) + 1;

    const embed = new EmbedBuilder()
      .setTitle(`Livello di ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .setColor(0x22d3ee)
      .addFields(
        { name: "Livello", value: `${level}`, inline: true },
        { name: "XP totale", value: `${userLevel.xp}`, inline: true },
        { name: "Posizione", value: `#${rank}`, inline: true },
        { name: "Progresso al prossimo livello", value: `${xpIntoLevel} / ${xpForNext} XP`, inline: false },
      );

    await interaction.reply({ embeds: [embed] });
  },
};
