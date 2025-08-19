"use client";
import { useMemo, useState } from "react";
import ArtistQuickView from "./ArtistQuickView.client";
import StarButton from "../../../components/StarButton.client";

export type LeaderRow = {
	id: string;
	name: string;
	createdAt: string;           // ISO
	weekStreams: number;         // latest week
	prevWeekStreams?: number;    // previous week (optional)
	totalStreams: number;        // all-time
};

function pctGrowth(cur: number, prev?: number) {
	if (!prev || prev <= 0) return null;
	const g = ((cur - prev) / prev) * 100;
	return Math.round(g * 10) / 10; // 1 decimal
}

function RisingBadge({ growth }: { growth: number | null }) {
	if (growth === null || growth < 30) return null; // quick heuristic
	return (
		<span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
			Rising Star
		</span>
	);
}

export default function CardsGrid({ rows, starredIds }: { rows: LeaderRow[]; starredIds: string[] }) {
	const [q, setQ] = useState("");
	const [sort, setSort] = useState<"growth" | "total" | "name" | "created">("growth");
	const [risingOnly, setRisingOnly] = useState(false);
	const [active, setActive] = useState<{ id: string; name: string } | null>(null);
  const [localRows, setLocalRows] = useState<LeaderRow[]>(rows);

  const starSet = useMemo(() => new Set(starredIds), [starredIds]);

  // keep only pre-starred on first render
  const base = useMemo(() => localRows.filter(r => starSet.has(r.id)), [localRows, starSet]);

	const filtered = useMemo(() => {
		const needle = q.trim().toLowerCase();
		return base.filter(r => r.name.toLowerCase().includes(needle));
	}, [base, q]);

	const enriched = useMemo(() => {
		return filtered
			.map(r => ({ ...r, growth: pctGrowth(r.weekStreams, r.prevWeekStreams) }))
			.filter(r => !risingOnly || (r.growth !== null && r.growth >= 30));
	}, [filtered, risingOnly]);

	const sorted = useMemo(() => {
		const a = [...enriched] as Array<LeaderRow & { growth: number | null }>;
		if (sort === "growth") a.sort((x,y) => (y.growth ?? -1) - (x.growth ?? -1));
		if (sort === "total")  a.sort((x,y) => y.totalStreams - x.totalStreams);
		if (sort === "name")   a.sort((x,y) => x.name.localeCompare(y.name));
		if (sort === "created")a.sort((x,y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
		return a;
	}, [enriched, sort]);

	return (
		<section className="mt-8">
			{/* Controls */}
			<div className="mb-3 flex flex-wrap items-center gap-3">
				<input
					className="input w-72"
					placeholder="Search artists…"
					value={q}
					onChange={e=>setQ(e.target.value)}
				/>
				<div className="flex items-center gap-2">
					<span className="text-sm text-neutral-400">Sort by:</span>
					<div className="flex gap-1">
						{[
							{k:"growth", label:"Growth Rate"},
							{k:"total",  label:"Total Streams"},
							{k:"name",   label:"Name"},
							{k:"created",label:"Discovery Date"},
						].map(b=> (
							<button
								key={b.k}
								onClick={()=>setSort(b.k as any)}
								className={`rounded border px-2 py-1 text-sm ${
									sort===b.k ? "border-white/30 bg-white/10" : "border-white/10 hover:border-white/20"
								}`}
							>
								{b.label}
							</button>
						))}
					</div>
				</div>
				<label className="ml-auto flex items-center gap-2 text-sm text-neutral-300">
					<input type="checkbox" checked={risingOnly} onChange={e=>setRisingOnly(e.target.checked)} />
					Rising stars only
				</label>
			</div>

			{/* Grid with star + quick-view */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{sorted.map(r => {
					const growth = ((): number | null => {
						if (!r.prevWeekStreams || r.prevWeekStreams <= 0) return null;
						return Math.round(((r.weekStreams - r.prevWeekStreams) / r.prevWeekStreams) * 1000) / 10;
					})();
					const growthColor = growth === null ? "text-neutral-400" : growth >= 0 ? "text-emerald-300" : "text-rose-300";
					const growthPrefix = growth === null ? "—" : growth >= 0 ? "▲" : "▼";
					const initiallyStarred = starSet.has(r.id);
					return (
						<button
							key={r.id}
							onClick={() => setActive({ id: r.id, name: r.name })}
							className="block rounded-lg border border-neutral-800 bg-[#0b0b0b] p-4 text-left hover:border-neutral-700"
						>
							<div className="mb-1 flex items-center">
								<div className="mr-2 grid h-9 w-9 place-items-center rounded bg-white/10 text-lg">♪</div>
								<div className="flex-1 text-lg font-semibold">{r.name}</div>
								<div onClick={(e)=>e.stopPropagation()}>
                          <StarButton
                            artistId={r.id}
                            initialStarred={true}
                            onToggle={(s) => {
											if (!s) setLocalRows(prev => prev.filter(x => x.id !== r.id));
										}}
									/>
								</div>
								{growth !== null && growth >= 30 && (
									<span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
										Rising Star
									</span>
								)}
							</div>
							<div className="text-xs text-neutral-400">Added {r.createdAt.slice(0,10)}</div>
							<div className="my-4 h-px w-full bg-white/5" />
							<div className="grid grid-cols-3 gap-3 text-sm">
								<div>
									<div className="text-neutral-400">Total Streams</div>
									<div className="mt-1 text-base font-medium">{r.totalStreams.toLocaleString()}</div>
								</div>
								<div>
									<div className="text-neutral-400">Growth Rate</div>
									<div className={`mt-1 text-base font-medium ${growthColor}`}>
										{growth === null ? "—" : `${growthPrefix} ${Math.abs(growth)}%`}
									</div>
								</div>
								<div>
									<div className="text-neutral-400">This Week</div>
									<div className="mt-1 text-base font-medium">{r.weekStreams.toLocaleString()}</div>
								</div>
							</div>
						</button>
					);
				})}
			</div>

			{/* Quick view modal */}
			{active && (
				<ArtistQuickView
					artistId={active.id}
					artistName={active.name}
					open={true}
					onClose={() => setActive(null)}
				/>
			)}
		</section>
	);
}


