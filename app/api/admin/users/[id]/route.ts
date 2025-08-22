import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/authOptions";

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

  // Check if current user is admin
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        where: { role: "admin" }
      }
    }
  });

  if (!currentUser || currentUser.memberships.length === 0) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const targetUserId = params.id;

  // Prevent admin from deleting themselves
  if (targetUserId === userId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  try {
    // Check if target user exists and is in admin's workspace
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        memberships: {
          where: {
            workspaceId: { in: currentUser.memberships.map(m => m.workspaceId) }
          }
        }
      }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.memberships.length === 0) {
      return NextResponse.json({ error: "User not in your workspace" }, { status: 403 });
    }

    // Delete user's memberships first
    await prisma.membership.deleteMany({
      where: { userId: targetUserId }
    });

    // Delete user's watchlist entries
    await prisma.watchlist.deleteMany({
      where: { userId: targetUserId }
    });

    // Delete the user
    await prisma.user.delete({
      where: { id: targetUserId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
