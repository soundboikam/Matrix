import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    console.log("=== Setup API Called ===");
    
    // Check if any users exist
    const existingUsers = await prisma.user.count();
    
    if (existingUsers > 0) {
      return NextResponse.json({ 
        message: "Setup already completed", 
        userCount: existingUsers 
      });
    }
    
    console.log("No users found. Creating initial setup...");
    
    // Create the user
    const passwordHash = await bcrypt.hash("kamilek", 10);
    const user = await prisma.user.create({
      data: {
        email: "kam@matrix.local",
        name: "Kam",
        passwordHash: passwordHash,
      }
    });
    
    console.log("User created:", user.id);
    
    // Create a workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: "Matrix Team",
      }
    });
    
    console.log("Workspace created:", workspace.id);
    
    // Add user to workspace as admin
    await prisma.membership.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "admin",
      }
    });
    
    console.log("Membership created");
    
    return NextResponse.json({
      success: true,
      message: "Setup completed successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      loginCredentials: {
        email: "kam@matrix.local",
        password: "kamilek",
      }
    });
    
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json({ 
      error: error.message || "Setup failed" 
    }, { status: 500 });
  }
}
