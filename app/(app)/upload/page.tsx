// app/(app)/upload/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

type PreviewRow = { artist?: string; streams?: number | null; week?: string | null };

const norm = (s: string) =>
  s.toLowerCase().trim().replace(/\u00a0/g, " ").replace(/[\s\-]+/g, "_");

const asNumber = (v: any): number | null => {
  if (v == null) return null;
  const s = String(v).replace(/,/g, "").trim();
  if (s === "" || s === "—" || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// Candidate lists for flexible header matching
const ARTIST_KEYS = [
  "artist",
  "artist_name",
  "name",
  "artistid", // sometimes exported
  "artist_id",
];
const STREAMS_KEYS = [
  "streams",
  "total_streams",
  "this_week",
  "streams_this_week",
  "plays",
  "plays_this_week",
  "weekly_streams",
];
const WEEK_KEYS = ["week", "date", "week_start", "week_commencing", "week_of"];

function pick(row: Record<string, any>, candidates: string[]) {
  for (const c of candidates) {
    const want = norm(c);
    for (const k of Object.keys(row)) {
      if (norm(k) === want) return row[k];
    }
  }
  return undefined;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [weekStart, setWeekStart] = useState<string>("");
  const [dataType, setDataType] = useState<"US" | "GLOBAL">("US");
  const [rows, setRows] = useState<any[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [parsing, setParsing] = useState(false);

  // Parse CSV on file change
  useEffect(() => {
    if (!file) {
      setRows([]);
      return;
    }
    setParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const items = Array.isArray(res.data) ? (res.data as any[]) : [];
        setRows(items);
        setExcluded(new Set());
        setParsing(false);
      },
      error: () => {
      setRows([]);
      setParsing(false);
      },
    });
  }, [file]);

  const previewRows: PreviewRow[] = useMemo(() => {
    return rows.slice(0, 25).map((raw) => {
      const artist = pick(raw, ARTIST_KEYS) ?? "";
      const dateVal = pick(raw, WEEK_KEYS);
      const streamsVal = pick(raw, STREAMS_KEYS);

      const week = (dateVal ? String(dateVal) : weekStart) || null;
      const streams = asNumber(streamsVal);

      return {
        artist: artist ? String(artist) : "",
        streams: streams ?? null,
        week,
      };
    });
  }, [rows, weekStart]);

  const includedCount = useMemo(() => rows.length - excluded.size, [rows.length, excluded]);

  function toggleExclude(idx: number) {
    const next = new Set(excluded);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setExcluded(next);
  }

  async function handleImport() {
    if (!file) return;
    // Build a filtered array for upload (respect excludes)
    const filtered = rows
      .map((raw, idx) => ({ raw, idx }))
      .filter((x) => !excluded.has(x.idx))
      .map((x) => x.raw);

   const payload = {
      dataType, // "US" | "GLOBAL"
      weekStart: weekStart || null,
      rows: filtered,
    };

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      alert(out?.error || "Import failed");
    } else {
      alert(`Imported: ${out?.created ?? 0}, skipped: ${out?.skipped ?? 0}`);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="h1">Import weekly CSV</h1>

      <p className="text-sm text-zinc-400">
        We auto-detect common Music Connect headers. If your CSV has no date column, set a Week Start.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm"
        />

        <span className="text-sm text-zinc-400">Data type:</span>
        <select
          value={dataType}
          onChange={(e) => setDataType(e.target.value as "US" | "GLOBAL")}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
        >
          <option value="US">US</option>
          <option value="GLOBAL">Global</option>
        </select>

        <span className="text-sm text-zinc-400">Week start</span>
        <input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
          className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
        />

        <button
          onClick={handleImport}
          className="ml-auto rounded-md bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-500"
          disabled={!rows.length || parsing}
        >
          Import to Database
        </button>
      </div>

      <div className="text-sm text-zinc-400">
        Rows in file: <span className="text-zinc-200">{rows.length}</span> · Included:{" "}
        <span className="text-zinc-200">{includedCount}</span> · Excluded:{" "}
        <span className="text-zinc-200">{excluded.size}</span>
      </div>

      <div className="rounded-md border border-zinc-800">
        <div className="border-b border-zinc-800 px-3 py-2 text-sm text-zinc-400">
          Preview (click <span className="text-red-400 font-semibold">✕</span> to exclude a row; click again to restore)
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/40 text-zinc-400">
                <th className="w-10 px-2 py-2 text-left"> </th>
                <th className="px-3 py-2 text-left">Artist</th>
                <th className="px-3 py-2 text-left">Streams</th>
                <th className="px-3 py-2 text-left">Week</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((r, i) => {
                const rowIndex = i; // preview index (0..25); exclude includes actual index mapping below
                const excludedFlag = excluded.has(i);
                return (
                  <tr key={i} className="border-t border-zinc-800">
                    <td className="px-2 py-2">
                      <button
                        className={`rounded-md border px-2 py-1 ${
                          excludedFlag
                            ? "border-zinc-700 text-zinc-500"
                            : "border-red-500 text-red-400 hover:bg-red-500/10"
                        }`}
                        title={excludedFlag ? "Restore row" : "Exclude row"}
                        onClick={() => toggleExclude(rowIndex)}
                      >
                        ✕
                      </button>
                    </td>
                    <td className="px-3 py-2 text-zinc-200">{r.artist || "—"}</td>
                    <td className="px-3 py-2 text-zinc-200">
                      {r.streams == null ? "—" : r.streams.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-zinc-200">{r.week || "—"}</td>
                  </tr>
                );
              })}
              {!previewRows.length && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-zinc-500">
                    {parsing
                      ? "Parsing CSV…"
                      : "Select a CSV to preview. If your file has no date column, set the Week Start above."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


