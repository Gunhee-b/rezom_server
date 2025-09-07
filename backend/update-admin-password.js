const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

async function updateAdminPassword() {
  const prisma = new PrismaClient();

  try {
    console.log('Updating admin password...');
    
    // Hash the new password
    const passwordHash = await argon2.hash('Admin!2345');
    
    // Update admin user
    const admin = await prisma.user.update({
      where: {
        email: 'admin@rezom.org'
      },
      data: {
        passwordHash: passwordHash,
        role: 'ADMIN',  // Ensure role is ADMIN
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Admin user updated:', {
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
      console.log('✅ User role:', testUser.role);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminPassword();