const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking existing users in database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        createdAt: true,
      }
    });
    
    console.log('Found users:', users);
    console.log('Total users:', users.length);
    
    // Check if testuser3@rezom.org exists
    const testUser = await prisma.user.findUnique({
      where: { email: 'testuser3@rezom.org' },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        passwordHash: true,
      }
    });
    
    if (testUser) {
      console.log('testuser3@rezom.org exists:', { 
        ...testUser, 
        passwordHash: testUser.passwordHash ? 'EXISTS' : 'MISSING'
      });
    } else {
      console.log('testuser3@rezom.org does NOT exist');
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();