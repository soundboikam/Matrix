"use client";

import { useState } from "react";
import { parseCsvFile, applyWeekStartToMissing } from "@/lib/csv/parseCsv";
import CsvPreviewTable from "@/components/csv/CsvPreviewTable";
import type { NormalizedRow } from "@/lib/csv/headerMap";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [region, setRegion] = useState<"US" | "EU">("US");
  const [weekFormat, setWeekFormat] = useState<string>("MM/dd/yyyy"); // UI hint
  const [weekStart, setWeekStart] = useState<string>(""); // yyyy-MM-dd from input
  const [preview, setPreview] = useState<NormalizedRow[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const handleFile = (f: File | null) => {
    setFile(f);
    setPreview(null);
    setWarnings([]);
  };

  async function onParse() {
    if (!file) return;
    setBusy(true);
    try {
      const result = await parseCsvFile(file, { weekFormat });
      // If week column missing, use weekStart input:
      const withWeek = applyWeekStartToMissing(result.included, weekStart || undefined);
      setPreview(withWeek);
      setWarnings(result.warnings);
    } catch (e: any) {
      setWarnings([e?.message || "Failed to parse CSV."]);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function onImport() {
    if (!preview || preview.length === 0) return;
    // POST to your existing import API endpoint
    await fetch("/api/import/streams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: preview, region }),
    }).then(async (r) => {
      if (!r.ok) {
        const t = await r.text();
        alert("Import failed: " + t);
      } else {
        alert("Imported successfully");
        setPreview(null);
        setFile(null);
        (document.getElementById("csv-input") as HTMLInputElement | null)?.value && ((document.getElementById("csv-input") as HTMLInputElement).value = "");
      }
    });
  }

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">Import weekly CSV</h1>
      <p className="text-sm text-gray-400">
        We auto-detect common Music Connect headers. If your CSV has no date column, set a Week Start.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          id="csv-input"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          className="block text-sm"
        />

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as any)}
          className="rounded bg-black border border-gray-700 px-2 py-1 text-sm"
        >
          <option value="US">US</option>
          <option value="EU">EU</option>
        </select>

        <input
          type="text"
          value={weekFormat}
          onChange={(e) => setWeekFormat(e.target.value)}
          className="rounded bg-black border border-gray-700 px-2 py-1 text-sm w-40"
          placeholder="MM/dd/yyyy"
          title="Expected week/date format in CSV"
        />

        <input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
          className="rounded bg-black border border-gray-700 px-2 py-1 text-sm"
        />

        <button
          onClick={onParse}
          disabled={!file || busy}
          className="rounded bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-sm"
        >
          {busy ? "Parsing..." : "Preview"}
        </button>

        <button
          onClick={onImport}
          disabled={!preview || preview.length === 0}
          className="rounded bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-sm"
        >
          Import to Database
        </button>
      </div>

      {warnings.length > 0 && (
        <div className="text-xs text-yellow-300 space-y-1">
          {warnings.map((w, i) => (
            <div key={i}>• {w}</div>
          ))}
        </div>
      )}

      {preview && <CsvPreviewTable initial={preview} />}
    </div>
  );
}