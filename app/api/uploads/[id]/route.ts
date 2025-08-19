import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";

const prisma = new PrismaClient();

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const uploadId = params.id;

  // Load upload + workspace
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    select: { id: true, workspaceId: true, uploadedById: true },
  });
  if (!upload) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Confirm user belongs to workspace and is admin or the uploader
  const membership = await prisma.membership.findFirst({
    where: { userId, workspaceId: upload.workspaceId },
    select: { role: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "No access to this workspace" }, { status: 403 });
  }
  const isAdmin = (membership.role || "").toLowerCase() === "admin";
  const isUploader = upload.uploadedById === userId;
  if (!isAdmin && !isUploader) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete rows then the upload
  const rowsDel = await prisma.streamWeekly.deleteMany({ where: { uploadId } });
  await prisma.upload.delete({ where: { id: uploadId } });

  return NextResponse.json({ ok: true, deleted_rows: rowsDel.count, deleted_upload: uploadId });
}


