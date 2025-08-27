export type NormalizedRow = {
  artist: string;
  streams: number;
  week: string; // ISO date yyyy-MM-dd
};

export const HEADER_ALIASES = {
  artist: [
    "artist",
    "artist name",
    "artist_name",
    "name",
    "artistname",
    "act",
    "performer",
    "creator",
  ],
  streams: [
    "streams",
    "total streams",
    "stream count",
    "plays",
    "total plays",
    "count",
    "units",
    "on demand audio streams",
    "on-demand audio streams",
    "ondemand audio streams",
    "audio streams",
  ],
  week: [
    "week",
    "week start",
    "week_start",
    "date",
    "period",
    "start date",
    "week commencing",
    "week beginning",
  ],
};

export function normalizeHeader(h: string) {
  return h
    .replace(/\uFEFF/g, "") // strip BOM if any
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type HeaderMapping = {
  artistKey: string | null;
  streamsKey: string | null;
  weekKey: string | null;
};

export function inferHeaderMapping(headers: string[]): HeaderMapping {
  const norm = headers.map((h) => [h, normalizeHeader(h)] as const);

  const findKey = (aliases: string[]) => {
    for (const [raw, n] of norm) {
      if (aliases.includes(n)) return raw;
    }
    return null;
  };

  return {
    artistKey: findKey(HEADER_ALIASES.artist),
    streamsKey: findKey(HEADER_ALIASES.streams),
    weekKey: findKey(HEADER_ALIASES.week),
  };
}
