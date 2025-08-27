"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseCsvFile, applyWeekStartToMissing } from "@/lib/csv/parseCsv";
import CsvPreviewTable from "@/components/csv/CsvPreviewTable";
import type { NormalizedRow } from "@/lib/csv/headerMap";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [region, setRegion] = useState<"US" | "EU">("US");
  // Store week start as ISO (yyyy-MM-dd) for type=date
  const [weekStartISO, setWeekStartISO] = useState<string>("");
  const [previewRows, setPreviewRows] = useState<NormalizedRow[] | null>(null);
  const [busy, setBusy] = useState(false);

  const dateRef = useRef<HTMLInputElement>(null);

  const canImport = useMemo(() => {
    if (!previewRows || previewRows.length === 0) return false;
    // Prevent import if any row still lacks week
    const missingWeek = previewRows.some(r => !r.week || r.week.trim() === "");
    if (missingWeek) return false;
    return !busy;
  }, [previewRows, busy]);

  const runParse = useCallback(async () => {
    if (!file) {
      setPreviewRows(null);
      return;
    }
    setBusy(true);
    try {
      // parseCsvFile auto-detects Music Connect + title/footer, returns rows (week may be missing)
      const res = await parseCsvFile(file, { weekFormat: "MM/dd/yyyy" });
      // Fill any missing weeks from the Week Start field
      const withWeek = applyWeekStartToMissing(res.included, weekStartISO || undefined);
      setPreviewRows(withWeek);
    } catch {
      setPreviewRows(null);
    } finally {
      setBusy(false);
    }
  }, [file, weekStartISO]);

  useEffect(() => {
    // re-parse whenever file changes or weekStart changes
    runParse();
  }, [runParse]);

  async function onImport() {
    if (!previewRows || previewRows.length === 0) return;
    await fetch("/api/import/streams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: previewRows, region }),
    }).then(async (r) => {
      if (!r.ok) {
        const t = await r.text();
        alert("Import failed: " + t);
      } else {
        alert("Imported successfully");
        setPreviewRows(null);
        setFile(null);
        setWeekStartISO("");
        const inp = document.getElementById("csv-input") as HTMLInputElement | null;
        if (inp) inp.value = "";
      }
    });
  }

  function openCalendar() {
    const el = dateRef.current;
    if (!el) return;
    // Chromium supports showPicker(); fallback to focus for others
    (el as any).showPicker ? (el as any).showPicker() : el.focus();
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
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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

        {/* Calendar input with icon */}
        <div className="relative">
          <input
            ref={dateRef}
            type="date"
            value={weekStartISO}
            onChange={(e) => setWeekStartISO(e.target.value)}
            className="rounded bg-black border border-gray-700 px-2 pr-9 py-1 text-sm"
            title="Week start date (used if your CSV lacks a date column)"
          />
          <button
            type="button"
            onClick={openCalendar}
            aria-label="Open calendar"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-80 hover:opacity-100"
          >
            {/* Inline calendar icon (no dependency) */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>
        </div>

        <button
          onClick={onImport}
          disabled={!canImport}
          className="rounded bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {busy ? "Working..." : "Import to Database"}
        </button>
      </div>

      {previewRows && <CsvPreviewTable initial={previewRows} />}

      {/* Optional: subtle hint if week is missing */}
      {previewRows && previewRows.some(r => !r.week) && (
        <div className="text-xs text-yellow-300">
          Some rows are missing a date. Set <span className="font-medium">Week Start</span> to enable import.
        </div>
      )}
    </div>
  );
}