import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('=== Testing Login for User "taz" ===\n');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected\n');
    
    // Check if user exists
    console.log('1. Checking if user "taz" exists...');
    const user = await prisma.user.findUnique({
      where: { username: 'taz' },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        passwordHash: true,
        createdAt: true
      }
    });
    
    if (!user) {
      console.log('❌ User "taz" not found in database');
      console.log('\n2. Listing all users:');
      const allUsers = await prisma.user.findMany({
        select: { username: true, name: true, email: true }
      });
      
      if (allUsers.length === 0) {
        console.log('   No users found in database');
      } else {
        allUsers.forEach((u, i) => {
          console.log(`   ${i + 1}. Username: ${u.username}, Name: ${u.name || 'N/A'}, Email: ${u.email || 'N/A'}`);
        });
      }
      return;
    }
    
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email || 'N/A'}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Has Password Hash: ${user.passwordHash ? 'Yes' : 'No'}\n`);
    
    // Test password verification
    console.log('2. Testing password verification...');
    const testPassword = 'music1234';
    const passwordMatch = await bcrypt.compare(testPassword, user.passwordHash);
    
    console.log(`   Test Password: ${testPassword}`);
    console.log(`   Password Match: ${passwordMatch ? '✅ Yes' : '❌ No'}\n`);
    
    // Check user memberships
    console.log('3. Checking user memberships...');
    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      include: { workspace: true }
    });
    
    if (memberships.length === 0) {
      console.log('   ❌ User has no workspace memberships');
    } else {
      console.log(`   ✅ User has ${memberships.length} membership(s):`);
      memberships.forEach((m, i) => {
        console.log(`      ${i + 1}. Workspace: ${m.workspace.name}, Role: ${m.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
