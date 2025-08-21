// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";

const prisma = new PrismaClient();

function toISODate(d: Date) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

// Given any date string, coerce to week start (Monday) ISO date
function coerceWeekStart(dateStr: string): string | null {
  const tryD = new Date(dateStr);
  if (isNaN(tryD.getTime())) return null;
  // Make Monday week-start (0 = Sun, 1 = Mon)
  const day = tryD.getUTCDay();
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(Date.UTC(tryD.getUTCFullYear(), tryD.getUTCMonth(), tryD.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - diff);
  return toISODate(monday);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const dataType: "US" | "Global" =
      body?.dataType === "Global" ? "Global" : "US";
    const clientWeekStart: string | null = body?.weekStart || null;
    const rows: Array<{ artist?: string; streams?: number | null; week?: string | null }> =
      Array.isArray(body?.rows) ? body.rows : [];

    if (!rows.length) {
      return NextResponse.json({ error: "No rows" }, { status: 400 });
    }

    let created = 0;
    let skipped = 0;

    for (const r of rows) {
      const name = (r.artist || "").trim();
      if (!name) { skipped++; continue; }

      // Coerce streams
      const streams =
        typeof r.streams === "number" && Number.isFinite(r.streams)
          ? r.streams
          : null;

      // Use file week if present; else fall back to client weekStart
      let weekStartISO: string | null = null;
      if (r.week) weekStartISO = coerceWeekStart(r.week);
      if (!weekStartISO && clientWeekStart) weekStartISO = coerceWeekStart(clientWeekStart);
      if (!weekStartISO) { skipped++; continue; }

      // Resolve workspace for the current user
      const membership = await prisma.membership.findFirst({
        where: { userId },
        select: { workspaceId: true },
      });
      if (!membership) {
        return NextResponse.json({ error: "No workspace" }, { status: 400 });
      }
      const { workspaceId } = membership;

      // Upsert artist scoped to workspace
      const artistRec = await prisma.artist.upsert({
        where: { workspaceId_name: { workspaceId, name } },
        update: {},
        create: { name, workspaceId },
      });

      // Upsert week row using StreamWeekly table
      await prisma.streamWeekly.upsert({
        where: {
          artistId_weekStart_source: {
            artistId: artistRec.id,
            weekStart: new Date(weekStartISO),
            source: "upload",
          },
        },
        update: {
          streams: streams ?? 0,
          region: dataType,
        },
        create: {
          artistId: artistRec.id,
          weekStart: new Date(weekStartISO),
          streams: streams ?? 0,
          source: "upload",
          region: dataType,
        },
      });

      created++;
    }

    return NextResponse.json({ created, skipped });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}


