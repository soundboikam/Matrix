import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load the production environment variables (from .env.vercel)
dotenv.config({ path: '.env.vercel' });

const prisma = new PrismaClient();

async function checkProductionUsers() {
  try {
    console.log('=== Checking Production Database Users ===\n');
    
    console.log('1. Environment variables:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing'}\n`);
    
    console.log('2. Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected\n');
    
    console.log('3. Checking existing tables...');
    const userCount = await prisma.user.count();
    const workspaceCount = await prisma.workspace.count();
    
    console.log(`   Users: ${userCount}`);
    console.log(`   Workspaces: ${workspaceCount}\n`);
    
    if (userCount > 0) {
      console.log('4. Listing existing users:');
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          createdAt: true,
        }
      });
      
      users.forEach((user, index) => {
        console.log(`   User ${index + 1}:`);
        console.log(`     ID: ${user.id}`);
        console.log(`     Username: ${user.username || 'N/A'}`);
        console.log(`     Email: ${user.email || 'N/A'}`);
        console.log(`     Name: ${user.name || 'N/A'}`);
        console.log(`     Created: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('4. No users found in production database.');
      console.log('   This means the local setup didn\'t affect production.');
    }
    
    if (workspaceCount > 0) {
      console.log('5. Listing existing workspaces:');
      const workspaces = await prisma.workspace.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
        }
      });
      
      workspaces.forEach((workspace, index) => {
        console.log(`   Workspace ${index + 1}:`);
        console.log(`     ID: ${workspace.id}`);
        console.log(`     Name: ${workspace.name}`);
        console.log(`     Created: ${workspace.createdAt}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionUsers();
