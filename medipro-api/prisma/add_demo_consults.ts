import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMoreConsults() {
    console.log('📅 Adicionando mais consultas para a clínica demo...');

    // Find the demo clinic
    const clinic = await prisma.clinic.findFirst({
        where: { cnpj: '12.345.678/0001-90' }
    });

    if (!clinic) {
        console.log('❌ Clínica demo não encontrada. Execute seed_clinic.ts primeiro.');
        return;
    }

    // Find doctors in the clinic
    const doctors = await prisma.user.findMany({
        where: { clinicId: clinic.id, role: { in: ['MEDICO', 'GESTOR'] } }
    });

    if (doctors.length === 0) {
        console.log('❌ Nenhum médico encontrado na clínica.');
        return;
    }

    console.log(`✅ Clínica encontrada: ${clinic.name}`);
    console.log(`✅ Médicos encontrados: ${doctors.map(d => d.name).join(', ')}`);

    // Patient names for demo
    const patients = [
        'Ana Clara Ribeiro', 'Bruno Henrique Costa', 'Carla Mendes Silva',
        'Daniel Ferreira Lima', 'Eduarda Santos Oliveira', 'Fernando Gomes Alves',
        'Gabriela Nascimento', 'Henrique Martins', 'Isabela Rodrigues',
        'João Pedro Almeida', 'Karina Souza', 'Leonardo Pereira',
        'Mariana Costa', 'Nicolas Fernandes', 'Olivia Barros'
    ];

    const consultTypes = ['CONSULTA', 'RETORNO', 'EMERGENCIA'];
    const consultStatuses = ['CONCLUIDA', 'CONCLUIDA', 'CONCLUIDA', 'AGENDADA']; // 75% completed

    let createdCount = 0;

    // Create 5-8 consults PER DOCTOR
    for (const doctor of doctors) {
        const numConsults = 5 + Math.floor(Math.random() * 4); // 5-8 consults each

        for (let i = 0; i < numConsults; i++) {
            const randomPatient = patients[Math.floor(Math.random() * patients.length)];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const randomType = consultTypes[Math.floor(Math.random() * consultTypes.length)] as any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const randomStatus = consultStatuses[Math.floor(Math.random() * consultStatuses.length)] as any;

            // Random date in the last 30 days
            const daysAgo = Math.floor(Math.random() * 30);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);
            date.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 4) * 15, 0, 0);

            await prisma.consult.create({
                data: {
                    patientName: randomPatient,
                    doctorId: doctor.id,
                    doctorName: doctor.name,
                    clinicId: clinic.id,
                    date,
                    type: randomType,
                    status: randomStatus
                }
            });
            createdCount++;
        }
        console.log(`   ✅ ${doctor.name}: consultas adicionadas`);
    }

    // Also create some diagnoses for each doctor
    const samplePrompts = [
        { prompt: 'Paciente com cefaleia persistente há 5 dias', diagnosis: 'Cefaleia tensional' },
        { prompt: 'Dor abdominal difusa e náuseas', diagnosis: 'Gastrite' },
        { prompt: 'Tosse seca há 2 semanas com febre baixa', diagnosis: 'Infecção respiratória' },
        { prompt: 'Dor lombar irradiando para perna direita', diagnosis: 'Lombalgia com ciatalgia' }
    ];

    for (const doctor of doctors) {
        const diag = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
        const patient = patients[Math.floor(Math.random() * patients.length)];

        await prisma.diagnosis.create({
            data: {
                patientName: patient,
                doctorId: doctor.id,
                clinicId: clinic.id,
                userPrompt: diag.prompt,
                aiResponse: `**Hipótese Diagnóstica:**\n${diag.diagnosis}\n\n**Conduta:**\nAcompanhamento clínico e exames complementares conforme necessário.`,
                model: 'gpt-4',
                status: 'ORIGINAL'
            }
        });
    }
    console.log(`   ✅ Diagnósticos adicionados para cada médico`);

    console.log(`\n🎉 Total: ${createdCount} novas consultas criadas!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

addMoreConsults()
    .catch((e) => {
        console.error('❌ Erro:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
