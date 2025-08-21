// app/(app)/upload/page.tsx
"use client";
import React, { useState } from "react";
import { parseCsv, type ParsedRow } from "@/utils/parseCsv";

export default function UploadPage() {
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [weekStart, setWeekStart] = useState<string>("");
  const [dataType, setDataType] = useState<"US" | "GLOBAL">("US");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg("");
    setFileName(file.name);
    const text = await file.text();
    const rows = await parseCsv(text);
    setPreview(rows);
  }

  async function handleImport() {
    if (!preview.length) {
      setMsg("Nothing to import.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: preview,
          weekStart,
          dataType,
          sourceFile: fileName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Import failed");
      setMsg(`Imported ${data.created ?? 0} rows successfully.`);
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
          placeholder="Week start"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1"
        />
        <button
          onClick={handleImport}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black font-medium px-3 py-2 rounded"
        >
          {loading ? "Importing…" : "Import to Database"}
        </button>
        {!!fileName && (
          <span className="text-sm text-zinc-400">File: {fileName}</span>
        )}
      </div>

      {!!msg && (
        <div className="text-sm">
          {msg.includes("success") ? (
            <span className="text-emerald-400">{msg}</span>
          ) : (
            <span className="text-red-400">{msg}</span>
          )}
        </div>
      )}

      <div className="text-sm text-zinc-400">
        Rows in file: <b>{preview.length}</b>
      </div>

      <div className="overflow-auto border border-zinc-800 rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-300">
              <th className="text-left px-3 py-2">Artist</th>
              <th className="text-left px-3 py-2">Streams</th>
              <th className="text-left px-3 py-2">Week (CSV)</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((r, i) => (
              <tr key={i} className="border-t border-zinc-800">
                <td className="px-3 py-2">{r.artist}</td>
                <td className="px-3 py-2">{r.streams.toLocaleString()}</td>
                <td className="px-3 py-2">{r.week ?? "—"}</td>
              </tr>
            ))}
            {!preview.length && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-zinc-500">
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


