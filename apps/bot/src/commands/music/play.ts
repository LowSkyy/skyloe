import {
  ActionRowBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import play from "play-dl";
import { getMusicPlayer } from "../../modules/music/player-manager";
import { isSpotifyUrl, isYoutubeUrl, resolveSpotifyTrack } from "../../modules/music/spotify";
import { searchYoutube } from "../../modules/music/search";
import { getMusicSettings } from "../../lib/config-cache";
import type { Command } from "../../types";

export const command: Command = {
  category: "music",
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Riproduce una canzone: ricerca testuale, link YouTube o link Spotify")
    .addStringOption((option) => option.setName("richiesta").setDescription("Cosa vuoi ascoltare").setRequired(true)),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.inCachedGuild()) return;

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      await interaction.reply({ content: "Devi essere in un canale vocale per usare questo comando.", ephemeral: true });
      return;
    }

    const query = interaction.options.getString("richiesta", true);
    const player = getMusicPlayer(interaction.guild.id);
    if (interaction.channel) player.textChannel = interaction.channel;

    const settings = await getMusicSettings(interaction.guild.id);
    const maxQueueSize = settings?.maxQueueSize ?? 200;
    if (player.queue.length >= maxQueueSize) {
      await interaction.reply({ content: `La coda ha raggiunto il limite di ${maxQueueSize} brani.`, ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const wasConnected = Boolean(player.connection);
    try {
      await player.connect(voiceChannel);
    } catch {
      await interaction.editReply("Non riesco a connettermi al canale vocale (controlla i miei permessi Connetti/Parla).");
      return;
    }

    if (!wasConnected) {
      player.volume = settings?.defaultVolume ?? 80;
      player.stay247 = settings?.stay247 ?? false;
    }

    if (isYoutubeUrl(query)) {
      const info = await play.video_basic_info(query).catch(() => null);
      if (!info) {
        await interaction.editReply("Non sono riuscito a leggere questo link YouTube.");
        return;
      }
      const video = info.video_details;
      await player.enqueue({
        title: video.title ?? query,
        url: video.url,
        durationText: video.durationRaw ?? "?",
        thumbnail: video.thumbnails?.[0]?.url ?? null,
        requestedBy: interaction.user.id,
      });
      await interaction.editReply(`✅ Aggiunto alla coda: **${video.title ?? query}**`);
      return;
    }

    let searchQuery = query;
    if (isSpotifyUrl(query)) {
      const spotifyTrack = await resolveSpotifyTrack(query);
      if (!spotifyTrack) {
        await interaction.editReply(
          "Non sono riuscito a leggere questo link Spotify (funziona solo con link a singole tracce, non playlist/album).",
        );
        return;
      }
      searchQuery = spotifyTrack.title;
    }

    const results = await searchYoutube(searchQuery, 5);
    if (results.length === 0) {
      await interaction.editReply("Nessun risultato trovato.");
      return;
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId("music:pick")
      .setPlaceholder("Scegli il brano corretto")
      .addOptions(
        results.map((result, index) => ({
          label: result.title.slice(0, 100),
          description: result.durationText,
          value: `${index}`,
        })),
      );

    const embed = new EmbedBuilder()
      .setTitle(`Risultati per "${searchQuery}"`)
      .setDescription(results.map((r, i) => `**${i + 1}.** [${r.title}](${r.url}) — ${r.durationText}`).join("\n"))
      .setColor(0x5865f2);

    const message = await interaction.editReply({
      embeds: [embed],
      components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
    });

    try {
      const selection = await message.awaitMessageComponent({
        filter: (component) => component.user.id === interaction.user.id,
        time: 30_000,
      });

      if (!selection.isStringSelectMenu()) return;
      const chosen = results[Number(selection.values[0])];

      await player.enqueue({
        title: chosen.title,
        url: chosen.url,
        durationText: chosen.durationText,
        thumbnail: chosen.thumbnail,
        requestedBy: interaction.user.id,
      });

      await selection.update({ content: `✅ Aggiunto alla coda: **${chosen.title}**`, embeds: [], components: [] });
    } catch {
      await interaction
        .editReply({ content: "⏱️ Tempo scaduto, nessuna scelta effettuata.", embeds: [], components: [] })
        .catch(() => null);
    }
  },
};
