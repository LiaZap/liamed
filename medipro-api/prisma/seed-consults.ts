import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding consultations...');

    const doctorEmail = 'tiago.carlos.sulzbach@gmail.com';
    const doctor = await prisma.user.findUnique({
        where: { email: doctorEmail }
    });

    if (!doctor) {
        console.error('❌ Médico não encontrado!');
        return;
    }

    const consultsData = [
        {
            patientName: 'Fernanda Oliveira',
            date: new Date('2025-12-20T09:00:00'),
            type: 'CONSULTA',
            status: 'AGENDADA'
        },
        {
            patientName: 'Roberto Almeida',
            date: new Date('2025-12-20T10:30:00'),
            type: 'RETORNO',
            status: 'AGENDADA'
        },
        {
            patientName: 'Amanda Costa',
            date: new Date('2025-12-19T14:15:00'),
            type: 'CONSULTA',
            status: 'CONCLUIDA'
        },
        {
            patientName: 'Lucas Pereira',
            date: new Date('2025-12-19T11:00:00'),
            type: 'EMERGENCIA',
            status: 'CONCLUIDA'
        },
        {
            patientName: 'Patrícia Souza',
            date: new Date('2025-12-18T16:45:00'),
            type: 'CONSULTA',
            status: 'CANCELADA'
        },
        {
            patientName: 'Marcos Silva',
            date: new Date('2025-12-21T08:30:00'),
            type: 'CONSULTA',
            status: 'AGENDADA'
        }
    ];

    for (const data of consultsData) {
        await prisma.consult.create({
            data: {
                ...data,
                type: data.type as any,
                status: data.status as any,
                doctorId: doctor.id,
                doctorName: doctor.name
            }
        });
    }

    console.log(`✅ ${consultsData.length} consultas criadas com sucesso!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
