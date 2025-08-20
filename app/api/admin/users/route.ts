import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id as string | undefined;
  
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if current user is admin (you can customize this logic)
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

  try {
    const body = await req.json();
    const { username, name, password, workspaceId } = body;

    if (!username || !name || !password) {
      return NextResponse.json({ error: "Username, name, and password required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        name,
        passwordHash,
      },
    });

    // Add user to workspace (default to first workspace if not specified)
    const targetWorkspaceId = workspaceId || currentUser.memberships[0]?.workspaceId;
    
    if (targetWorkspaceId) {
      await prisma.membership.create({
        data: {
          userId: user.id,
          workspaceId: targetWorkspaceId,
          role: "member", // Default role for new users
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, username: user.username, name: user.name } 
    });

  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
