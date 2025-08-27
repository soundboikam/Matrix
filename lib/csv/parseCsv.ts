import Papa from "papaparse";
import { z } from "zod";
import { format, parse, isValid } from "date-fns";
import { inferHeaderMapping, normalizeHeader, type NormalizedRow } from "@/lib/csv/headerMap";

const RowSchema = z.object({
  artist: z.string().min(1),
  streams: z.coerce.number().int().nonnegative(),
  week: z.string().optional(), // optional during preview
});

export type ParsedPreview = {
  included: NormalizedRow[];
  excluded: NormalizedRow[];
  warnings: string[];
  headerMapping: {
    artistKey: string | null;
    streamsKey: string | null;
    weekKey: string | null;
  };
};

type FileLike = { arrayBuffer: () => Promise<ArrayBuffer> };

/** Clean Music Connect artifacts:
 * - Strip BOM
 * - Drop leading title rows until we find a header that contains "Artist Name"
 * - Drop copyright/footer rows
 */
function preCleanMusicConnectCsv(text: string): string {
  const noBom = text.replace(/^\uFEFF/, "");
  const lines = noBom.split(/\r?\n/);

  const isHeader = (line: string) => normalizeHeader(line).includes("artist name");

  let headerIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isHeader(lines[i])) {
      headerIdx = i;
      break;
    }
  }

  let trimmed = headerIdx >= 0 ? lines.slice(headerIdx) : lines;

  trimmed = trimmed.filter(
    (ln) =>
      !/^copyright\s*\(c\)/i.test(ln.trim()) &&
      !/luminate data/i.test(ln.trim())
  );

  while (trimmed.length && trimmed[trimmed.length - 1].trim() === "") trimmed.pop();

  return trimmed.join("\n");
}

function coerceNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return Math.round(value);
  if (typeof value === "string") {
    const cleaned = value.replace(/[, ]+/g, "");
    const n = Number(cleaned);
    if (!Number.isNaN(n)) return Math.round(n);
  }
  return null;
}

function coerceDateToISO(value: unknown, weekFormatHint?: string): string | null {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value;
  }

  const str = String(value).trim();

  const fmt = weekFormatHint?.replace(/m/g, "M") ?? "MM/dd/yyyy";
  const parsed = parse(str, fmt, new Date());
  if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");

  const candidates = ["M/d/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "d/M/yyyy", "dd/MM/yyyy"];
  for (const c of candidates) {
    const p = parse(str, c, new Date());
    if (isValid(p)) return format(p, "yyyy-MM-dd");
  }

  const d = new Date(str);
  if (isValid(d)) return format(d, "yyyy-MM-dd");

  return null;
}

export async function parseCsvFile(file: FileLike, opts?: { weekFormat?: string }): Promise<ParsedPreview> {
  const ab = await file.arrayBuffer();
  const raw = new TextDecoder("utf-8", { fatal: false }).decode(ab);
  const text = preCleanMusicConnectCsv(raw);

  const result = Papa.parse(text, {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: "greedy",
    delimitersToGuess: [",", "\t", ";", "|"],
    transformHeader: (h) => normalizeHeader(h),
  });

  const headers: string[] = result.meta.fields ?? [];
  const mapping = inferHeaderMapping(headers);

  const warnings: string[] = [];
  if (!mapping.artistKey) warnings.push("Could not find an Artist column.");
  if (!mapping.streamsKey) warnings.push("Could not find a Streams/Plays column.");
  if (!mapping.weekKey) warnings.push("No Week/Date column found. Use Week Start input.");

  const included: NormalizedRow[] = [];
  const excluded: NormalizedRow[] = [];

  for (const rawRow of result.data as Record<string, unknown>[]) {
    const artistVal = mapping.artistKey ? rawRow[mapping.artistKey] : rawRow["artist"];
    const streamsVal = mapping.streamsKey ? rawRow[mapping.streamsKey] : rawRow["streams"];
    const weekVal = mapping.weekKey ? rawRow[mapping.weekKey] : rawRow["week"];

    const artist = (artistVal ?? "").toString().trim();
    const streams = coerceNumber(streamsVal);
    const weekISO = coerceDateToISO(weekVal, opts?.weekFormat) ?? undefined;

    // Only process rows that have required fields (artist and streams)
    if (artist && streams !== null) {
      const row: NormalizedRow = {
        artist,
        streams,
        week: weekISO,
      };
      included.push(row);
    } else {
      // Skip rows missing required data
      excluded.push({ artist, streams: streams ?? 0, week: weekISO });
    }
  }

  return {
    included,
    excluded,
    warnings,
    headerMapping: mapping,
  };
}

export function applyWeekStartToMissing(rows: NormalizedRow[], weekStartISO?: string): NormalizedRow[] {
  if (!weekStartISO) return rows;
  return rows.map(r => ({ ...r, week: r.week ?? weekStartISO }));
}