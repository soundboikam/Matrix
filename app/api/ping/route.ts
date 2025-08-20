import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("=== Ping API Called ===");
    
    console.log("1. Attempting database connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful!");
    
    // Try a simple query
    console.log("2. Testing simple query...");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Simple query successful:", result);
    
    return NextResponse.json({
      success: true,
      message: "Database is reachable and working",
      timestamp: new Date().toISOString(),
      test: result
    });
    
  } catch (error: any) {
    console.error("Ping error:", error);
    
    // Check specific error types
    if (error.message.includes("Can't reach database server")) {
      return NextResponse.json({
        success: false,
        error: "Database server unreachable",
        details: error.message,
        suggestions: [
          "Check if Supabase database is actually running",
          "Verify connection string in Supabase dashboard",
          "Check for IP restrictions or firewall rules",
          "Try restarting the database in Supabase"
        ]
      }, { status: 503 });
    }
    
    if (error.message.includes("authentication failed")) {
      return NextResponse.json({
        success: false,
        error: "Authentication failed",
        details: error.message,
        suggestions: [
          "Check if database password is correct",
          "Verify connection string in Vercel environment variables"
        ]
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      success: false,
      error: error.message || "Unknown database error",
      type: "database_connection_error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
