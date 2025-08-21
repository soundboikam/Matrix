// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { parseCsv, type ParsedRow } from "@/utils/parseCsv";

const prisma = new PrismaClient();

function toISO(d: string | undefined): string | undefined {
  if (!d) return undefined;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's workspace
    const membership = await prisma.membership.findFirst({
      where: { userId },
      select: { workspaceId: true },
    });
    if (!membership) {
      return NextResponse.json({ error: "No workspace found" }, { status: 400 });
    }
    const { workspaceId } = membership;

    let rows: ParsedRow[] = [];
    let weekStartFallback: string | undefined;
    let dataType: "US" | "GLOBAL" | undefined;
    let sourceFile: string | undefined;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      rows = (body.rows ?? []) as ParsedRow[];
      weekStartFallback = toISO(body.weekStart);
      dataType = body.dataType ?? "US";
      sourceFile = body.sourceFile;
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
      const text = await file.text();
      rows = await parseCsv(text);
      weekStartFallback = toISO(form.get("weekStart") as string | undefined);
      dataType = (form.get("dataType") as "US" | "GLOBAL") ?? "US";
      sourceFile = file.name;
    } else {
      return NextResponse.json({ error: "Unsupported content-type" }, { status: 415 });
    }

    if (!rows.length) {
      return NextResponse.json({ error: "No rows to import" }, { status: 400 });
    }

    let created = 0;

    for (const r of rows) {
      const week = toISO(r.week) ?? weekStartFallback;
      if (!r.artist || !week) continue;

      const artist = await prisma.artist.upsert({
        where: { 
          workspaceId_name: { 
            workspaceId,
            name: r.artist 
          }
        },
        update: {},
        create: { 
          name: r.artist,
          workspaceId
        },
      });

      await prisma.streamWeekly.upsert({
        where: {
          artistId_weekStart_source: {
            artistId: artist.id,
            weekStart: new Date(week),
            source: "upload",
          },
        },
        update: { 
          streams: r.streams, 
          region: dataType!,
          source: "upload"
        },
        create: {
          artistId: artist.id,
          weekStart: new Date(week),
          streams: r.streams,
          region: dataType!,
          source: "upload",
        },
      });

      created++;
    }

    return NextResponse.json({ ok: true, created });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}



