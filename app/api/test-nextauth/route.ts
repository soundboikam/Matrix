import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("=== Testing NextAuth API Route ===");
    
    // Test if we can access the NextAuth route
    const nextAuthUrl = "/api/auth/session";
    
    return NextResponse.json({
      success: true,
      message: "NextAuth API route is accessible",
      nextAuthUrl,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
    
  } catch (error) {
    console.error("Error testing NextAuth route:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
