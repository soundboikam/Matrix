import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  // artists = distinct artists that currently have stream rows
  const distinct = await prisma.streamWeekly.findMany({
    distinct: ["artistId"],
    select: { artistId: true },
  });

  const uploads = await prisma.upload.count();
  const totalRows = await prisma.streamWeekly.count();

  return NextResponse.json({
    artists: distinct.length,
    uploads,
    totalRows,
  });
}
