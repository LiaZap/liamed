import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function populateClinicData() {
    console.log('📅 Populando dados para apresentação...');

    // 1. Find or create the demo clinic
    let clinic = await prisma.clinic.findFirst({
        where: { cnpj: '12.345.678/0001-90' }
    });

    if (!clinic) {
        clinic = await prisma.clinic.create({
            data: {
                name: 'Clínica Saúde Integral',
                cnpj: '12.345.678/0001-90',
                address: 'Av. Paulista, 1500 - São Paulo, SP',
                phone: '(11) 3000-1234',
                email: 'contato@saudeintegral.med.br',
                status: 'ATIVO'
            }
        });
        console.log(`✅ Clínica criada: ${clinic.name}`);
    } else {
        console.log(`✅ Clínica encontrada: ${clinic.name}`);
    }

    const hashedPassword = await bcrypt.hash('gestor123', 10);

    // 2. Find or create Gestor
    let gestor = await prisma.user.findUnique({ where: { email: 'carlos@saudeintegral.med.br' } });
    if (!gestor) {
        gestor = await prisma.user.create({
            data: {
                name: 'Dr. Carlos Silva',
                email: 'carlos@saudeintegral.med.br',
                password: hashedPassword,
                role: 'GESTOR',
                status: 'ATIVO',
                clinicId: clinic.id
            }
        });
        console.log(`✅ Gestor criado: ${gestor.name}`);
    } else {
        // Update clinicId if missing
        if (!gestor.clinicId) {
            await prisma.user.update({ where: { id: gestor.id }, data: { clinicId: clinic.id } });
        }
        console.log(`✅ Gestor encontrado: ${gestor.name}`);
    }

    // 3. Find or create doctors
    const doctorData = [
        { name: 'Dra. Maria Fernandes', email: 'maria@saudeintegral.med.br' },
        { name: 'Dr. João Oliveira', email: 'joao@saudeintegral.med.br' },
        { name: 'Dra. Ana Beatriz', email: 'ana@saudeintegral.med.br' }
    ];

    const doctors = [gestor]; // Include gestor in doctors for consults

    for (const d of doctorData) {
        let doctor = await prisma.user.findUnique({ where: { email: d.email } });
        if (!doctor) {
            doctor = await prisma.user.create({
                data: {
                    name: d.name,
                    email: d.email,
                    password: hashedPassword,
                    role: 'MEDICO',
                    status: 'ATIVO',
                    clinicId: clinic.id
                }
            });
            console.log(`✅ Médico criado: ${doctor.name}`);
        } else {
            if (!doctor.clinicId) {
                await prisma.user.update({ where: { id: doctor.id }, data: { clinicId: clinic.id } });
            }
            console.log(`✅ Médico encontrado: ${doctor.name}`);
        }
        doctors.push(doctor);
    }

    // 4. Create consultations
    const patients = [
        'Ana Clara Ribeiro', 'Bruno Henrique Costa', 'Carla Mendes Silva',
        'Daniel Ferreira Lima', 'Eduarda Santos Oliveira', 'Fernando Gomes',
        'Gabriela Nascimento', 'Henrique Martins', 'João Pedro Almeida'
    ];

    const types = ['CONSULTA', 'RETORNO', 'EMERGENCIA'];
    const statuses = ['CONCLUIDA', 'CONCLUIDA', 'CONCLUIDA', 'AGENDADA'];

    let count = 0;
    for (const doctor of doctors) {
        const numConsults = 5 + Math.floor(Math.random() * 4);

        for (let i = 0; i < numConsults; i++) {
            const patient = patients[Math.floor(Math.random() * patients.length)];
            const type = types[Math.floor(Math.random() * types.length)] as any;
            const status = statuses[Math.floor(Math.random() * statuses.length)] as any;

            const daysAgo = Math.floor(Math.random() * 30);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);

            await prisma.consult.create({
                data: {
                    patientName: patient,
                    doctorId: doctor.id,
                    doctorName: doctor.name,
                    clinicId: clinic.id,
                    date,
                    type,
                    status
                }
            });
            count++;
        }
    }
    console.log(`✅ ${count} consultas criadas`);

    // 5. Create diagnoses
    for (const doctor of doctors) {
        const patient = patients[Math.floor(Math.random() * patients.length)];
        await prisma.diagnosis.create({
            data: {
                patientName: patient,
                doctorId: doctor.id,
                clinicId: clinic.id,
                userPrompt: 'Paciente com sintomas gripais e febre',
                aiResponse: '**Hipótese:** Síndrome gripal\n\n**Conduta:** Repouso e hidratação.',
                model: 'gpt-4',
                status: 'ORIGINAL'
            }
        });
    }
    console.log(`✅ Diagnósticos criados`);

    console.log('\n🎉 Dados prontos para apresentação!');
}

populateClinicData()
    .catch(e => { console.error('❌ Erro:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
