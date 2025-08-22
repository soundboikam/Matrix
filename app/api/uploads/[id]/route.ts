import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // delete stream rows for this upload, then the upload record
  await prisma.streamWeekly.deleteMany({ where: { uploadId: id } });
  await prisma.upload.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}


