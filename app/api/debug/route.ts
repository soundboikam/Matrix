import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("=== Debug API Called ===");
    
    // Test database connection
    await prisma.$connect();
    console.log("✅ Database connected");
    
    // Check if User table exists and what's in it
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible. Found ${userCount} users`);
    
    let users = [];
    if (userCount > 0) {
      users = await prisma.user.findMany({
        take: 3, // Limit to first 3 users
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          // Try to select username if it exists
          ...(await hasField('username') ? { username: true } : {}),
        }
      });
    }
    
    // Check if username field exists
    const hasUsernameField = await hasField('username');
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        userCount,
        hasUsernameField,
      },
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        ...(hasUsernameField && { username: (user as any).username }),
      })),
      schema: {
        expectedFields: ['id', 'email', 'name', 'passwordHash', 'createdAt', 'username'],
        actualFields: hasUsernameField ? ['id', 'email', 'name', 'passwordHash', 'createdAt', 'username'] : ['id', 'email', 'name', 'passwordHash', 'createdAt'],
      }
    });
    
  } catch (error: any) {
    console.error("Debug error:", error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      database: {
        connected: false,
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function hasField(fieldName: string): Promise<boolean> {
  try {
    await prisma.user.findFirst({
      select: { [fieldName]: true }
    });
    return true;
  } catch {
    return false;
  }
}
