// utils/parseCsv.ts
export type ParsedRow = {
  artist: string;
  streams: number;
  week?: string;
};

const norm = (s: string) =>
  s.toLowerCase().trim().replace(/\uFEFF/g, "").replace(/[\s\-\/]+/g, "_");

const looksLikeTitleRow = (line: string) => {
  const first = (line.split(",")[0] || "").toLowerCase().trim();
  return first.startsWith("favorite artists") || first.startsWith("export_");
};

function splitCsv(text: string): string[][] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const rows: string[][] = [];
  for (const line of lines) {
    if (!line) continue;
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = !q;
      } else if (ch === "," && !q) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    if (out.some((c) => c && c.trim())) rows.push(out);
  }
  return rows;
}

function cleanNum(v: any): number {
  if (v == null || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/,/g, "").trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export async function parseCsv(csvText: string): Promise<ParsedRow[]> {
  // Strip BOM
  if (csvText.charCodeAt(0) === 0xfeff) csvText = csvText.slice(1);

  const rows = splitCsv(csvText);
  if (!rows.length) return [];

  let headerIdx = 0;
  if (rows[0] && rows[0].length >= 1) {
    const firstLine = rows[0].join(",");
    if (looksLikeTitleRow(firstLine) && rows.length > 1) headerIdx = 1;
  }
  const header = (rows[headerIdx] || []).map(norm);

  const artistIdx = header.findIndex((h) =>
    ["artist", "artist_name", "name", "favorite_artists"].includes(h)
  );
  const streamsIdx = header.findIndex((h) =>
    ["on_demand_audio_streams", "streams", "total_streams", "on_demand_streams"].includes(h)
  );
  const weekIdx = header.findIndex((h) =>
    ["week", "week_start", "date", "start_date"].includes(h)
  );

  const out: ParsedRow[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r.some((c) => c && c.trim())) continue;
    const artist = artistIdx >= 0 ? String(r[artistIdx] ?? "").trim() : "";
    if (!artist) continue;
    const streams = cleanNum(streamsIdx >= 0 ? r[streamsIdx] : "");
    const weekRaw = weekIdx >= 0 ? String(r[weekIdx] ?? "").trim() : "";
    let week: string | undefined;
    if (weekRaw) {
      const d = new Date(weekRaw);
      if (!isNaN(d.getTime())) week = d.toISOString().slice(0, 10);
    }
    out.push({ artist, streams, week });
  }
  return out;
}
