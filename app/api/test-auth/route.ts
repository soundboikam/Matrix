import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    console.log(`=== Testing Auth for user: ${username} ===`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        passwordHash: true
      }
    });
    
    if (!user) {
      console.log(`❌ User ${username} not found`);
      return NextResponse.json({ 
        success: false, 
        error: "User not found",
        step: "user_lookup"
      });
    }
    
    console.log(`✅ User found: ${user.username}`);
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password match: ${passwordMatch ? '✅ Yes' : '❌ No'}`);
    
    if (!passwordMatch) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid password",
        step: "password_check"
      });
    }
    
    // Check environment variables
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
    
    console.log(`Environment check:`);
    console.log(`  NEXTAUTH_SECRET: ${hasNextAuthSecret ? '✅ Set' : '❌ Missing'}`);
    console.log(`  NEXTAUTH_URL: ${hasNextAuthUrl ? '✅ Set' : '❌ Missing'}`);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email
      },
      environment: {
        hasNextAuthSecret,
        hasNextAuthUrl
      }
    });
    
  } catch (error: any) {
    console.error("Auth test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
