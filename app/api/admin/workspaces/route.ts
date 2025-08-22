import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
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
        where: { role: "admin" },
        include: { workspace: true }
      }
    }
  });

  if (!currentUser || currentUser.memberships.length === 0) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    // Get workspaces where user is admin
    const workspaces = currentUser.memberships.map(m => m.workspace);
    
    return NextResponse.json({ workspaces });
  } catch (error: any) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json({ error: "Failed to fetch workspaces" }, { status: 500 });
  }
}
