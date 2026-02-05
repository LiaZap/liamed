
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const prompts = await prisma.prompt.findMany({
    where: { isActive: true },
    select: { id: true, name: true, category: true, isActive: true, content: true }
  });

  console.log('Active Prompts:');
  prompts.forEach(p => {
    console.log(`[${p.category}] ${p.name} (ID: ${p.id}) - Content: ${p.content.substring(0, 30)}...`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
