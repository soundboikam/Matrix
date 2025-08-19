// app/api/star/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { artistId, star } = await req.json().catch(() => ({} as any));
  if (!artistId) return NextResponse.json({ error: "artistId required" }, { status: 400 });

  // Check existing star
  const existing = await prisma.watchlist.findUnique({
    where: { userId_artistId: { userId, artistId } }, // @@unique([userId, artistId]) in schema
  });

  // If `star` provided, use it; otherwise toggle
  const want = typeof star === "boolean" ? star : !Boolean(existing);

  if (want) {
    if (!existing) await prisma.watchlist.create({ data: { userId, artistId } });
    return NextResponse.json({ ok: true, starred: true });
  } else {
    if (existing) await prisma.watchlist.delete({ where: { userId_artistId: { userId, artistId } } });
    return NextResponse.json({ ok: true, starred: false });
  }
}


