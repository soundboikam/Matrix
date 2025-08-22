"use client";

import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function invalidateStats() {
  mutate("/api/stats");
}

export default function StatsCards() {
  const { data } = useSWR("/api/stats", fetcher, { refreshInterval: 0 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border border-zinc-800 rounded p-4">
        <div className="text-xs uppercase text-zinc-400">Artists</div>
        <div className="text-3xl font-semibold">{data?.artists ?? 0}</div>
      </div>
      <div className="border border-zinc-800 rounded p-4">
        <div className="text-xs uppercase text-zinc-400">Uploads</div>
        <div className="text-3xl font-semibold">{data?.uploads ?? 0}</div>
      </div>
      <div className="border border-zinc-800 rounded p-4">
        <div className="text-xs uppercase text-zinc-400">Total Rows</div>
        <div className="text-3xl font-semibold">{data?.totalRows ?? 0}</div>
      </div>
    </div>
  );
}
