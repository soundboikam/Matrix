"use client";

import React from "react";
import Papa from "papaparse";
import { mutate } from "swr";

type PreviewRow = {
  artist?: string;
  streams?: number | string;
  week?: string;
  _excluded?: boolean;
};

const norm = (s: string) =>
  s?.toString().toLowerCase().trim().replace(/[\s\-\/]+/g, "_");

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
  const [file, setFile] = React.useState<File | null>(null);
  const [weekStart, setWeekStart] = React.useState<string>("");
  const [dataType, setDataType] = React.useState<"US" | "GLOBAL">("US");
  const [rows, setRows] = React.useState<PreviewRow[]>([]);
  const [meta, setMeta] = React.useState({ total: 0, included: 0, excluded: 0 });
  const [busy, setBusy] = React.useState(false);

  function parseFile(f: File) {
    setRows([]);
    setMeta({ total: 0, included: 0, excluded: 0 });

    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => norm(h),
      complete: (res) => {
        const raw: Record<string, any>[] = (res.data as any[]) ?? [];
        const mapped: PreviewRow[] = raw.map((r) => {
          // tolerant column picks
          const artist = pick(r, [
            "artist",
            "artist_name",
            "name",
            "artistname",
            "recording_artist",
          ]);

          // streams can be "streams", "this_week", "units", etc.
          let streams = pick(r, [
            "streams",
            "this_week",
            "thisweek",
            "weekly_streams",
            "units",
            "total_streams",
          ]);

          // coerce to number if possible
          if (streams !== undefined && streams !== null) {
            const n = Number(
              String(streams).replace(/[, ]+/g, "").replace(/[^\d.-]/g, "")
            );
            streams = Number.isFinite(n) ? n : streams;
          }

          const week =
            weekStart ||
            pick(r, ["week", "week_start", "week_of", "date", "week_start_date"]);

          return { artist: artist?.toString() ?? "", streams, week };
        });

        const trimmed = mapped.filter(
          (r) => r.artist && (r.streams !== undefined || r.week)
        );

        setRows(trimmed);
        setMeta({
          total: mapped.length,
          included: trimmed.length,
          excluded: mapped.length - trimmed.length,
        });
      },
    });
  }

  function toggleExclude(i: number) {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], _excluded: !next[i]._excluded };
      const included = next.filter((r) => !r._excluded).length;
      setMeta({ total: prev.length, included, excluded: prev.length - included });
      return next;
    });
  }

  async function doImport() {
    if (!file) return;
    setBusy(true);
    try {
      const payload = {
        dataType,
        weekStart: weekStart || null,
        rows: rows.filter((r) => !r._excluded),
      };
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Import failed");
      alert("Import complete");
      // Update stats after successful import
      mutate("/api/stats");
    } catch (e: any) {
      alert(e.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Import weekly CSV</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setFile(f);
            if (f) parseFile(f);
          }}
        />
        <select
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
          value={dataType}
          onChange={(e) => setDataType(e.target.value as any)}
        >
          <option value="US">US</option>
          <option value="GLOBAL">Global</option>
        </select>
        <input
          type="date"
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
        />
        <button
          disabled={!rows.length || busy}
          onClick={doImport}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded px-3 py-1"
        >
          {busy ? "Importing…" : "Import to Database"}
        </button>
      </div>

      <div className="text-sm text-zinc-400">
        Rows in file: <b>{meta.total}</b> · Included: <b>{meta.included}</b> ·
        Excluded: <b>{meta.excluded}</b>
      </div>

      <div className="overflow-auto border border-zinc-800 rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-900/60 border-b border-zinc-800">
            <tr>
              <th className="px-3 py-2 w-10"></th>
              <th className="px-3 py-2 text-left">Artist</th>
              <th className="px-3 py-2 text-right">Streams</th>
              <th className="px-3 py-2 text-left">Week</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={`border-b border-zinc-800 ${
                  r._excluded ? "opacity-50" : ""
                }`}
              >
                <td className="px-3 py-2">
                  <button
                    aria-label={r._excluded ? "Restore" : "Exclude"}
                    onClick={() => toggleExclude(i)}
                    className={`px-2 py-1 rounded border ${
                      r._excluded
                        ? "border-sky-400 text-sky-300"
                        : "border-rose-400 text-rose-300"
                    }`}
                  >
                    {r._excluded ? "↩" : "✕"}
                  </button>
                </td>
                <td className="px-3 py-2">{r.artist || "—"}</td>
                <td className="px-3 py-2 text-right">
                  {typeof r.streams === "number"
                    ? r.streams.toLocaleString()
                    : r.streams || "—"}
                </td>
                <td className="px-3 py-2">
                  {r.week ? String(r.week) : weekStart || "—"}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-zinc-500">
                  Choose a CSV to preview…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


