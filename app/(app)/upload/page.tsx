// app/(app)/upload/page.tsx
"use client";
import React, { useState } from "react";
import { parseCsv, type ParsedRow } from "@/utils/parseCsv";

export default function UploadPage() {
  const [previewRows, setPreviewRows] = useState<ParsedRow[]>([]);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [weekStart, setWeekStart] = useState("");
  const [dataType, setDataType] = useState<"US" | "GLOBAL">("US");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const includedCount = previewRows.length - excluded.size;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setMsg("");
    setExcluded(new Set());
    if (!f) {
      setPreviewRows([]);
      return;
    }
    const text = await f.text();
    const rows = await parseCsv(text);
    setPreviewRows(rows);
  }

  function toggleExclude(i: number) {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  async function handleImport() {
    if (!file) {
      setMsg("Please choose a CSV file first.");
      return;
    }
    setLoading(true);
    setMsg("");
    const form = new FormData();
    form.append("file", file);
    if (weekStart) form.append("weekStart", weekStart);
    form.append("dataType", dataType);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Import failed");
      setMsg(`Imported: ${json.created} | Skipped: ${json.skipped} (source: ${json.source})`);
    } catch (err: any) {
      setMsg(err?.message ?? "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Import weekly CSV</h1>
      <div className="flex items-center gap-3 flex-wrap">
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <select
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
          value={dataType}
          onChange={(e) => setDataType(e.target.value as "US" | "GLOBAL")}
        >
          <option value="US">US</option>
          <option value="GLOBAL">GLOBAL</option>
        </select>
        <input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
          placeholder="Week start"
        />
        <button
          onClick={handleImport}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-medium px-3 py-2 rounded"
        >
          {loading ? "Importing…" : "Import to Database"}
        </button>
      </div>

      {msg && (
        <div className="text-sm mt-2">
          {msg.toLowerCase().includes("imported") ? (
            <span className="text-emerald-400">{msg}</span>
          ) : (
            <span className="text-red-400">{msg}</span>
          )}
        </div>
      )}

      <div className="text-sm text-zinc-400">
        Rows in file: <b>{previewRows.length}</b> · Included: <b>{includedCount}</b> · Excluded: <b>{excluded.size}</b>
      </div>

      <div className="overflow-auto border border-zinc-800 rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-300">
              <th className="text-left px-2 py-2">Action</th>
              <th className="text-left px-3 py-2">Artist</th>
              <th className="text-left px-3 py-2">Streams</th>
              <th className="text-left px-3 py-2">Week (CSV)</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((r, i) => {
              const isExcluded = excluded.has(i);
              return (
                <tr key={i} className={`border-t border-zinc-800 ${isExcluded ? "opacity-40" : ""}`}>
                  <td className="px-2">
                    <button
                      type="button"
                      onClick={() => toggleExclude(i)}
                      className={`inline-flex items-center justify-center w-7 h-7 rounded border ${
                        isExcluded ? "border-sky-500 text-sky-400" : "border-red-500 text-red-400"
                      }`}
                      title={isExcluded ? "Restore this row" : "Exclude this row"}
                    >
                      {isExcluded ? "↩" : "✕"}
                    </button>
                  </td>
                  <td className="px-3 py-2">{r.artist || "—"}</td>
                  <td className="px-3 py-2">{Number.isFinite(r.streams) ? r.streams.toLocaleString() : "—"}</td>
                  <td className="px-3 py-2">{r.week ?? "—"}</td>
                </tr>
              );
            })}
            {!previewRows.length && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-zinc-500">
                  No preview yet — choose a CSV above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


