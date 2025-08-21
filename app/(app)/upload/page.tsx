// app/(app)/upload/page.tsx
"use client";

import React from "react";
import Papa from "papaparse";

type PreviewRow = {
  artist?: string;
  streams?: number | null;
  week?: string | null;
  _raw?: Record<string, any>;
};

const norm = (s: string) =>
  s.toLowerCase().trim().replace(/[\s\-\/]+/g, "_").replace(/[^\w]/g, "");

const ARTIST_HEADERS = [
  "artist",
  "artist_name",
  "name",
  "track_artist", // sometimes MC exports are weird
  "artistid",
  "artist_id",
  "performer",
  "title",
  "track",
  "song",
];
const STREAMS_HEADERS = [
  "streams",
  "total_streams",
  "weekly_streams",
  "this_week",
  "week_streams",
  "count",
  "plays",
  "plays_this_week",
  "streams_this_week",
  "this_week_streams",
  "streams_count",
  "total",
  "volume",
];
const DATE_HEADERS = [
  "week",
  "week_start",
  "date",
  "report_date",
  "collection_week",
  "week_of",
  "week_start_date",
  "start_date",
  "period",
  "reporting_period",
];

function pick(row: Record<string, any>, candidates: string[]) {
  for (const c of candidates) {
    const want = norm(c);
    for (const k of Object.keys(row)) {
      if (norm(k) === want) return row[k];
    }
  }
  return undefined;
}

function tryParseNumber(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v
      .replace(/\uFEFF/g, "") // BOM
      .replace(/,/g, "") // 1,234
      .replace(/\s+/g, "")
      .replace(/[^\d.\-]/g, ""); // strip other junk
    if (cleaned === "" || cleaned === "-" || cleaned === "—") return null;
    const n = Number(cleaned);
   return Number.isFinite(n) ? n : null;
  }
  return null;
}

function tryParseDateStr(v: any): string | null {
  if (!v || typeof v !== "string") return null;
  const s = v.trim().replace(/\uFEFF/g, "");
  if (!s) return null;
  // Let server validate; here only normalize simple cases:
  // Accept MM/DD/YYYY, YYYY-MM-DD, etc. Keep original string;
  // server will coerce to ISO week start.
  return s;
}

