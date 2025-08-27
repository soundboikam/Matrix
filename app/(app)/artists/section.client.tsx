"use client";
import { useEffect, useState } from "react";
import Modal from "../../../components/Modal";
import ArtistChart from "../../../components/ArtistChart";

type Item = { id: string; name: string; weekStreams: number };

export default function ArtistsClient({ data }: { data: Item[] }) {
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [openName, setOpenName] = useState("");
  const [series, setSeries] = useState<{ date: string; streams: number }[] | null>(null);

  const filtered = data.filter(i => i.name.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    async function load() {
      if (!openId) return;
      setSeries(null);
      const res = await fetch(`/api/artist/${openId}/series`);
      const json = await res.json();
      setSeries(json.points || []);
    }
    load();
  }, [openId]);

  return (
    <div className="space-y-4">
      <div className="panel"><div className="pad">
        <div className="flex items-center justify-between">
          <h1 className="h1">Artists</h1>
          <input className="input w-64" placeholder="Search artists" value={q} onChange={(e)=>setQ(e.target.value)} />
        </div>
      </div></div>

      <div className="panel"><div className="pad">
        <div className="tbl">
          <table className="w-full">
            <thead><tr><th>Artist</th><th className="text-right">Streams (this week)</th></tr></thead>
            <tbody>
              {filtered.map(a=>(
                <tr key={a.id} className="cursor-pointer hover:bg-white/5"
                    onClick={()=>{ setOpenId(a.id); setOpenName(a.name); }}>
                  <td>{a.name}</td>
                  <td className="text-right">{a.weekStreams.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></div>

      <Modal open={!!openId} onClose={()=>setOpenId(null)} title={openName}>
        {!series && <div className="text-sm text-neutral-400">Loading…</div>}
        {series && series.length === 0 && <div className="text-sm text-neutral-400">No data yet.</div>}
        {series && series.length > 0 && <ArtistChart data={series} />}
      </Modal>
    </div>
  );
}


