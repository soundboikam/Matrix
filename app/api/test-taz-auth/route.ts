import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    
    console.log(`=== Testing direct auth for user: ${username} ===`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        passwordHash: true,
        memberships: {
          include: {
            workspace: true
          }
        }
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
    
    console.log(`✅ User found:`, {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      hasPasswordHash: !!user.passwordHash,
      memberships: user.memberships.length
    });
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`🔐 Password match: ${passwordMatch ? '✅ Yes' : '❌ No'}`);
    
    if (!passwordMatch) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid password",
        step: "password_check"
      });
    }
    
    // Check memberships
    if (user.memberships.length === 0) {
      console.log(`❌ User ${username} has no workspace memberships`);
      return NextResponse.json({ 
        success: false, 
        error: "User has no workspace access",
        step: "membership_check"
      });
    }
    
    console.log(`✅ User ${username} authenticated successfully`);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        memberships: user.memberships
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
