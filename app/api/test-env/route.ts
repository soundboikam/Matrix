import { NextResponse } from "next/server";

export async function GET() {
  const envVars = {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'SET' : 'MISSING',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET'
  };
  
  console.log('=== Environment Variables Check ===');
  console.log('NEXTAUTH_SECRET:', envVars.NEXTAUTH_SECRET);
  console.log('NEXTAUTH_URL:', envVars.NEXTAUTH_URL);
  console.log('DATABASE_URL:', envVars.DATABASE_URL);
  console.log('NODE_ENV:', envVars.NODE_ENV);
  
  return NextResponse.json({
    success: true,
    environment: envVars,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasDatabaseUrl: !!process.env.DATABASE_URL
  });
}
