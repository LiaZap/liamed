import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDemoClinic() {
    console.log('🏥 Criando clínica de demonstração...');

    // 1. Create Demo Clinic
    const clinic = await prisma.clinic.create({
        data: {
            name: 'Clínica Saúde Integral',
            cnpj: '12.345.678/0001-90',
            address: 'Av. Paulista, 1500 - São Paulo, SP',
            phone: '(11) 3000-1234',
            email: 'contato@saudeintegral.med.br',
            status: 'ATIVO'
        }
    });
    console.log(`✅ Clínica criada: ${clinic.name} (${clinic.id})`);

    // 2. Create Gestor (Clinic Owner)
    const hashedPassword = await bcrypt.hash('gestor123', 10);
    const gestor = await prisma.user.create({
        data: {
            name: 'Dr. Carlos Silva',
            email: 'carlos@saudeintegral.med.br',
            password: hashedPassword,
            phone: '(11) 99999-0001',
            role: 'GESTOR',
            status: 'ATIVO',
            clinicId: clinic.id
        }
    });
    console.log(`✅ Gestor criado: ${gestor.name} (${gestor.email})`);

    // 3. Create Doctors for the clinic
    const doctors = [
        { name: 'Dra. Maria Fernandes', email: 'maria@saudeintegral.med.br', specialty: 'Cardiologista' },
        { name: 'Dr. João Oliveira', email: 'joao@saudeintegral.med.br', specialty: 'Clínico Geral' },
        { name: 'Dra. Ana Beatriz', email: 'ana@saudeintegral.med.br', specialty: 'Pediatra' }
    ];

    const createdDoctors = [];
    for (const doc of doctors) {
        const doctor = await prisma.user.create({
            data: {
                name: doc.name,
                email: doc.email,
                password: hashedPassword,
                biography: `${doc.specialty} - ${clinic.name}`,
                role: 'MEDICO',
                status: 'ATIVO',
                clinicId: clinic.id
            }
        });
        createdDoctors.push(doctor);
        console.log(`✅ Médico criado: ${doctor.name}`);
    }

    // 4. Create sample consults for the clinic
    const patients = [
        'Pedro Henrique Santos',
        'Clara Rodrigues Lima',
        'Lucas Gabriel Almeida',
        'Isabella Costa Ferreira',
        'Miguel Augusto Souza'
    ];

    const consultTypes = ['CONSULTA', 'RETORNO', 'EMERGENCIA'];
    const consultStatuses = ['AGENDADA', 'CONCLUIDA', 'CONCLUIDA', 'CONCLUIDA']; // More completed for demo

    for (let i = 0; i < 10; i++) {
        const randomDoctor = createdDoctors[Math.floor(Math.random() * createdDoctors.length)];
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
                doctorId: randomDoctor.id,
                doctorName: randomDoctor.name,
                clinicId: clinic.id,
                date,
                type: randomType,
                status: randomStatus
            }
        });
    }
    console.log('✅ 10 consultas de demonstração criadas');

    // 5. Create sample diagnoses
    const sampleDiagnoses = [
        {
            patient: 'Pedro Henrique Santos',
            prompt: 'Paciente apresenta dor torácica ao esforço, sudorese e falta de ar há 2 semanas.',
            response: `**EVOLUÇÃO MÉDICA - SOAP**

**S - Subjetivo:**
Paciente de 58 anos, masculino, refere dor torácica tipo aperto em região precordial, que irradia para membro superior esquerdo, desencadeada por esforço físico moderado (subir escadas). Quadro iniciou há 2 semanas com piora progressiva. Associado a sudorese e dispneia aos esforços. Nega síncope ou palpitações.

**O - Objetivo:**
- PA: 150/95 mmHg | FC: 88 bpm | FR: 18 irpm
- Ausculta cardíaca: B1 e B2 normofonéticas, sem sopros
- ECG: infradesnivelamento de ST em V4-V6

**A - Avaliação:**
Síndrome Coronariana Crônica (CID I25.1) - Angina estável

**P - Plano:**
1. Solicitar teste ergométrico e ecocardiograma
2. Iniciar AAS 100mg/dia + Sinvastatina 40mg/dia
3. Orientações sobre fatores de risco cardiovascular
4. Retorno em 15 dias com exames`
        }
    ];

    for (const diag of sampleDiagnoses) {
        const randomDoctor = createdDoctors[0]; // First doctor
        await prisma.diagnosis.create({
            data: {
                patientName: diag.patient,
                doctorId: randomDoctor.id,
                clinicId: clinic.id,
                userPrompt: diag.prompt,
                aiResponse: diag.response,
                model: 'gpt-4o-mini',
                status: 'ORIGINAL'
            }
        });
    }
    console.log('✅ Diagnósticos de demonstração criados');

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Credenciais da Clínica Demo:');
    console.log(`   Clínica: ${clinic.name}`);
    console.log(`   Gestor: carlos@saudeintegral.med.br / gestor123`);
    console.log(`   Médicos: maria@, joao@, ana@ / gestor123`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

async function main() {
    try {
        await seedDemoClinic();
    } catch (error) {
        console.error('❌ Erro no seed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
