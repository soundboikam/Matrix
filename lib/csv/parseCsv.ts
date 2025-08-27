

import Papa from "papaparse";
import { z } from "zod";
import { format, parse, isValid } from "date-fns";
import { inferHeaderMapping, normalizeHeader, type NormalizedRow } from "@/lib/csv/headerMap";

const RowSchema = z.object({
  artist: z.string().min(1),
  streams: z.coerce.number().int().nonnegative(),
  week: z.string(), // ISO yyyy-MM-dd
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

function coerceNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    // remove thousand separators and spaces, accept comma or dot decimal (we round)
    const cleaned = value.replace(/[, ]+/g, "");
    const n = Number(cleaned);
    if (!Number.isNaN(n)) return Math.round(n);
  }
  return null;
}

function coerceDateToISO(value: unknown, weekFormatHint?: string): string | null {
  if (!value) return null;

  // If already ISO:
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value;
  }

  const str = String(value).trim();

  // If caller passed a UI week start format (e.g., "MM/dd/yyyy" or "mm/dd/yyyy")
  // try that first. (We accept both mm and MM)
  const fmt = weekFormatHint?.replace(/m/g, "M") ?? "MM/dd/yyyy";
  const parsed = parse(str, fmt, new Date());
  if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");

  // Try some common fallbacks:
  const candidates = ["M/d/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "d/M/yyyy", "dd/MM/yyyy"];
  for (const c of candidates) {
    const p = parse(str, c, new Date());
    if (isValid(p)) return format(p, "yyyy-MM-dd");
  }

  // Last resort: Date(str)
  const d = new Date(str);
  if (isValid(d)) return format(d, "yyyy-MM-dd");

  return null;
}

export async function parseCsvFile(file: FileLike, opts?: { weekFormat?: string }): Promise<ParsedPreview> {
  const ab = await file.arrayBuffer();
  const text = new TextDecoder("utf-8", { fatal: false }).decode(ab).replace(/^\uFEFF/, ""); // strip BOM

  // Detect delimiter automatically; header row present
  const result = Papa.parse(text, {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: "greedy",
    delimitersToGuess: [",", "\t", ";", "|"],
    transformHeader: (h) => normalizeHeader(h),
  });

  if (result.errors?.length) {
    // If we failed, try again without header in case the file has no header
    // (we still prefer headered CSVs for UX)
  }

  const originalHeaders: string[] = result.meta.fields ?? [];
  const mapping = inferHeaderMapping(originalHeaders);

  const warnings: string[] = [];

  if (!mapping.artistKey) warnings.push("Could not find an Artist column.");
  if (!mapping.streamsKey) warnings.push("Could not find a Streams/Plays column.");
  if (!mapping.weekKey) warnings.push("No Week/Date column found. Using 'Week Start' input value will be required.");

  const rows: NormalizedRow[] = [];

  for (const raw of result.data as Record<string, unknown>[]) {
    const artistVal = mapping.artistKey ? raw[mapping.artistKey] : raw["artist"];
    const streamsVal = mapping.streamsKey ? raw[mapping.streamsKey] : raw["streams"];
    const weekVal = mapping.weekKey ? raw[mapping.weekKey] : raw["week"];

    const artist = (artistVal ?? "").toString().trim();
    const streams = coerceNumber(streamsVal);
    const weekISO = coerceDateToISO(weekVal, opts?.weekFormat);

    // Only process rows that have required fields
    if (artist && streams !== null && weekISO) {
      const row: NormalizedRow = {
        artist,
        streams,
        week: weekISO,
      };
      rows.push(row);
    } else {
      // Skip rows missing required data
      const missing = [];
      if (!artist) missing.push("artist");
      if (streams === null) missing.push("streams");
      if (!weekISO) missing.push("week");
      warnings.push(`Skipped row missing: ${missing.join(", ")}`);
    }
  }

  return {
    included: rows,
    excluded: [],
    warnings,
    headerMapping: mapping,
  };
}

export function applyWeekStartToMissing(rows: NormalizedRow[], weekStartISO?: string): NormalizedRow[] {
  if (!weekStartISO) return rows;
  return rows.map(r => ({ ...r, week: r.week || weekStartISO }));
}
