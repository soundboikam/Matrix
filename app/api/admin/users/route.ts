import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// GET: List all users in admin's workspace
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
    // Get all users in admin's workspaces
    const adminWorkspaceIds = currentUser.memberships.map(m => m.workspaceId);
    
    const users = await prisma.user.findMany({
      where: {
        memberships: {
          some: {
            workspaceId: { in: adminWorkspaceIds }
          }
        }
      },
      include: {
        memberships: {
          where: {
            workspaceId: { in: adminWorkspaceIds }
          },
          include: {
            workspace: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST: Create new user
export async function POST(req: NextRequest) {
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

  try {
    const body = await req.json();
    const { username, name, email, password, workspaceId, role } = body;

    if (!username || !name || !password) {
      return NextResponse.json({ error: "Username, name, and password required" }, { status: 400 });
    }

    // Validate role
    if (role && !["member", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Must be 'member' or 'admin'" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    // Validate workspace access
    const adminWorkspaceIds = currentUser.memberships.map(m => m.workspaceId);
    const targetWorkspaceId = workspaceId || adminWorkspaceIds[0];
    
    if (!adminWorkspaceIds.includes(targetWorkspaceId)) {
      return NextResponse.json({ error: "Access denied to specified workspace" }, { status: 403 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        name,
        email: email || null,
        passwordHash,
      },
    });

    // Add user to workspace
    await prisma.membership.create({
      data: {
        userId: user.id,
        workspaceId: targetWorkspaceId,
        role: role || "member",
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        name: user.name,
        email: user.email 
      } 
    });

  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
