"use client";

import React, { useMemo, useState } from "react";
import Papa from "papaparse";

type PreviewRow = {
  __idx: number;
  artist?: string;
  streams?: string | number;
  week?: string;
};

const norm = (s: string) => s.toLowerCase().trim().replace(/[\s\-]+/g, "_");
const pick = (row: Record<string, any>, candidates: string[]) => {
  for (const c of candidates) {
    const want = norm(c);
    for (const k of Object.keys(row)) {
      if (norm(k) === want) return row[k];
    }
  }
  return undefined;
};

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [weekStart, setWeekStart] = useState("");
  const [region, setRegion] = useState<"US" | "Global">("US");
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const includedCount = useMemo(
    () => rows.filter((r) => !excluded.has(r.__idx)).length,
    [rows, excluded]
  );

  function onFileChange(f: File | null) {
    setFile(f);
    setExcluded(new Set());
    setRows([]);
    if (!f) return;

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const raw = res.data as Array<Record<string, any>>;
        // detect banner line "Favorite Artists,,,": if first row values are all empty, skip first header
        // (Papa has already used the first row as header, so we’re good.)
        const mapped = raw.map((row, i) => {
          const artist =
            pick(row, ["artist_name", "artist", "artistname", "name", "artist name"]) ??
            "";
          const streams =
            pick(row, [
              "streams",
              "on_demand_audio_streams",
              "on-demand_audio_streams",
              "on-demand audio streams",
              "audio_streams",
              "on_demand_streams",
              "on demand audio streams",
            ]) ?? "";
          const week =
            pick(row, ["week_start", "week", "week_of", "start_date", "date"]) ?? "";
          return { __idx: i, artist: String(artist).trim(), streams, week };
        });
        setRows(mapped);
      },
      error: () => setRows([]),
    });
  }

  function toggleExclude(idx: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  async function onImport() {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (weekStart) fd.append("weekStart", weekStart);
      fd.append("region", region);
      // send excluded indices (so server skips them)
      if (excluded.size > 0) {
        fd.append("exclude", JSON.stringify(Array.from(excluded)));
      }

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        alert(json?.error ?? "Upload failed");
      } else {
        alert(
          `Imported! Created: ${json.created} • Skipped: ${json.skipped} • In file: ${json.rows_in_file}`
        );
        setRows([]);
        setExcluded(new Set());
        setFile(null);
        setWeekStart("");
      }
    } catch (e) {
      alert("Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Import weekly CSV</h1>
      <p className="text-sm text-zinc-400 mb-4">
        We auto-detect common Music Connect headers. If your CSV has no date column, set a Week
        Start.
      </p>

      <div className="flex gap-3 items-center mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          className="block text-sm"
        />

        {/* REGION SELECTOR */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-300">Data type:</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as "US" | "Global")}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
          >
            <option value="US">US</option>
            <option value="Global">Global</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-300">Week start</label>
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
          />
        </div>

        <button
          disabled={!file || busy}
          onClick={onImport}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 rounded px-3 py-2 text-sm"
        >
          {busy ? "Importing…" : "Import to Database"}
        </button>
      </div>

      <div className="text-sm text-zinc-400 mb-2">
        Rows in file: <span className="text-zinc-200">{rows.length}</span> · Included:{" "}
        <span className="text-zinc-200">{includedCount}</span> · Excluded:{" "}
        <span className="text-zinc-200">{rows.length - includedCount}</span>
      </div>

      <div className="border border-zinc-800 rounded overflow-hidden">
        <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-800">
          Preview (click ❌ to exclude a row; click 🔁 to restore)
        </div>
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/50">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left text-zinc-400 text-xs border-b border-zinc-800">
              <th style={{ width: 48 }}></th>
              <th>Artist</th>
              <th style={{ width: 160 }}>Streams</th>
              <th style={{ width: 160 }}>Week</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isExcluded = excluded.has(r.__idx);
              return (
                <tr
                  key={r.__idx}
                  className={`border-b border-zinc-800 ${
                    isExcluded ? "opacity-40 bg-zinc-900/30" : ""
                  }`}
                >
                  <td className="px-3 py-2">
                    <button
                      title={isExcluded ? "Restore" : "Exclude"}
                      onClick={() => toggleExclude(r.__idx)}
                      className={`text-xs px-2 py-1 rounded border ${
                        isExcluded
                          ? "border-sky-500 text-sky-300"
                          : "border-red-500 text-red-300"
                      }`}
                    >
                      {isExcluded ? "🔁" : "❌"}
                    </button>
                  </td>
                  <td className="px-3 py-2">{r.artist ?? "—"}</td>
                  <td className="px-3 py-2">
                    {typeof r.streams === "number" ? r.streams.toLocaleString() : String(r.streams ?? "—")}
                  </td>
                  <td className="px-3 py-2">{r.week ? String(r.week) : "—"}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-zinc-500">
                  Select a CSV to preview rows.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
