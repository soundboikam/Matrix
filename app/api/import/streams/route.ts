import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";

const prisma = new PrismaClient();

type Row = {
  artist: string;
  streams: number;
  week: string; // yyyy-MM-dd
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const membership = await prisma.membership.findFirst({ where: { userId } });
    if (!membership) {
      return NextResponse.json({ error: "No workspace" }, { status: 400 });
    }
    const workspaceId = membership.workspaceId;

    const { rows, region } = await req.json() as { rows: Row[]; region?: string };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    // Ensure artists exist; then upsert StreamWeekly rows
    const artistCache = new Map<string, string>();

    // Create missing artists in bulk-ish manner
    for (const r of rows) {
      const key = r.artist.toLowerCase().trim();
      if (!artistCache.has(key)) {
        const a = await prisma.artist.upsert({
          where: { workspaceId_name: { workspaceId, name: r.artist } },
          update: {},
          create: { name: r.artist, workspaceId },
          select: { id: true },
        });
        artistCache.set(key, a.id);
      }
    }

    const sourceTag = (region || "US").toLowerCase();
    let created = 0;
    let skipped = 0;

    // Upsert by unique (artistId, weekStart, source)
    for (const r of rows) {
      const artistId = artistCache.get(r.artist.toLowerCase().trim())!;
      const weekStart = new Date(r.week);
      const streams = Math.max(0, Math.floor(r.streams));

      try {
        await prisma.streamWeekly.create({
          data: {
            artistId,
            weekStart,
            source: sourceTag,
            streams,
          },
        });
        created++;
      } catch {
        // Unique conflict (artistId, weekStart, source) - skip
        skipped++;
      }
    }

    return NextResponse.json({ ok: true, created, skipped, total: rows.length });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
