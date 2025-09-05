const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    const result = await prisma.$queryRaw`SELECT DATABASE() as current_db`;
    console.log('Current database:', result[0].current_db);
    
    const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM User`;
    console.log('User count in current database:', userCount[0].count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();