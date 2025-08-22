import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('=== Checking Production Database Users ===\n');
    
    // Check if we can connect
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');
    
    // List all users
    console.log('2. Listing all users in database:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
        // Try to see if passwordHash exists
        passwordHash: true,
      }
    });
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      console.log(`✅ Found ${users.length} user(s):`);
      users.forEach((user, index) => {
        console.log(`   User ${index + 1}:`);
        console.log(`     ID: ${user.id}`);
        console.log(`     Username: ${user.username || 'N/A'}`);
        console.log(`     Email: ${user.email || 'N/A'}`);
        console.log(`     Name: ${user.name || 'N/A'}`);
        console.log(`     Created: ${user.createdAt}`);
        console.log(`     Has Password: ${user.passwordHash ? 'Yes' : 'No'}`);
        console.log('');
      });
    }
    
    // Check if we can query by username
    console.log('3. Testing username query...');
    try {
      const testUser = await prisma.user.findFirst({
        where: { username: { not: null } }
      });
      if (testUser) {
        console.log('✅ Found user with username:', testUser.username);
        console.log(`   Name: ${testUser.name || 'N/A'}`);
        console.log(`   Has Password: ${testUser.passwordHash ? 'Yes' : 'No'}`);
      } else {
        console.log('❌ No users with username found');
      }
    } catch (error) {
      console.log('❌ Error querying by username:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
