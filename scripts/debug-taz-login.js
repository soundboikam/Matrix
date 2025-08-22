import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function debugTazLogin() {
  try {
    console.log('=== Debugging Taz User Login ===\n');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected\n');
    
    // Check if user exists
    console.log('1. Looking for user "taz"...');
    const user = await prisma.user.findUnique({
      where: { username: 'taz' },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        passwordHash: true,
        createdAt: true,
        memberships: {
          include: {
            workspace: true
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ User "taz" not found in database');
      return;
    }
    
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Email: ${user.email || 'N/A'}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Has Password Hash: ${user.passwordHash ? 'Yes' : 'No'}`);
    console.log(`   Password Hash Length: ${user.passwordHash?.length || 0}\n`);
    
    // Check user memberships
    console.log('2. Checking user memberships...');
    if (user.memberships.length === 0) {
      console.log('   ❌ User has no workspace memberships');
      console.log('   This could cause authentication issues!');
    } else {
      console.log(`   ✅ User has ${user.memberships.length} membership(s):`);
      user.memberships.forEach((m, i) => {
        console.log(`      ${i + 1}. Workspace: ${m.workspace.name}, Role: ${m.role}`);
      });
    }
    
    // Test password verification
    console.log('\n3. Testing password verification...');
    const testPassword = 'music1234';
    const passwordMatch = await bcrypt.compare(testPassword, user.passwordHash);
    
    console.log(`   Test Password: ${testPassword}`);
    console.log(`   Password Match: ${passwordMatch ? '✅ Yes' : '❌ No'}`);
    
    if (!passwordMatch) {
      console.log('\n4. Password verification failed!');
      console.log(`   Stored Hash: ${user.passwordHash}`);
      console.log(`   Hash starts with: ${user.passwordHash?.substring(0, 10)}...`);
      
      // Try to create a new hash with the same password
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log(`   New Hash for '${testPassword}': ${newHash}`);
      console.log(`   New Hash starts with: ${newHash.substring(0, 10)}...`);
      
      console.log('\n5. SUGGESTION: The password hash might be corrupted or wrong.');
      console.log('   You may need to reset the password for user "taz".');
    }
    
    // Compare with working user "kam"
    console.log('\n6. Comparing with working user "kam"...');
    const kamUser = await prisma.user.findUnique({
      where: { username: 'kam' },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        memberships: {
          include: {
            workspace: true
          }
        }
      }
    });
    
    if (kamUser) {
      console.log('✅ User "kam" found:');
      console.log(`   ID: ${kamUser.id}`);
      console.log(`   Username: ${kamUser.username}`);
      console.log(`   Has Password Hash: ${kamUser.passwordHash ? 'Yes' : 'No'}`);
      console.log(`   Password Hash Length: ${kamUser.passwordHash?.length || 0}`);
      console.log(`   Memberships: ${kamUser.memberships.length}`);
      
      if (kamUser.memberships.length > 0) {
        console.log(`   Workspace: ${kamUser.memberships[0].workspace.name}`);
        console.log(`   Role: ${kamUser.memberships[0].role}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugTazLogin();
