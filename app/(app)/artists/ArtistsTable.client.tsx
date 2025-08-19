"use client";

import React from "react";
import ArtistModal from "../../../components/ArtistModal";

type Row = {
  id: string;
  name: string;
  totalStreams: number;
  thisWeek: number;
  prevWeek: number;
};

type SortKey = "growth" | "total" | "thisWeek" | "name";

export default function ArtistsTableClient({ rows }: { rows: Row[] }) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("growth");
  const [selected, setSelected] = React.useState<{ id: string; name: string } | null>(null);

  // pre-star from backend
  const [starred, setStarred] = React.useState<Set<string>>(new Set());
  React.useEffect(() => {
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((data) => {
        const ids: string[] = (data?.items ?? data ?? []).map((x: any) => x.id || x.artistId);
        setStarred(new Set(ids));
      })
      .catch(() => {});
  }, []);

  async function toggleStar(id: string) {
    const nextStar = !starred.has(id);
    setStarred((prev) => {
      const s = new Set(prev);
      if (nextStar) s.add(id);
      else s.delete(id);
      return s;
    });
    try {
      await fetch("/api/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: id, star: nextStar }),
      });
    } catch {}
  }

  const enriched = React.useMemo(
    () =>
      rows.map((r) => {
        const growthRatePct =
          r.prevWeek > 0 ? ((r.thisWeek - r.prevWeek) / r.prevWeek) * 100 : 0;
        return { ...r, growthRatePct };
      }),
    [rows]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return enriched;
    return enriched.filter((r) => r.name.toLowerCase().includes(q));
  }, [enriched, query]);

  const sorted = React.useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      switch (sort) {
        case "growth":
          return (b.growthRatePct ?? 0) - (a.growthRatePct ?? 0);
        case "total":
          return (b.totalStreams ?? 0) - (a.totalStreams ?? 0);
        case "thisWeek":
          return (b.thisWeek ?? 0) - (a.thisWeek ?? 0);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return copy;
  }, [filtered, sort]);

  const btn = (active: boolean) =>
    `px-3 py-1 rounded border text-sm transition ${
      active
        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
        : "border-zinc-700 hover:border-zinc-500 text-zinc-300"
    }`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          className="w-full md:max-w-md px-3 py-2 rounded border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder-zinc-500"
          placeholder="Search artists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button className={btn(sort === "growth")} onClick={() => setSort("growth")}>
            Growth Rate
          </button>
          <button className={btn(sort === "total")} onClick={() => setSort("total")}>
            Total Streams
          </button>
          <button className={btn(sort === "thisWeek")} onClick={() => setSort("thisWeek")}>
            This Week
          </button>
          <button className={btn(sort === "name")} onClick={() => setSort("name")}>
            Name
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-zinc-400 bg-zinc-900/60">
            <tr className="border-b border-zinc-800">
              <th className="text-left p-3">Artist</th>
              <th className="text-left p-3">Total Streams</th>
              <th className="text-left p-3">Growth Rate</th>
              <th className="text-left p-3">This Week</th>
              <th className="p-3 text-right">Watch</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const growth = r.growthRatePct ?? 0;
              const growthColor =
                growth > 0 ? "text-emerald-400" : growth < 0 ? "text-red-400" : "text-zinc-400";
              const isStarred = starred.has(r.id);

              return (
                <tr
                  key={r.id}
                  className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                >
                  <td
                    className="p-3 cursor-pointer hover:underline"
                    onClick={() => setSelected({ id: r.id, name: r.name })}
                  >
                    {r.name}
                  </td>
                  <td className="p-3">{fmt(r.totalStreams)}</td>
                  <td className={`p-3 ${growthColor}`}>
                    {growth === 0 ? "—" : `${growth > 0 ? "▲" : "▼"} ${Math.abs(growth).toFixed(2)}%`}
                  </td>
                  <td className="p-3">{fmt(r.thisWeek)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toggleStar(r.id)}
                      className={`inline-flex items-center justify-center w-7 h-7 rounded border ${
                        isStarred
                          ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                          : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                      }`}
                      title={isStarred ? "Remove from watchlist" : "Add to watchlist"}
                    >
                      ★
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-zinc-400">
                  No artists match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <ArtistModal artist={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function fmt(n?: number) {
  if (!n || n === 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
