
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const prompt = await prisma.prompt.findFirst({
    where: { category: 'DIAGNOSTICO', isActive: true },
  });

  if (prompt) {
      console.log('--- CURRENT PROMPT CONTENT ---');
      console.log(prompt.content);
      console.log('--- END PROMPT CONTENT ---');
  } else {
      console.log('No active diagnosis prompt found.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
