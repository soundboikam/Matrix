import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUser() {
  try {
    // Update the existing user to have username 'kam'
    const updatedUser = await prisma.user.update({
      where: { email: 'kam@matrix.local' },
      data: {
        username: 'kam',
        email: null, // Remove email since it's now optional
      },
    });
    
    console.log('User updated successfully:', updatedUser);
    
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUser();
