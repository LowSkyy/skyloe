export interface SpotifyTrackInfo {
  title: string;
}

export function isSpotifyUrl(input: string): boolean {
  return /open\.spotify\.com\/(intl-\w+\/)?(track|album|playlist)\//.test(input);
}

export function isYoutubeUrl(input: string): boolean {
  return /(youtube\.com|youtu\.be)\//.test(input);
}

/**
 * Spotify non permette lo streaming dell'audio reale ai bot di terze parti (DRM). Usiamo il suo
 * endpoint oEmbed pubblico (nessuna API key richiesta) solo per leggere il titolo del brano, poi
 * cerchiamo l'equivalente su YouTube per riprodurlo davvero.
 */
export async function resolveSpotifyTrack(url: string): Promise<SpotifyTrackInfo | null> {
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string };
    if (!data.title) return null;
    return { title: data.title };
  } catch {
    return null;
  }
}
