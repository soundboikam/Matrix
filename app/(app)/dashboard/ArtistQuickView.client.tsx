"use client";
import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/Modal.client";

type Pt = { weekStart: string; streams: number };

function Sparkline({ pts, height = 160 }: { pts: Pt[]; height?: number }) {
  const pad = 6;
  const { path } = useMemo(() => {
    if (!pts.length) return { path: "" };
    const ys = pts.map(p => p.streams);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = Math.max(pts.length - 1, 1);
    const scaleY = (v: number) =>
      maxY === minY ? height / 2 : height - pad - ((v - minY) / (maxY - minY)) * (height - pad * 2);
    const scaleX = (i: number) => pad + (i / w) * (600 - pad * 2);
    let d = `M ${scaleX(0)} ${scaleY(pts[0].streams)}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${scaleX(i)} ${scaleY(pts[i].streams)}`;
    return { path: d };
  }, [pts, height]);

  return (
    <svg viewBox="0 0 600 200" className="h-[180px] w-full">
      <rect x="0" y="0" width="600" height="200" fill="transparent" />
      <path d={path} stroke="white" strokeOpacity="0.8" strokeWidth="2" fill="none" />
    </svg>
  );
}

export default function ArtistQuickView({
  artistId,
  artistName,
  open,
  onClose,
}: {
  artistId: string;
  artistName: string;
  open: boolean;
  onClose: () => void;
}) {
  const [pts, setPts] = useState<Pt[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setErr(null);
    fetch(`/api/artist/${artistId}/series`)
      .then(res => res.json())
      .then(json => {
        if (!alive) return;
        const series: Pt[] = (json?.series || []).map((r: any) => ({
          weekStart: r.x ?? r.weekStart,
          streams: Number(r.y ?? r.streams ?? 0),
        }));
        series.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
        setPts(series);
      })
      .catch(e => setErr(String(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [artistId, open]);

  const weekStreams = pts.at(-1)?.streams ?? 0;
  const prevStreams = pts.at(-2)?.streams ?? 0;
  const growth = prevStreams > 0 ? Math.round(((weekStreams - prevStreams) / prevStreams) * 1000) / 10 : null;

  return (
    <Modal open={open} onClose={onClose} title={artistName}>
      {loading ? (
        <div className="text-sm text-neutral-400">Loading…</div>
      ) : err ? (
        <div className="text-sm text-rose-300">Error: {err}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded border border-neutral-800 bg-[#101010] p-3">
              <div className="text-xs text-neutral-400">This week</div>
              <div className="mt-1 text-xl font-semibold">{weekStreams.toLocaleString()}</div>
            </div>
            <div className="rounded border border-neutral-800 bg-[#101010] p-3">
              <div className="text-xs text-neutral-400">Prev week</div>
              <div className="mt-1 text-xl font-semibold">{prevStreams.toLocaleString()}</div>
            </div>
            <div className="rounded border border-neutral-800 bg-[#101010] p-3">
              <div className="text-xs text-neutral-400">Growth</div>
              <div className={`mt-1 text-xl font-semibold ${growth === null ? "text-neutral-400" : growth >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {growth === null ? "—" : `${growth >= 0 ? "▲" : "▼"} ${Math.abs(growth)}%`}
              </div>
            </div>
          </div>
          <div className="mt-3 rounded border border-neutral-800 bg-[#101010]">
            <Sparkline pts={pts} />
          </div>
          <div className="mt-3 text-xs text-neutral-400">
            {pts.length ? `${pts[0].weekStart.slice(0,10)} → ${pts.at(-1)!.weekStart.slice(0,10)}` : "No data"}
          </div>
        </>
      )}
    </Modal>
  );
}


