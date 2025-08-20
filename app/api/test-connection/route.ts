import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("=== Direct Connection Test ===");
    
    // Get the DATABASE_URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    console.log("DATABASE_URL exists:", !!databaseUrl);
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: "DATABASE_URL not found in environment"
      });
    }
    
    // Parse the connection string
    const url = new URL(databaseUrl);
    console.log("Host:", url.hostname);
    console.log("Port:", url.port);
    console.log("Database:", url.pathname);
    
    // Try to connect using native PostgreSQL client
    // For now, just return the parsed connection info
    return NextResponse.json({
      success: true,
      message: "Connection string parsed successfully",
      connection: {
        host: url.hostname,
        port: url.port,
        database: url.pathname.replace('/', ''),
        hasPassword: url.password ? 'Yes' : 'No',
        passwordLength: url.password ? url.password.length : 0
      },
      suggestions: [
        "Check if the host is correct in Supabase dashboard",
        "Verify the database is not paused or down",
        "Try restarting the database in Supabase",
        "Check for any IP restrictions or firewall rules"
      ]
    });
    
  } catch (error: any) {
    console.error("Connection test error:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message || "Connection test failed" 
    }, { status: 500 });
  }
}
