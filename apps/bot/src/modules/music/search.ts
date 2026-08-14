import play from "play-dl";

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  durationText: string;
  thumbnail: string | null;
}

export async function searchYoutube(query: string, limit = 5): Promise<SearchResult[]> {
  const results = await play.search(query, { limit, source: { youtube: "video" } });
  return results.map((video) => ({
    id: video.id ?? video.url,
    title: video.title ?? "Senza titolo",
    url: video.url,
    durationText: video.durationRaw ?? "?",
    thumbnail: video.thumbnails?.[0]?.url ?? null,
  }));
}
