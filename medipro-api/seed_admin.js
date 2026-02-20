const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const hash = await bcrypt.hash('123456', 10);
    const user = await prisma.user.upsert({
      where: { email: 'admin2@medipro.com' },
      update: {
        password: hash,
        role: 'ADMIN',
      },
      create: {
        email: 'admin2@medipro.com',
        name: 'Admin Teste',
        password: hash,
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user added/updated:', user.email);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
