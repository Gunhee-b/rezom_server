const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

async function createAdmin() {
  const prisma = new PrismaClient();

  try {
    console.log('Creating admin user...');
    
    // Hash the password
    const passwordHash = await argon2.hash('Admin!2345');
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@rezom.org',
        passwordHash: passwordHash,
        displayName: 'Rezom Admin',
        role: 'ADMIN',
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Admin user created:', {
      id: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role
    });
    
    // Test login
    const testUser = await prisma.user.findUnique({
      where: { email: 'admin@rezom.org' }
    });
    
    if (testUser) {
      const isValid = await argon2.verify(testUser.passwordHash, 'Admin!2345');
      console.log('✅ Password verification test:', isValid ? 'PASSED' : 'FAILED');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();