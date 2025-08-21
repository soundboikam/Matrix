// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import crypto from "crypto";
import { parseCsv, type ParsedRow } from "@/utils/parseCsv";

const prisma = new PrismaClient();

function toISODateOnly(d: string | undefined): string | undefined {
  if (!d) return undefined;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return undefined;
  return dt.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
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

    const contentType = req.headers.get("content-type") || "";

    let rows: ParsedRow[] = [];
    let weekStartFallback: string | undefined;
    let dataType: "US" | "GLOBAL" = "US";
    let sourceFile: string | undefined;
    let fileHash: string | undefined;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      rows = (body.rows ?? []) as ParsedRow[];
      weekStartFallback = toISODateOnly(body.weekStart);
      dataType = body.dataType === "GLOBAL" ? "GLOBAL" : "US";
      sourceFile = body.sourceFile;
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });

      sourceFile = file.name;
      const buf = Buffer.from(await file.arrayBuffer());
      fileHash = crypto.createHash("sha256").update(buf).digest("hex");

      const text = buf.toString("utf8");
      rows = await parseCsv(text);

      weekStartFallback = toISODateOnly(form.get("weekStart") as string | undefined);
      const dt = (form.get("dataType") as string | null) || "US";
      dataType = dt.toUpperCase() === "GLOBAL" ? "GLOBAL" : "US";
    } else {
      return NextResponse.json({ error: "Unsupported content-type" }, { status: 415 });
    }

    if (!rows.length) {
      return NextResponse.json({ error: "No rows to import" }, { status: 400 });
    }

    let uploadId: string | undefined;
    if (fileHash) {
      const dup = await prisma.upload.findFirst({
        where: { workspaceId, fileHash },
        select: { id: true },
      });
      if (dup) {
        return NextResponse.json({ ok: true, skipped: true, reason: "identical file" });
      }
      const upload = await prisma.upload.create({
        data: {
          workspaceId,
          uploadedById: userId,
          fileHash,
          rowCount: rows.length,
        },
      });
      uploadId = upload.id;
    }

    let created = 0;
    let skipped = 0;
    const sourceTag = dataType.toLowerCase(); // "us" | "global"

    for (const r of rows) {
      const name = (r.artist || "").trim();
      if (!name) { skipped++; continue; }

      const weekISO = toISODateOnly(r.week) ?? weekStartFallback;
      if (!weekISO) { skipped++; continue; }

      const artist = await prisma.artist.upsert({
        where: { workspaceId_name: { workspaceId, name } },
        update: {},
        create: { name, workspaceId },
        select: { id: true },
      });

      try {
        await prisma.streamWeekly.create({
          data: {
            artistId: artist.id,
            weekStart: new Date(weekISO),
            source: sourceTag,
            streams: Math.max(0, Math.floor(Number(r.streams) || 0)),
            uploadId: uploadId ?? null,
          },
        });
        created++;
      } catch {
        // Unique conflict (artistId, weekStart, source)
        skipped++;
      }
    }

    return NextResponse.json({ ok: true, created, skipped, rows_in_file: rows.length, source: dataType });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
