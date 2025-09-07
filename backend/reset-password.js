const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    console.log('Resetting password for testuser3@rezom.org...');
    
    // Hash the password "testtest3"
    const passwordHash = await argon2.hash('testtest3');
    console.log('Generated password hash:', passwordHash);
    
    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { email: 'testuser3@rezom.org' },
      data: { passwordHash },
      select: {
        id: true,
        email: true,
        displayName: true,
      }
    });
    
    console.log('Password updated successfully for:', updatedUser);
    console.log('New credentials:');
    console.log('  Email: testuser3@rezom.org');
    console.log('  Password: testtest3');
    
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();