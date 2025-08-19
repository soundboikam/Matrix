"use client";

import React from "react";
import Papa from "papaparse";

type PreviewRow = {
  artist?: string;
  streams?: number;
  week?: string; // ISO (yyyy-mm-dd)
};

function norm(s: string) {
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\u00A0/g, " ") // non-breaking space -> space
    .replace(/[^\w]+/g, "_") // collapse to underscores
    .replace(/^_+|_+$/g, "");
}

function pick(row: Record<string, any>, candidates: string[]): any {
  for (const c of candidates) {
    const want = norm(c);
    for (const k of Object.keys(row)) {
      if (norm(k) === want) return row[k];
    }
  }
  return undefined;
}

function toNumber(val: any): number | undefined {
  if (val == null) return undefined;
  const s = String(val).replace(/[, ]/g, "");
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function toISODate(val: any): string | undefined {
  if (!val) return undefined;
  // Accept already-ISO or mm/dd/yyyy style
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const mm = m[1].padStart(2, "0");
    const dd = m[2].padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }
  // Final fallback: Date()
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return undefined;
}

export default function UploadPage() {
  const [fileName, setFileName] = React.useState("");
  const [weekStart, setWeekStart] = React.useState("");
  const [dataType, setDataType] = React.useState<"US" | "Global">("US");
  const [rows, setRows] = React.useState<PreviewRow[]>([]);
  const [excluded, setExcluded] = React.useState<Set<number>>(new Set());
  const [parsingMsg, setParsingMsg] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const includedCount = rows.reduce(
    (acc, _r, idx) => acc + (excluded.has(idx) ? 0 : 1),
    0
  );

  function parseCsv(file: File) {
    setParsingMsg("Parsing…");
    setRows([]);
    setExcluded(new Set());

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      dynamicTyping: false,
      transformHeader: (h) => h, // keep original; we normalize during pick()
      complete: (result) => {
        try {
          const rawRows: any[] = Array.isArray(result.data) ? result.data : [];
          const out: PreviewRow[] = [];

          for (const r of rawRows) {
            // Try a wide set of common header variants
            const artist =
              pick(r, ["artist", "artist_name", "name", "artist_title"]) ??
              undefined;

            const streamsRaw =
              pick(r, [
                "streams",
                "total_streams",
                "weekly_streams",
                "streams_this_week",
                "this_week_streams",
                "streams_count",
              ]) ?? pick(r, ["streams_us", "streams_global"]); // last-ditch

            const weekRaw =
              pick(r, [
                "week",
                "week_start",
                "date",
                "week_of",
                "week_start_date",
                "start_date",
              ]) ?? undefined;

            const clean: PreviewRow = {
              artist: artist ? String(artist).trim() : undefined,
              streams: toNumber(streamsRaw),
              week: toISODate(weekRaw),
            };

            // Ignore completely empty lines
            if (
              (clean.artist && clean.artist.length > 0) ||
              clean.streams != null ||
              clean.week != null
            ) {
              out.push(clean);
            }
          }

          setRows(out);
          setParsingMsg(null);
        } catch (e: any) {
          setParsingMsg(e?.message || "Failed to parse CSV.");
        }
      },
      error: (err) => {
        setParsingMsg(err?.message || "CSV parse error.");
      },
    });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    parseCsv(f);
  }

  function toggleExclude(i: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function doImport() {
    setBusy(true);
    try {
      // If week not in rows, use top-level weekStart input as default
      const payload = rows
        .map((r, i) => ({ ...r, __i: i }))
        .filter((r) => !excluded.has(r.__i))
        .map((r) => ({
          artist: r.artist || "",
          streams: r.streams ?? 0,
          week: r.week || weekStart || "",
        }))
        .filter((r) => r.artist && r.streams && r.week);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataType, // "US" | "Global"
          rows: payload,
        }),
      });

      const j = await res.json();
      if (!res.ok) {
        alert(j?.error || "Import failed");
      } else {
        alert(`Imported ${j?.created ?? 0} rows. Skipped ${j?.skipped ?? 0}.`);
      }
    } catch (e: any) {
      alert(e?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">Import weekly CSV</h1>

      <p className="text-sm text-zinc-400 mb-4">
        We auto-detect common Music Connect headers. If your CSV has no date
        column, set a Week Start.
      </p>

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <label className="inline-block">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="hidden"
          />
          <span className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded cursor-pointer">
            Choose File
          </span>
        </label>

        <span className="text-sm text-zinc-300">{fileName}</span>

        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Data type:</span>
          <select
            className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-sm"
            value={dataType}
            onChange={(e) =>
              setDataType(e.target.value === "Global" ? "Global" : "US")
            }
          >
            <option value="US">US</option>
            <option value="Global">Global</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Week start</span>
          <input
            type="date"
            className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-sm"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
          />
        </div>

        <button
          onClick={doImport}
          disabled={busy || rows.length === 0}
          className={`px-4 py-2 rounded ${
            busy || rows.length === 0
              ? "bg-zinc-700 text-zinc-400"
              : "bg-emerald-600 hover:bg-emerald-500"
          }`}
        >
          {busy ? "Importing…" : "Import to Database"}
        </button>
      </div>

      <div className="text-sm text-zinc-400 mb-3">
        Rows in file: <b>{rows.length}</b> · Included: <b>{includedCount}</b> ·
        Excluded: <b>{rows.length - includedCount}</b>
      </div>

      <div className="text-sm text-zinc-400 mb-2">
        Preview (click <span className="text-red-400 font-semibold">✖</span> to
        exclude a row; click <span className="text-blue-400 font-semibold">↩</span>{" "}
        to restore)
      </div>

      {parsingMsg && (
        <div className="mb-3 text-amber-400 text-sm">{parsingMsg}</div>
      )}

      <div className="border border-zinc-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-300">
            <tr>
              <th className="w-12 px-3 py-2 text-left"> </th>
              <th className="px-3 py-2 text-left">Artist</th>
              <th className="px-3 py-2 text-right">Streams</th>
              <th className="px-3 py-2 text-left">Week</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isExcluded = excluded.has(i);
              return (
                <tr
                  key={i}
                  className={isExcluded ? "opacity-40 bg-zinc-950" : ""}
                >
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleExclude(i)}
                      className={`h-7 w-7 rounded border ${
                        isExcluded
                          ? "border-blue-500 text-blue-400"
                          : "border-red-500 text-red-400"
                      }`}
                      title={isExcluded ? "Restore row" : "Exclude row"}
                    >
                      {isExcluded ? "↩" : "✖"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-zinc-200">{r.artist ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {r.streams != null ? r.streams.toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-300">{r.week ?? "—"}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-8 text-center text-zinc-500" colSpan={4}>
                  No rows parsed yet. Choose a CSV file above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


