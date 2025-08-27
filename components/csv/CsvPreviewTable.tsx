"use client";

import { useState, useMemo } from "react";
import type { NormalizedRow } from "@/lib/csv/headerMap";

export default function CsvPreviewTable({ initial }: { initial: NormalizedRow[] }) {
  const [included, setIncluded] = useState<NormalizedRow[]>(initial);
  const [excluded, setExcluded] = useState<NormalizedRow[]>([]);

  const counts = useMemo(() => ({
    included: included.length,
    excluded: excluded.length,
    total: included.length + excluded.length,
  }), [included, excluded]);

  const excludeRow = (idx: number) => {
    setIncluded((prev) => {
      const copy = [...prev];
      const [row] = copy.splice(idx, 1);
      setExcluded((e) => [row, ...e]);
      return copy;
    });
  };

  const restoreRow = (idx: number) => {
    setExcluded((prev) => {
      const copy = [...prev];
      const [row] = copy.splice(idx, 1);
      setIncluded((i) => [row, ...i]);
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-300">
        Rows in file: {counts.total} • Included: {counts.included} • Excluded: {counts.excluded}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-3 py-2 text-left w-10"> </th>
              <th className="px-3 py-2 text-left">Artist</th>
              <th className="px-3 py-2 text-left">Streams</th>
              <th className="px-3 py-2 text-left">Week</th>
            </tr>
          </thead>
          <tbody>
            {included.map((r, i) => (
              <tr key={`${r.artist}-${r.week}-${i}`} className="border-t border-gray-800">
                <td className="px-3 py-2">
                  <button
                    aria-label="Exclude row"
                    onClick={() => excludeRow(i)}
                    className="rounded border border-red-500/60 text-red-300 hover:bg-red-500/10 px-2 py-1"
                  >
                    ✕
                  </button>
                </td>
                <td className="px-3 py-2">{r.artist}</td>
                <td className="px-3 py-2">{r.streams.toLocaleString()}</td>
                <td className="px-3 py-2">{r.week}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {excluded.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-yellow-700/40">
          <div className="px-3 py-2 bg-yellow-900/20 text-yellow-200 text-xs">Excluded rows</div>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-3 py-2 text-left w-10"> </th>
                <th className="px-3 py-2 text-left">Artist</th>
                <th className="px-3 py-2 text-left">Streams</th>
                <th className="px-3 py-2 text-left">Week</th>
              </tr>
            </thead>
            <tbody>
              {excluded.map((r, i) => (
                <tr key={`ex-${r.artist}-${r.week}-${i}`} className="border-t border-gray-800">
                  <td className="px-3 py-2">
                    <button
                      aria-label="Restore row"
                      onClick={() => restoreRow(i)}
                      className="rounded border border-blue-500/60 text-blue-300 hover:bg-blue-500/10 px-2 py-1"
                    >
                      ↺
                    </button>
                  </td>
                  <td className="px-3 py-2">{r.artist}</td>
                  <td className="px-3 py-2">{r.streams.toLocaleString()}</td>
                  <td className="px-3 py-2">{r.week}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
