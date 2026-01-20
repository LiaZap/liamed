import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixConsultClinicIds() {
    console.log('🔧 Corrigindo clinicId nas consultas...');

    // Find all consults without clinicId
    const consultsWithoutClinic = await prisma.consult.findMany({
        where: { clinicId: null }
    });

    console.log(`📋 Encontradas ${consultsWithoutClinic.length} consultas sem clinicId`);

    let fixed = 0;
    let skipped = 0;

    for (const consult of consultsWithoutClinic) {
        // Get the doctor's clinicId
        const doctor = await prisma.user.findUnique({
            where: { id: consult.doctorId },
            select: { clinicId: true, name: true }
        });

        if (doctor?.clinicId) {
            await prisma.consult.update({
                where: { id: consult.id },
                data: { clinicId: doctor.clinicId }
            });
            fixed++;
        } else {
            skipped++;
        }
    }

    console.log(`✅ ${fixed} consultas corrigidas`);
    console.log(`⏭️ ${skipped} consultas ignoradas (médico sem clínica)`);

    // Same for diagnoses
    console.log('\n🔧 Corrigindo clinicId nos diagnósticos...');

    const diagnosesWithoutClinic = await prisma.diagnosis.findMany({
        where: { clinicId: null }
    });

    console.log(`📋 Encontrados ${diagnosesWithoutClinic.length} diagnósticos sem clinicId`);

    let fixedDiag = 0;
    for (const diag of diagnosesWithoutClinic) {
        const doctor = await prisma.user.findUnique({
            where: { id: diag.doctorId },
            select: { clinicId: true }
        });

        if (doctor?.clinicId) {
            await prisma.diagnosis.update({
                where: { id: diag.id },
                data: { clinicId: doctor.clinicId }
            });
            fixedDiag++;
        }
    }

    console.log(`✅ ${fixedDiag} diagnósticos corrigidos`);

    console.log('\n🎉 Migração concluída!');
}

fixConsultClinicIds()
    .catch(e => { console.error('❌ Erro:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
