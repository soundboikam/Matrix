// components/ArtistRow.tsx
"use client";

import * as React from "react";
import ArtistModal from "./ArtistModal";

type Props = {
  id: string;
  name: string;
  totalStreams?: number | null;
  growthRatePct?: number | null;   // +/- %
  thisWeek?: number | null;
  className?: string;
};

export default function ArtistRow({
  id,
  name,
  totalStreams,
  growthRatePct,
  thisWeek,
  className = "",
}: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full text-left hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white/20 rounded px-3 py-2 ${className}`}
        aria-label={`Open details for ${name}`}
      >
        <div className="grid grid-cols-12 items-center gap-3">
          <div className="col-span-5 font-medium">{name}</div>
          <div className="col-span-3 text-sm opacity-80">
            {typeof totalStreams === "number" ? totalStreams.toLocaleString() : "—"}
          </div>
          <div
            className={`col-span-2 text-sm ${
              typeof growthRatePct === "number"
                ? growthRatePct >= 0
                  ? "text-emerald-400"
                  : "text-red-400"
                : "opacity-80"
            }`}
          >
            {typeof growthRatePct === "number"
              ? `${growthRatePct >= 0 ? "▲" : "▼"} ${Math.abs(growthRatePct).toFixed(2)}%`
              : "—"}
          </div>
          <div className="col-span-2 text-sm opacity-80">
            {typeof thisWeek === "number" ? thisWeek.toLocaleString() : "—"}
          </div>
        </div>
      </button>

      {open && (
        <ArtistModal artist={{ id, name }} onClose={() => setOpen(false)} />
      )}
    </>
  );
}


