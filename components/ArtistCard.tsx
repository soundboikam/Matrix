"use client";

import React from "react";

type ArtistLite = {
  id: string;
  name: string;
  totalStreams?: number;
  thisWeek?: number;
  growthRatePct?: number; // +/- percentage
  rising?: boolean;
  starred?: boolean;
};

export default function ArtistCard({
  artist,
  onOpen,
  onToggleStar,
}: {
  artist: ArtistLite;
  onOpen: (a: ArtistLite) => void;
  onToggleStar: (a: ArtistLite) => void;
}) {
  const pct = artist.growthRatePct ?? 0;
  const pctColor =
    pct > 0 ? "text-emerald-400" : pct < 0 ? "text-rose-400" : "text-zinc-400";

  return (
    <div
      className="group rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 cursor-pointer transition-colors"
      onClick={() => onOpen(artist)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold">{artist.name}</div>

        {/* Star button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(artist);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-700 hover:border-zinc-600 bg-zinc-800/60"
          title={artist.starred ? "Remove from watchlist" : "Add to watchlist"}
          aria-label="Toggle watchlist star"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${
              artist.starred ? "fill-yellow-400 text-yellow-400" : "fill-none text-zinc-300"
            }`}
          >
            <path
              stroke="currentColor"
              strokeWidth="2"
              d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
            />
            {artist.starred && (
              <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            )}
          </svg>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-zinc-400">Total Streams</div>
          <div className="font-medium">
            {formatCompact(artist.totalStreams ?? 0)}
          </div>
        </div>
        <div>
          <div className="text-zinc-400">Growth Rate</div>
          <div className={`font-medium ${pctColor}`}>
            {arrow(pct)} {Math.abs(pct).toFixed(2)}%
          </div>
        </div>
        <div>
          <div className="text-zinc-400">This Week</div>
          <div className="font-medium">{formatCompact(artist.thisWeek ?? 0)}</div>
        </div>
      </div>
    </div>
  );
}

function arrow(p: number) {
  if (p > 0) return "▲";
  if (p < 0) return "▼";
  return "—";
}

function formatCompact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    n
  );
}
