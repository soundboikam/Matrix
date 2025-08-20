// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";

const prisma = new PrismaClient();

const norm = (s: string) =>
  s.toLowerCase().trim().replace(/\u00a0/g, " ").replace(/[\s\-]+/g, "_");

const asNumber = (v: any): number | null => {
  if (v == null) return null;
  const s = String(v).replace(/,/g, "").trim();
  if (s === "" || s === "—" || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const ARTIST_KEYS = ["artist", "artist_name", "name", "artistid", "artist_id"];
const STREAMS_KEYS = [
  "streams",
  "total_streams",
  "this_week",
  "streams_this_week",
  "plays",
  "plays_this_week",
  "weekly_streams",
];
const WEEK_KEYS = ["week", "date", "week_start", "week_commencing", "week_of"];

function pick(row: Record<string, any>, candidates: string[]) {
  for (const c of candidates) {
    const want = norm(c);
    for (const k of Object.keys(row)) {
      if (norm(k) === want) return row[k];
    }
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { dataType, weekStart, rows } = (await req.json()) as {
      dataType?: "US" | "GLOBAL";
      weekStart?: string | null;
      rows: any[];
    };

    if (!rows?.length) {
      return NextResponse.json({ error: "No rows received" }, { status: 400 });
    }

    // Resolve workspace for the current user
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

    for (const raw of rows) {
      const artist = pick(raw, ARTIST_KEYS) ?? "";
      const dateVal = pick(raw, WEEK_KEYS);
      const streamsVal = pick(raw, STREAMS_KEYS);

      const week = (dateVal ? String(dateVal) : weekStart) || null;
      const streams = asNumber(streamsVal);

      if (!artist || !streams || !week) {
        skipped++;
        continue;
      }

      // normalize week to YYYY-MM-DD if possible
      let weekDate = new Date(week);
      if (isNaN(weekDate.getTime())) {
        skipped++;
        continue;
      }
      const iso = weekDate.toISOString().slice(0, 10);

      // upsert artist scoped to workspace
      const artistRec = await prisma.artist.upsert({
        where: { workspaceId_name: { workspaceId, name: artist } },
        update: {},
        create: { name: artist, workspaceId },
      });

      // insert row using StreamWeekly table
      await prisma.streamWeekly.create({
        data: {
          artistId: artistRec.id,
          weekStart: new Date(iso),
          streams,
          source: "upload",
          region: dataType === "GLOBAL" ? "Global" : "US",
        },
      });
      created++;
    }

    return NextResponse.json({ created, skipped });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}


