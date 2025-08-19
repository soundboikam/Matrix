import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";

const prisma = new PrismaClient();

// Normalize artist names a bit
function cleanName(s: string) {
  return s.trim();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const dataType: "US" | "Global" = body?.dataType === "Global" ? "Global" : "US";
    const rows: Array<{ artist: string; streams: number; week: string }> =
      Array.isArray(body?.rows) ? body.rows : [];

    // Resolve workspace for the current user (schema requires workspace on Artist)
    const membership = await prisma.membership.findFirst({
      where: { userId },
      select: { workspaceId: true },
    });
    if (!membership) {
      return NextResponse.json({ error: "No workspace" }, { status: 400 });
    }
    const { workspaceId } = membership;

    let created = 0;
    let skipped = 0;

    for (const r of rows) {
      const artistName = cleanName(r.artist || "");
      const streams = Number(r.streams || 0);
      const weekStr = r.week || "";
      if (!artistName || !streams || !weekStr) {
        skipped++;
        continue;
      }

      const weekDate = new Date(weekStr);
      if (isNaN(weekDate.getTime())) {
        skipped++;
        continue;
      }

      // Upsert artist scoped to workspace
      const artist = await prisma.artist.upsert({
        where: { workspaceId_name: { workspaceId, name: artistName } },
        update: {},
        create: { name: artistName, workspaceId },
      });

      // Upsert weekly entry; include region column if schema has it.
      try {
        // Try region-aware path first
        const existing = await prisma.streamWeekly.findFirst({
          where: {
            artistId: artist.id,
            weekStart: weekDate,
            // @ts-ignore tolerate missing column in older DBs
            ...(dataType ? { region: dataType } : {}),
          },
          select: { id: true },
        });

        if (existing) {
          await prisma.streamWeekly.update({
            where: { id: existing.id },
            // @ts-ignore
            data: { streams, region: dataType },
          });
        } else {
          await prisma.streamWeekly.create({
            data: {
              artistId: artist.id,
              weekStart: weekDate,
              streams,
              // Required by schema
              source: "upload",
              // @ts-ignore
              region: dataType,
            },
          });
        }

        created++;
      } catch {
        // Fallback for legacy schema without region
        const existing = await prisma.streamWeekly.findFirst({
          where: {
            artistId: artist.id,
            weekStart: weekDate,
          },
          select: { id: true },
        });

        if (existing) {
          await prisma.streamWeekly.update({
            where: { id: existing.id },
            data: { streams },
          });
        } else {
          await prisma.streamWeekly.create({
            data: {
              artistId: artist.id,
              weekStart: weekDate,
              streams,
              source: "upload",
            },
          });
        }

        created++;
      }
    }

    return NextResponse.json({ created, skipped });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 400 });
  }
}


