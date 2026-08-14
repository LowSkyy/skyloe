import {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  type AudioPlayer,
  type VoiceConnection,
} from "@discordjs/voice";
import { EmbedBuilder, type TextBasedChannel, type VoiceBasedChannel } from "discord.js";
import { exec as ytdlpExec } from "yt-dlp-exec";
import type { ExecaChildProcess } from "execa";

export interface QueueTrack {
  title: string;
  url: string;
  durationText: string;
  thumbnail: string | null;
  requestedBy: string;
}

const IDLE_LEAVE_MS = 60_000;

class GuildMusicPlayer {
  readonly guildId: string;
  readonly audioPlayer: AudioPlayer;
  connection: VoiceConnection | null = null;
  queue: QueueTrack[] = [];
  current: QueueTrack | null = null;
  textChannel: TextBasedChannel | null = null;
  volume = 80;
  stay247 = false;
  private currentProcess: ExecaChildProcess<string> | null = null;
  private idleTimer: NodeJS.Timeout | null = null;

  constructor(guildId: string) {
    this.guildId = guildId;
    this.audioPlayer = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.playNext().catch((error) => console.error("Errore passaggio alla traccia successiva:", error));
    });
    this.audioPlayer.on("error", (error) => {
      console.error("Errore audio player:", error);
      this.playNext().catch(() => null);
    });
  }

  async connect(channel: VoiceBasedChannel) {
    if (
      this.connection &&
      this.connection.joinConfig.channelId === channel.id &&
      this.connection.state.status === VoiceConnectionStatus.Ready
    ) {
      return;
    }

    this.connection?.destroy();

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });
    this.connection = connection;
    connection.subscribe(this.audioPlayer);

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        // Discord sta ricollegando da solo (es. cambio di server vocale): non serve intervenire
      } catch {
        connection.destroy();
        if (this.connection === connection) this.connection = null;
      }
    });

    try {
      // Su una connessione internet "normale" (non un VPS) l'handshake vocale può richiedere
      // più tempo del previsto: un timeout troppo corto scarta connessioni che sarebbero
      // comunque diventate valide, lasciando il bot agganciato al canale ma senza audio funzionante.
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch (error) {
      connection.destroy();
      if (this.connection === connection) this.connection = null;
      throw error;
    }
  }

  disconnect() {
    this.clearIdleTimer();
    this.currentProcess?.kill("SIGKILL");
    this.currentProcess = null;
    this.connection?.destroy();
    this.connection = null;
    this.queue = [];
    this.current = null;
    this.audioPlayer.stop(true);
  }

  private clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private scheduleIdleLeave() {
    if (this.stay247) return;
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      if (!this.current && this.queue.length === 0) this.disconnect();
    }, IDLE_LEAVE_MS);
  }

  async enqueue(track: QueueTrack) {
    this.queue.push(track);
    if (!this.current && this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      await this.playNext();
    }
  }

  async playNext() {
    this.clearIdleTimer();
    this.currentProcess?.kill("SIGKILL");
    this.currentProcess = null;

    const next = this.queue.shift();
    if (!next) {
      this.current = null;
      this.scheduleIdleLeave();
      return;
    }

    this.current = next;

    // yt-dlp fa l'estrazione vera e propria (più affidabile delle librerie JS pure, che si
    // rompono spesso quando YouTube cambia le sue difese), ffmpeg (via createAudioResource con
    // StreamType.Arbitrary) trascodifica quello che riceve in Opus per Discord.
    const child = ytdlpExec(
      next.url,
      { format: "bestaudio/best", output: "-", quiet: true, noWarnings: true, noPlaylist: true },
      { stdio: ["ignore", "pipe", "ignore"] },
    );
    child.catch(() => null); // termina con errore quando lo uccidiamo noi (skip/stop): non è un problema

    if (!child.stdout) {
      console.error("yt-dlp non ha prodotto uno stream per", next.url);
      await this.handlePlaybackFailure(next.title);
      return;
    }

    this.currentProcess = child;

    try {
      const resource = createAudioResource(child.stdout, { inputType: StreamType.Arbitrary, inlineVolume: true });
      resource.volume?.setVolume(this.volume / 100);
      this.audioPlayer.play(resource);

      // Se dopo un po' l'audio non è davvero partito (estrazione fallita, rete lenta), non
      // restare bloccati in silenzio: consideralo un errore e passa alla traccia successiva.
      await entersState(this.audioPlayer, AudioPlayerStatus.Playing, 15_000);

      if (this.textChannel?.isSendable()) {
        const embed = new EmbedBuilder()
          .setTitle("🎵 In riproduzione")
          .setDescription(`[${next.title}](${next.url})`)
          .addFields(
            { name: "Richiesto da", value: `<@${next.requestedBy}>`, inline: true },
            { name: "Durata", value: next.durationText, inline: true },
          )
          .setColor(0x5865f2);
        if (next.thumbnail) embed.setThumbnail(next.thumbnail);
        await this.textChannel.send({ embeds: [embed] }).catch(() => null);
      }
    } catch (error) {
      console.error("Errore avvio traccia:", error);
      child.kill("SIGKILL");
      if (this.currentProcess === child) this.currentProcess = null;
      await this.handlePlaybackFailure(next.title);
    }
  }

  private async handlePlaybackFailure(title: string) {
    if (this.textChannel?.isSendable()) {
      await this.textChannel.send(`⚠️ Impossibile riprodurre **${title}**, salto alla prossima.`).catch(() => null);
    }
    await this.playNext();
  }

  skip() {
    this.audioPlayer.stop();
  }

  pause() {
    this.audioPlayer.pause();
  }

  resumePlayback() {
    this.audioPlayer.unpause();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(100, volume));
    const state = this.audioPlayer.state;
    if ("resource" in state) {
      state.resource.volume?.setVolume(this.volume / 100);
    }
  }
}

const players = new Map<string, GuildMusicPlayer>();

export function getMusicPlayer(guildId: string): GuildMusicPlayer {
  let player = players.get(guildId);
  if (!player) {
    player = new GuildMusicPlayer(guildId);
    players.set(guildId, player);
  }
  return player;
}

export type { GuildMusicPlayer };
