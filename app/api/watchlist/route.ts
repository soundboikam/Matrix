import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const full = searchParams.get("full") === "1";

  // Find starred artists for this user
  const stars = await prisma.watchlist.findMany({
    where: { userId },
    orderBy: { starredAt: "desc" },
    ...(full ? {} : { take: 24 }),
    select: { artistId: true },
  });

  const watchIds = stars.map((s) => s.artistId);
  if (watchIds.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Determine latest and previous weeks across the watchlist
  const weeks = await prisma.streamWeekly.findMany({
    where: { artistId: { in: watchIds } },
    orderBy: { weekStart: "desc" },
    distinct: ["weekStart"],
    take: 2,
    select: { weekStart: true },
  });
  const latestWeek = weeks[0]?.weekStart;
  const prevWeek = weeks[1]?.weekStart;

  const current = latestWeek
    ? await prisma.streamWeekly.groupBy({
        by: ["artistId"],
        where: { artistId: { in: watchIds }, weekStart: latestWeek },
        _sum: { streams: true },
      })
    : [];

  const previous = prevWeek
    ? await prisma.streamWeekly.groupBy({
        by: ["artistId"],
        where: { artistId: { in: watchIds }, weekStart: prevWeek },
        _sum: { streams: true },
      })
    : [];

  const totals = await prisma.streamWeekly.groupBy({
    by: ["artistId"],
    where: { artistId: { in: watchIds } },
    _sum: { streams: true },
  });

  const artistMeta = await prisma.artist.findMany({
    where: { id: { in: watchIds } },
    select: { id: true, name: true },
  });

  const curMap = new Map(current.map((c) => [c.artistId, c._sum.streams || 0]));
  const prevMap = new Map(previous.map((p) => [p.artistId, p._sum.streams || 0]));
  const totalMap = new Map(totals.map((t) => [t.artistId, t._sum.streams || 0]));
  const nameMap = new Map(artistMeta.map((a) => [a.id, a.name]));

  const items = watchIds.map((id) => {
    const name = nameMap.get(id) || "Unknown";
    const thisWeek = curMap.get(id) ?? 0;
    const prev = prevMap.get(id) ?? 0;
    const totalStreams = totalMap.get(id) ?? 0;
    const growthRatePct = prev > 0 ? ((thisWeek - prev) / prev) * 100 : null;
    const rising = (growthRatePct ?? 0) > 0;
    return { id, name, totalStreams, thisWeek, growthRatePct, rising };
  });

  return NextResponse.json({ items });
}


