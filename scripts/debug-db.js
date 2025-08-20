import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDB() {
  try {
    console.log('=== Database Debug Info ===\n');
    
    // Check if we can connect
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');
    
    // Check what tables exist by trying to query them
    console.log('2. Checking User table structure...');
    try {
      const users = await prisma.user.findMany({
        take: 1,
        select: {
          id: true,
          // Try to select all possible fields
          ...(await hasField('username') ? { username: true } : {}),
          ...(await hasField('email') ? { email: true } : {}),
          name: true,
          createdAt: true,
        }
      });
      console.log('✅ User table accessible');
      console.log('Sample user:', users[0] || 'No users found');
    } catch (error) {
      console.log('❌ Error accessing User table:', error.message);
    }
    
    // Check if username field exists
    console.log('\n3. Checking if username field exists...');
    try {
      const userWithUsername = await prisma.user.findFirst({
        where: { username: { not: null } }
      });
      if (userWithUsername) {
        console.log('✅ Username field exists and has data');
      } else {
        console.log('⚠️  Username field exists but is empty');
      }
    } catch (error) {
      console.log('❌ Username field does not exist:', error.message);
    }
    
    // Check if email field exists
    console.log('\n4. Checking if email field exists...');
    try {
      const userWithEmail = await prisma.user.findFirst({
        where: { email: { not: null } }
      });
      if (userWithEmail) {
        console.log('✅ Email field exists and has data');
        console.log('Sample email user:', userWithEmail);
      } else {
        console.log('⚠️  Email field exists but is empty');
      }
    } catch (error) {
      console.log('❌ Email field does not exist:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function hasField(fieldName) {
  try {
    await prisma.user.findFirst({
      select: { [fieldName]: true }
    });
    return true;
  } catch {
    return false;
  }
}

debugDB();
