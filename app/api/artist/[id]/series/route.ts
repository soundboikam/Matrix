import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const artistId = params.id;
  const { searchParams } = new URL(req.url);
  const regionParam = searchParams.get("region"); // "US" | "Global" | null

  // Try to detect available regions; if the schema doesn't have 'region', fall back silently.
  let availableRegions: string[] = [];
  try {
    // @ts-ignore - tolerate older schema without 'region'
    const byRegion = await prisma.streamWeekly.groupBy({
      by: ["region"],
      where: { artistId },
      _count: true,
    });
    availableRegions = (byRegion || []).map((r: any) => r.region).filter(Boolean);
  } catch {
    availableRegions = [];
  }

  let regionUsed: "US" | "Global" | "mixed" = "mixed";
  let regionFilter: string | undefined;

  if (regionParam === "US" || regionParam === "Global") {
    regionUsed = regionParam;
    regionFilter = regionParam;
  } else if (availableRegions.length > 0) {
    if (availableRegions.includes("US")) {
      regionUsed = "US";
      regionFilter = "US";
    } else if (availableRegions.includes("Global")) {
      regionUsed = "Global";
      regionFilter = "Global";
    } else {
      regionUsed = "mixed";
    }
  } else {
    regionUsed = "mixed";
  }

  try {
    const items = await prisma.streamWeekly.findMany({
      where: { artistId, ...(regionFilter ? { region: regionFilter } : {}) },
      orderBy: [{ weekStart: "asc" }],
      select: { weekStart: true, streams: true },
    });

    const points = items.map((i) => ({
      weekStart: i.weekStart.toISOString().slice(0, 10),
      streams: i.streams,
    }));

    return NextResponse.json({
      points,
      regionUsed,
      availableRegions,
      hasMixedRegionsInResult: !regionFilter && availableRegions.length > 1,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        points: [],
        regionUsed: "mixed",
        availableRegions: [],
        hasMixedRegionsInResult: false,
        error: e?.message ?? "query failed",
      },
      { status: 200 }
    );
  }
}
