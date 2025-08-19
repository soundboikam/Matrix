import { PrismaClient } from "@prisma/client";
import ArtistChart from "../../../components/ArtistChart";

const prisma = new PrismaClient();

async function getSeries(artistId: string) {
  const pts = await prisma.streamWeekly.findMany({
    where: { artistId },
    orderBy: { weekStart: "asc" },
    select: { weekStart: true, streams: true },
  });
  return pts.map(p => ({ x: p.weekStart.toISOString().slice(0,10), y: p.streams }));
}

export default async function ArtistPage({ params }: { params: { id: string } }) {
  const artist = await prisma.artist.findUnique({ where: { id: params.id } });
  const points = await getSeries(params.id);
  return (
    <div className="space-y-6">
      <h1 className="h1">{artist?.name}</h1>
      <div className="rounded border border-neutral-800 bg-[#0b0b0b] p-4">
        {points.length ? <ArtistChart points={points} /> : <p className="muted text-sm">No data yet.</p>}
      </div>
      <div className="panel"><div className="pad">
        <div className="tbl">
          <table className="w-full">
            <thead><tr><th>Week</th><th className="text-right">Streams</th></tr></thead>
            <tbody>
              {points.map(p=> (
                <tr key={p.x}><td>{p.x}</td><td className="text-right">{p.y.toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div></div>
    </div>
  );
}


