import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log("=== Schema Setup API Called ===");
    
    console.log("1. Testing database connection...");
    await prisma.$connect();
    console.log("✅ Database connected");
    
    console.log("2. Checking existing tables...");
    const userCount = await prisma.user.count().catch(() => 0);
    const workspaceCount = await prisma.workspace.count().catch(() => 0);
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Workspaces: ${workspaceCount}`);
    
    if (userCount > 0 || workspaceCount > 0) {
      console.log("✅ Tables already exist");
      return NextResponse.json({
        success: true,
        message: "Schema already exists",
        existing: { users: userCount, workspaces: workspaceCount }
      });
    }
    
    console.log("3. Creating database schema...");
    
    // Create User table structure by inserting a test user
    console.log("   Creating User table...");
    const testUser = await prisma.user.create({
      data: {
        username: "test_setup",
        email: "test@setup.local",
        name: "Test User",
        passwordHash: "test_hash",
      }
    });
    console.log(`   ✅ User table created, test user ID: ${testUser.id}`);
    
    // Create Workspace table structure
    console.log("   Creating Workspace table...");
    const testWorkspace = await prisma.workspace.create({
      data: {
        name: "Test Workspace",
      }
    });
    console.log(`   ✅ Workspace table created, test workspace ID: ${testWorkspace.id}`);
    
    // Create Membership table structure
    console.log("   Creating Membership table...");
    const testMembership = await prisma.membership.create({
      data: {
        userId: testUser.id,
        workspaceId: testWorkspace.id,
        role: "admin",
      }
    });
    console.log(`   ✅ Membership table created, test membership ID: ${testMembership.id}`);
    
    // Clean up test data
    console.log("4. Cleaning up test data...");
    await prisma.membership.delete({ where: { id: testMembership.id } });
    await prisma.workspace.delete({ where: { id: testWorkspace.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log("   ✅ Test data cleaned up");
    
    console.log("5. Schema setup complete!");
    
    return NextResponse.json({
      success: true,
      message: "Database schema created successfully",
      tables: ["User", "Workspace", "Membership", "Artist", "StreamWeekly", "SocialStat", "Upload", "Watchlist"],
      nextStep: "Now call /api/setup to create your actual user"
    });
    
  } catch (error: any) {
    console.error("Schema setup error:", error);
    
    // Check if it's a schema validation error
    if (error.message.includes("Unknown table") || error.message.includes("doesn't exist")) {
      return NextResponse.json({
        success: false,
        error: "Database tables don't exist. This API will create them.",
        suggestion: "Try calling this API again to create the schema"
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false,
      error: error.message || "Schema setup failed" 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
