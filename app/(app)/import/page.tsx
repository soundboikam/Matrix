"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { parseCsvFile, applyWeekStartToMissing } from "@/lib/csv/parseCsv";
import CsvPreviewTable from "@/components/csv/CsvPreviewTable";
import type { NormalizedRow } from "@/lib/csv/headerMap";
import { parse, isValid, format } from "date-fns";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [region, setRegion] = useState<"US" | "EU">("US");
  const [weekStartText, setWeekStartText] = useState<string>(""); // mm/dd/yyyy
  const [previewRows, setPreviewRows] = useState<NormalizedRow[] | null>(null);
  const [busy, setBusy] = useState(false);

  const weekStartISO = useMemo(() => {
    if (!weekStartText) return "";
    const p = parse(weekStartText, "MM/dd/yyyy", new Date());
    if (!isValid(p)) return "";
    return format(p, "yyyy-MM-dd");
  }, [weekStartText]);

  const runParse = useCallback(async () => {
    if (!file) {
      setPreviewRows(null);
      return;
    }
    setBusy(true);
    try {
      const res = await parseCsvFile(file, { weekFormat: "MM/dd/yyyy" });
      const withWeek = applyWeekStartToMissing(res.included, weekStartISO || undefined);
      setPreviewRows(withWeek);
    } catch (e) {
      setPreviewRows(null);
    } finally {
      setBusy(false);
    }
  }, [file, weekStartISO]);

  useEffect(() => {
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
        setWeekStartText("");
        const inp = document.getElementById("csv-input") as HTMLInputElement | null;
        if (inp) inp.value = "";
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

        <input
          type="text"
          value={weekStartText}
          onChange={(e) => setWeekStartText(e.target.value)}
          placeholder="mm/dd/yyyy"
          className="rounded bg-black border border-gray-700 px-2 py-1 text-sm w-40"
          title="Week start date (used if your CSV lacks a date column)"
        />

        <button
          onClick={onImport}
          disabled={!previewRows || previewRows.length === 0 || busy}
          className="rounded bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-sm"
        >
          Import to Database
        </button>
      </div>

      {previewRows && <CsvPreviewTable initial={previewRows} />}
    </div>
  );
}