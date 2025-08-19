// components/StarredGrid.tsx
"use client";

import React from "react";
import ArtistModal from "./ArtistModal";

type ArtistLite = {
  id: string;
  name: string;
  totalStreams?: number;
  thisWeek?: number;
  growthRatePct?: number; // positive/negative percentage (e.g., 6.11 for +6.11%)
  rising?: boolean;
  starred?: boolean; // UI state for the star icon
  discoveryDate?: string; // optional, used for sorting by date
};

export default function StarredGrid({ full = false }: { full?: boolean }) {
  const [artists, setArtists] = React.useState<ArtistLite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<"growth" | "total" | "name" | "date">(
    "growth"
  );
  const [onlyRising, setOnlyRising] = React.useState(false);
  const [selected, setSelected] = React.useState<ArtistLite | null>(null);

  // ---- load data -----------------------------------------------------------
  React.useEffect(() => {
    setLoading(true);
    let url = "/api/watchlist";
    if (full) url += "?full=1";

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const items = (data?.items ?? data ?? []) as ArtistLite[];
        // ✅ force pre-starred visuals in case API doesn't include `starred`
        setArtists(items.map((a) => ({ ...a, starred: a.starred ?? true })));
      })
      .finally(() => setLoading(false));
  }, [full]);

  // ---- derived lists -------------------------------------------------------
  const filtered = React.useMemo(() => {
    let list = artists;

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (onlyRising) {
      list = list.filter((a) => a.rising);
    }

    switch (sort) {
      case "growth":
        list = [...list].sort(
          (a, b) => (b.growthRatePct ?? 0) - (a.growthRatePct ?? 0)
        );
        break;
      case "total":
        list = [...list].sort(
          (a, b) => (b.totalStreams ?? 0) - (a.totalStreams ?? 0)
        );
        break;
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "date":
        list = [...list].sort(
          (a, b) =>
            new Date(b.discoveryDate ?? 0).getTime() -
            new Date(a.discoveryDate ?? 0).getTime()
        );
        break;
    }

    return list;
  }, [artists, query, sort, onlyRising]);

  // ---- star toggle (optimistic) -------------------------------------------
  async function toggleStar(artistId: string, next: boolean) {
    setArtists((prev) =>
      prev.map((a) => (a.id === artistId ? { ...a, starred: next } : a))
    );

    try {
      await fetch("/api/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, star: next }),
      });
      // If your API returns the whole updated list, you could re-fetch here.
    } catch {
      // rollback on error
      setArtists((prev) =>
        prev.map((a) => (a.id === artistId ? { ...a, starred: !next } : a))
      );
    }
  }

  // ---- UI helpers ----------------------------------------------------------
  const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="text-sm">
      <div className="text-zinc-400">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );

  const Growth = ({ pct }: { pct?: number }) => {
    if (pct == null) return <span className="text-zinc-400">—</span>;
    const up = pct >= 0;
    return (
      <span className={up ? "text-emerald-400" : "text-rose-400"}>
        {up ? "▲ " : "▼ "}
        {Math.abs(pct).toFixed(2)}%
      </span>
    );
  };

  // ---- render --------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search artists..."
          className="w-full md:w-96 rounded bg-zinc-900 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSort("growth")}
            className={`px-3 py-2 rounded border ${
              sort === "growth" ? "border-zinc-600" : "border-zinc-800"
            } bg-zinc-900`}
          >
            Growth Rate
          </button>
          <button
            onClick={() => setSort("total")}
            className={`px-3 py-2 rounded border ${
              sort === "total" ? "border-zinc-600" : "border-zinc-800"
            } bg-zinc-900`}
          >
            Total Streams
          </button>
          <button
            onClick={() => setSort("name")}
            className={`px-3 py-2 rounded border ${
              sort === "name" ? "border-zinc-600" : "border-zinc-800"
            } bg-zinc-900`}
          >
            Name
          </button>
          <button
            onClick={() => setSort("date")}
            className={`px-3 py-2 rounded border ${
              sort === "date" ? "border-zinc-600" : "border-zinc-800"
            } bg-zinc-900`}
          >
            Discovery Date
          </button>
        </div>

        <label className="ml-auto inline-flex select-none items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="accent-zinc-200"
            checked={onlyRising}
            onChange={(e) => setOnlyRising(e.target.checked)}
          />
          Rising stars only
        </label>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-zinc-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-zinc-400">No artists match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="relative rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-700 transition-colors"
            >
              {/* star */}
              <button
                title={a.starred ? "Remove from watchlist" : "Add to watchlist"}
                onClick={() => toggleStar(a.id, !a.starred)}
                className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded border ${
                  a.starred
                    ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10"
                    : "text-zinc-400 border-zinc-700 bg-zinc-800"
                } hover:opacity-90`}
              >
                ★
              </button>

              {/* name */}
              <div
                role="button"
                onClick={() => setSelected(a)}
                className="mb-3 cursor-pointer text-lg font-semibold hover:underline"
              >
                {a.name}
              </div>

              {/* stats */}
              <div className="grid grid-cols-3 gap-4">
                <Stat
                  label="Total Streams"
                  value={
                    a.totalStreams != null
                      ? a.totalStreams.toLocaleString()
                      : "—"
                  }
                />
                <Stat
                  label="Growth Rate"
                  value={<Growth pct={a.growthRatePct} />}
                />
                <Stat
                  label="This Week"
                  value={a.thisWeek != null ? a.thisWeek.toLocaleString() : "—"}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* modal */}
      {selected && (
        <ArtistModal
          artist={{ id: selected.id, name: selected.name }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
