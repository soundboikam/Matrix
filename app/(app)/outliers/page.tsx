import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function OutliersPage() {
  const artists = await prisma.artist.findMany();
  const rows: any[] = [];
  for (const a of artists) {
    const weeks = await prisma.streamWeekly.findMany({ where: { artistId: a.id }, orderBy: { weekStart: "asc" }, select: { weekStart: true, streams: true } });
    if (weeks.length < 3) continue;
    const changes:number[] = [];
    for (let i=1;i<weeks.length;i++) changes.push(weeks[i].streams - weeks[i-1].streams);
    const lastChange = changes.at(-1)!;
    const hist = changes.slice(0,-1).slice(-8);
    const mean = hist.reduce((s,n)=>s+n,0)/(hist.length||1);
    const variance = hist.reduce((s,n)=>s+(n-mean)*(n-mean),0)/(hist.length||1);
    const sd = Math.sqrt(variance);
    const z = sd ? (lastChange - mean) / sd : 0;
    const prev = weeks[weeks.length-2].streams;
    const pct = prev ? lastChange/prev : 0;
    rows.push({ artistId:a.id, artist:a.name, latestWeek: weeks.at(-1)!.weekStart.toISOString().slice(0,10), streams: weeks.at(-1)!.streams, wowChange:lastChange, pctChange:pct, zScore:z });
  }
  const top = rows.filter(r=>r.streams>0).sort((a,b)=>b.zScore-a.zScore).slice(0,50);
  return (
    <div className="panel">
      <div className="pad">
        <h1 className="h1">Outliers</h1>
        <div className="mt-4 tbl">
          <table className="w-full">
            <thead><tr><th>Artist</th><th>Week</th><th>Streams</th><th>WoW</th><th>Z</th></tr></thead>
            <tbody>
              {top.map(r=>(
                <tr key={r.artistId}>
                  <td><a href={`/artist/${r.artistId}`}>{r.artist}</a></td>
                  <td>{r.latestWeek}</td>
                  <td>{r.streams.toLocaleString()}</td>
                  <td>{r.wowChange.toLocaleString()} ({Math.round(r.pctChange*100)}%)</td>
                  <td>{r.zScore.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted text-xs mt-2">Z uses the last 8 WoW changes when available.</p>
      </div>
    </div>
  );
}


