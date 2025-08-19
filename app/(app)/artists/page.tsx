// app/(app)/artists/page.tsx
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import ArtistsTableClient from "../../../components/ArtistsTableClient";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return (
      <div className="p-6 text-zinc-200">
        <h1 className="text-2xl font-semibold mb-2">Artists</h1>
        <p>Please sign in.</p>
      </div>
    );
  }

  // workspace for this user
  const membership = await prisma.membership.findFirst({ where: { userId } });
  if (!membership) {
    return (
      <div className="p-6 text-zinc-200">
        <h1 className="text-2xl font-semibold mb-2">Artists</h1>
        <p>No workspace found.</p>
      </div>
    );
  }
  const workspaceId = membership.workspaceId;

  // All artist ids in this workspace
  const artists = await prisma.artist.findMany({
    where: { workspaceId },
    select: { id: true, name: true },
  });
  const artistIds = artists.map((a) => a.id);
  if (artistIds.length === 0) {
    return (
      <div className="p-6 text-zinc-200">
        <h1 className="text-2xl font-semibold mb-6">Artists</h1>
        <p>No artists yet.</p>
      </div>
    );
  }

  // Latest week in this workspace
  const latest = await prisma.streamWeekly.findFirst({
    where: { artistId: { in: artistIds } },
    orderBy: { weekStart: "desc" },
    select: { weekStart: true },
  });
  const latestDate = latest?.weekStart ?? null;
  const prevDate =
    latestDate ? new Date(latestDate.getTime() - 7 * 24 * 60 * 60 * 1000) : null;

  // Totals per artist
  const totals = await prisma.streamWeekly.groupBy({
    by: ["artistId"],
    where: { artistId: { in: artistIds } },
    _sum: { streams: true },
  });

  // This week sums
  const thisWeek = latestDate
    ? await prisma.streamWeekly.groupBy({
        by: ["artistId"],
        where: { artistId: { in: artistIds }, weekStart: latestDate },
        _sum: { streams: true },
      })
    : [];

  // Previous week sums
  const prevWeek = prevDate
    ? await prisma.streamWeekly.groupBy({
        by: ["artistId"],
        where: { artistId: { in: artistIds }, weekStart: prevDate },
        _sum: { streams: true },
      })
    : [];

  const totalMap = new Map(totals.map((t) => [t.artistId, t._sum.streams ?? 0]));
  const thisMap = new Map(thisWeek.map((t) => [t.artistId, t._sum.streams ?? 0]));
  const prevMap = new Map(prevWeek.map((t) => [t.artistId, t._sum.streams ?? 0]));

  const rows = artists.map((a) => ({
    id: a.id,
    name: a.name,
    totalStreams: totalMap.get(a.id) ?? 0,
    thisWeek: thisMap.get(a.id) ?? 0,
    prevWeek: prevMap.get(a.id) ?? 0,
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-6">Artists</h1>
      <ArtistsTableClient rows={rows} />
    </div>
  );
}
