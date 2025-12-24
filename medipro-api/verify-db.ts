
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany();
    users.forEach(u => console.log(`${u.id} | ${u.name} | ${u.email} | ${u.role}`));

    console.log('\n--- CONSULTS ---');
    const consults = await prisma.consult.findMany();
    consults.forEach(c => console.log(`${c.id} | Patient: ${c.patientName} | DoctorID: ${c.doctorId} | Date: ${c.date}`));

    console.log(`\nTotal Users: ${users.length}`);
    console.log(`Total Consults: ${consults.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