export default function UploadPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [dataType, setDataType] = React.useState<"US" | "Global">("US");
  const [weekStart, setWeekStart] = React.useState<string>("");
  const [rows, setRows] = React.useState<PreviewRow[]>([]);
  const [excluded, setExcluded] = React.useState<Set<number>>(new Set());
  const [info, setInfo] = React.useState<{ total: number; included: number; excluded: number }>({ total: 0, included: 0, excluded: 0 });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setRows([]);
    setExcluded(new Set());
    setInfo({ total: 0, included: 0, excluded: 0 });
    setError(null);
    if (f) parsePreview(f);
  }

  function parsePreview(f: File) {
    setLoading(true);
    setError(null);

    // Some Excel CSVs have BOM, weird delimiters; let Papa try,
    // but also provide fallback delimiter auto-detection.
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (h) => h.replace(/\uFEFF/g, ""), // strip BOM in header
      complete: (res) => {
        const raw = (res.data as any[]) ?? [];
        console.log("Raw CSV data:", raw.slice(0, 3)); // Debug: show first 3 rows
        
        const preview: PreviewRow[] = raw.map((r, index) => {
          // normalize keys strip BOM in values too
          const cleaned: Record<string, any> = {};
          for (const [k, v] of Object.entries(r)) {
            cleaned[k] = typeof v === "string" ? v.replace(/\uFEFF/g, "") : v;
          }
          
          if (index < 3) {
            console.log(`Row ${index} cleaned:`, cleaned); // Debug: show first 3 cleaned rows
            console.log(`Row ${index} keys:`, Object.keys(cleaned)); // Debug: show available keys
          }
          
          const artist = pick(cleaned, ARTIST_HEADERS);
          const streams = tryParseNumber(pick(cleaned, STREAMS_HEADERS));
          const dateStr = pick(cleaned, DATE_HEADERS);
          const week = dateStr ? tryParseDateStr(dateStr) : null;
          
          if (index < 3) {
            console.log(`Row ${index} parsed:`, { artist, streams, dateStr, week }); // Debug: show parsing results
          }
          
          return {
            artist: artist ? String(artist).trim() : undefined,
            streams: streams,
            week,
            _raw: cleaned,
          };
        });

        setRows(preview);
        setInfo({
          total: preview.length,
          included: preview.length,
          excluded: 0,
        });
        setLoading(false);
      },
      error: (err) => {
        setLoading(false);
        setError(err?.message || "Failed to parse CSV");
      },
    });
  }

  function toggleExclude(ix: number) {
    const next = new Set(excluded);
    if (next.has(ix)) next.delete(ix);
    else next.add(ix);
    setExcluded(next);
    setInfo((old) => ({
      total: old.total,
      included: old.total - next.size,
      excluded: next.size,
    }));
  }

  async function handleImport() {
    setLoading(true);
    setError(null);
    try {
      const includedRows = rows
        .map((r, ix) => ({ ...r, _ix: ix }))
        .filter((r) => !excluded.has(r._ix))
        .map((r) => ({ artist: r.artist, streams: r.streams, week: r.week }));

      if (!includedRows.length) {
        setLoading(false);
        setError("No rows selected to import.");
        return;
      }

      // If none of the rows have a week value, require a weekStart selection
      const anyWeekInFile = includedRows.some((r) => r.week);
      if (!anyWeekInFile && !weekStart) {
        setLoading(false);
        setError("Your CSV has no date column. Please select Week start before importing.");
        return;
      }

      const body = {
        dataType,
        weekStart: weekStart || null,
        rows: includedRows,
      };

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Upload failed");
      alert(`Imported: ${json?.created ?? 0}, Skipped: ${json?.skipped ?? 0}`);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="h1 mb-6">Import weekly CSV</h1>
      <p className="text-zinc-400 mb-4">
        We auto-detect common Music Connect headers. If your CSV has no date column, set a Week Start.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input type="file" accept=".csv,text/csv" onChange={handleFileChange} className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2" />

        {/* Data type: US / Global */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-300">Data type:</label>
          <select
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            value={dataType}
            onChange={(e) => setDataType(e.target.value as any)}
          >
            <option value="US">US</option>
            <option value="Global">Global</option>
          </select>
        </div>

        {/* Week start (optional if CSV has a date) */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-300">Week start</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
          />
        </div>

        <button
          disabled={!rows.length || loading}
          onClick={handleImport}
          className="ml-auto rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 px-4 py-2 text-sm font-medium"
        >
          {loading ? "Importing..." : "Import to Database"}
        </button>
      </div>

      <div className="text-sm text-zinc-400 mb-2">
        Rows in file: <b>{info.total}</b> · Included: <b>{info.included}</b> · Excluded: <b>{info.excluded}</b>
      </div>

      {/* Debug info - show detected headers */}
      {rows.length > 0 && (
        <div className="mb-3 rounded border border-zinc-700 bg-zinc-800/40 px-3 py-2 text-xs">
          <div className="font-medium text-zinc-300 mb-1">Detected Headers:</div>
          <div className="text-zinc-400">
            <div>Available columns: {Object.keys(rows[0]?._raw || {}).join(", ")}</div>
            <div>Artist detected from: {rows[0]?._raw ? Object.keys(rows[0]._raw).find(k => 
              ARTIST_HEADERS.some(h => norm(h) === norm(k))
            ) || "none" : "none"}</div>
            <div>Streams detected from: {rows[0]?._raw ? Object.keys(rows[0]._raw).find(k => 
              STREAMS_HEADERS.some(h => norm(h) === norm(k))
            ) || "none" : "none"}</div>
            <div>Date detected from: {rows[0]?._raw ? Object.keys(rows[0]._raw).find(k => 
              DATE_HEADERS.some(h => norm(h) === norm(k))
            ) || "none" : "none"}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 rounded border border-red-800 bg-red-950/40 px-3 py-2 text-red-300">
          {error}
        </div>
      )}

      <div className="rounded border border-zinc-800 bg-zinc-900">
        <div className="px-3 py-2 text-sm text-zinc-400">
          Preview (click <span className="text-red-400">✖</span> to exclude a row)
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-950/60">
              <tr>
                <th className="w-10 px-2 py-2"></th>
                <th className="px-3 py-2 text-left">Artist</th>
                <th className="px-3 py-2 text-left">Streams</th>
                <th className="px-3 py-2 text-left">Week</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ix) => {
                const isEx = excluded.has(ix);
                return (
                  <tr key={ix} className={isEx ? "opacity-50" : ""}>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => toggleExclude(ix)}
                        className={`h-6 w-6 rounded border px-0 text-center ${
                          isEx ? "border-emerald-500 text-emerald-400" : "border-red-500 text-red-400"
                        }`}
                        title={isEx ? "Restore row" : "Exclude row"}
                      >
                        {isEx ? "↩" : "✖"}
                      </button>
                    </td>
                    <td className="px-3 py-2">{r.artist ?? "—"}</td>
                    <td className="px-3 py-2">{r.streams != null ? r.streams.toLocaleString() : "—"}</td>
                    <td className="px-3 py-2">{r.week ?? (weekStart ? `(will use ${weekStart})` : "—")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


