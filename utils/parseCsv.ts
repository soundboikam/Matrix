// utils/parseCsv.ts
export type ParsedRow = {
  artist: string;
  streams: number;
  week?: string; // ISO (yyyy-mm-dd) if present in CSV
};

function norm(s: string) {
  return s.toLowerCase().trim().replace(/[\s\-\/]+/g, "_");
}

function cleanNum(val: string | number | null | undefined): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  const s = String(val).replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/** Naive CSV parse (no external deps) */
function parseCsvText(csv: string): string[][] {
  const lines = csv.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  return lines
    .map((line) => {
      // handle quoted fields
      const out: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          out.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      return out;
    })
    .filter((row) => row.some((c) => c && c.trim().length));
}

export async function parseCsv(text: string): Promise<ParsedRow[]> {
  const rows = parseCsvText(text);
  if (!rows.length) return [];

  // Detect header row: skip any title-only first line like "Favorite Artists"
  let headerIdx = 0;
  const isTitleOnly =
    rows[0].length === 1 &&
    rows[0][0] &&
    rows[0][0].toLowerCase().includes("favorite artists");
  if (isTitleOnly && rows.length > 1) headerIdx = 1;

  if (!rows[headerIdx]) return [];
  const header = rows[headerIdx].map(norm);

  // find columns
  const artistIdx = header.findIndex((h) =>
    ["artist", "artist_name", "name"].includes(h)
  );
  const streamsIdx = header.findIndex((h) =>
    [
      "on_demand_audio_streams",
      "streams",
      "total_streams",
      "on_demand_streams",
    ].includes(h)
  );
  const weekIdx = header.findIndex((h) =>
    ["week", "week_start", "date", "start_date"].includes(h)
  );

  const out: ParsedRow[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    // stop if it's a trailing note or blank
    if (!r || !r.length || !r.some((c) => c && c.trim())) continue;

    const artistRaw =
      artistIdx >= 0 && r[artistIdx] != null ? String(r[artistIdx]).trim() : "";
    const streamsRaw = streamsIdx >= 0 ? r[streamsIdx] : "";
    const weekRaw =
      weekIdx >= 0 && r[weekIdx] != null ? String(r[weekIdx]).trim() : "";

    if (!artistRaw) continue;
    if (
      artistRaw.toLowerCase().includes("favorite artists") &&
      !streamsRaw &&
      !weekRaw
    )
      continue;

    const streams = cleanNum(streamsRaw);
    let week: string | undefined = undefined;
    if (weekRaw) {
      const d = new Date(weekRaw);
      if (!isNaN(d.getTime())) week = d.toISOString().slice(0, 10);
    }

    out.push({ artist: artistRaw, streams, week });
  }

  return out;
}
