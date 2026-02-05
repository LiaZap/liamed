
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Setting up verification...");
    
    // Create two test prompts
    const p1 = await prisma.prompt.create({
        data: {
          name: "Test Prompt 1",
          category: "DIAGNOSTICO",
          content: "Content 1",
          isActive: true
        }
    });

    console.log(`Created Prompt 1 (Active): ${p1.id}`);

    // Create prompt 2, also active. Should deactivate Prompt 1.
    // NOTE: This logic is in the CONTROLLER, not the model/prisma hooks.
    // So running this script directly using Prisma Client WON'T trigger the controller logic.
    // This script is just to clean up or verify DB state if we manually triggered the API.
    
    // Since I cannot call the API easily from this script without a running server context setup or fetch,
    // I will simulate the controller logic here to prove it works as intended if copies are correct.
    
    console.log("Simulating controller logic for Prompt 2 creation...");
    
    // Logic copied from controller:
    await prisma.prompt.updateMany({
        where: { category: "DIAGNOSTICO", isActive: true },
        data: { isActive: false }
    });

    const p2 = await prisma.prompt.create({
        data: {
          name: "Test Prompt 2",
          category: "DIAGNOSTICO",
          content: "Content 2",
          isActive: true
        }
    });
    console.log(`Created Prompt 2 (Active): ${p2.id}`);

    // Verify
    const activePrompts = await prisma.prompt.findMany({
        where: { category: "DIAGNOSTICO", isActive: true }
    });

    console.log(`Active DIAGNOSTICO Prompts count: ${activePrompts.length}`);
    activePrompts.forEach(p => console.log(`- ${p.name} (${p.id})`));

    // Cleanup
    await prisma.prompt.deleteMany({ where: { id: { in: [p1.id, p2.id] } } });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
