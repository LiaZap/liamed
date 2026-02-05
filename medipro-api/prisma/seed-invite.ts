import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const inviteCode = 'TEST-CODE-123';
  
  // Clean up existing test clinic (if any)
  await prisma.clinic.deleteMany({
    where: { inviteCode }
  });

  const clinic = await prisma.clinic.create({
    data: {
      name: 'Clínica de Teste Automatizado',
      inviteCode: inviteCode,
      address: 'Rua de Teste, 123',
      phone: '11999999999'
    }
  });

  console.log(`Created test clinic with invite code: ${inviteCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
