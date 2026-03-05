import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';


interface AuthRequest extends Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
}

export const getStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!dbUser) { return res.status(404).json({ error: 'User not found' }); }

        const userRole = dbUser.role;
        const userClinicId = dbUser.clinicId;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let whereClause: any = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let diagnosisWhereClause: any = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let userWhereClause: any = { role: 'MEDICO', status: 'ATIVO' };

        // Filter based on role
        if (userRole === 'ADMIN') {
            // Admin sees everything
        } else if (userRole === 'GESTOR' && userClinicId) {
            // GESTOR sees only their clinic's data
            whereClause = { clinicId: userClinicId };
            diagnosisWhereClause = { clinicId: userClinicId };
            userWhereClause = { ...userWhereClause, clinicId: userClinicId };
        } else {
            // MEDICO sees only their own data
            whereClause = { doctorId: userId };
            diagnosisWhereClause = { doctorId: userId };
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const validUserId = userId || ''; // Ensure string

        // For GESTOR, count only users in their clinic
        const usersCount = userRole === 'GESTOR' && userClinicId
            ? await prisma.user.count({ where: { clinicId: userClinicId } })
            : await prisma.user.count();
        const consultsCount = await prisma.consult.count({ where: whereClause });
        const diagnosesCount = await prisma.diagnosis.count({ where: diagnosisWhereClause });

        // --- Calculate Unique Patients ---
        // Since we don't have a distinct count easily available in one simple call without grouping,
        // we can use findMany with distinct if supported or grouping.
        const distinctPatients = await prisma.consult.groupBy({
            by: ['patientName'],
            where: whereClause,
            _count: {
                patientName: true
            }
        });
        const totalPatients = distinctPatients.length;

        // --- Today Consults ---
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayConsults = await prisma.consult.count({
            where: {
                ...whereClause,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });


        // --- Recent Consults ---
        const recentConsultsRaw = await prisma.consult.findMany({
            where: whereClause,
            take: 5,
            orderBy: { date: 'desc' }
        });

        const recentConsults = recentConsultsRaw.map(c => ({
            id: c.id,
            patientName: c.patientName,
            doctorName: c.doctorName,
            type: c.type,
            status: c.status,
            date: new Date(c.date).toLocaleDateString('pt-BR'),
            time: new Date(c.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            value: 250
        }));

        // --- Medical Team Stats (filtered by clinic for GESTOR) ---
        const doctors = await prisma.user.findMany({
            where: userWhereClause,
            select: {
                id: true,
                name: true,
                role: true,
                _count: {
                    select: { consults: true }
                }
            }
        });

        const medicalTeam = doctors.map(d => ({
            id: d.id,
            name: d.name,
            role: 'Clínico Geral', // Mock specialty details
            consults: d._count.consults,
            status: 'online' // Mock online status
        })).sort((a, b) => b.consults - a.consults);

        // --- Weekly Evolution (Consults) ---
        const today = new Date();
        const evolution: { name: string, consultas: number }[] = [];
        const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        // Helper to get day name
        const getDayName = (d: Date) => daysOfWeek[d.getDay()];

        const daysParam = req.query.days ? parseInt(req.query.days as string) : 7;

        // Single query instead of N separate count queries
        const periodStart = new Date(today);
        periodStart.setDate(today.getDate() - (daysParam - 1));
        periodStart.setHours(0, 0, 0, 0);

        const dailyCounts = await prisma.consult.groupBy({
            by: ['date'],
            where: {
                ...whereClause,
                date: { gte: periodStart }
            },
            _count: { id: true }
        });

        // Build a map of date -> count
        const countMap = new Map<string, number>();
        dailyCounts.forEach(row => {
            const key = new Date(row.date).toISOString().split('T')[0];
            countMap.set(key, (countMap.get(key) || 0) + row._count.id);
        });

        for (let i = daysParam - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toISOString().split('T')[0];

            evolution.push({
                name: daysParam > 7 ? `${d.getDate()}/${d.getMonth() + 1}` : getDayName(d),
                consultas: countMap.get(key) || 0
            });
        }

        // --- New Patients Evolution (Last 30 Days) ---
        const allPatientFirstVisits = await prisma.consult.groupBy({
            by: ['patientName'],
            where: whereClause,
            _min: {
                date: true
            }
        });

        // --- Admin Specific Stats ---
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let teamPerformance: any[] = [];
        let occupancyRate = 0;
        let satisfactionIndex = 0;

        if (userRole === 'ADMIN' || userRole === 'GESTOR') {
            // Team Performance (List of Doctors) - filtered by clinic for GESTOR
            const teamWhereClause = userRole === 'GESTOR' && userClinicId
                ? { role: 'MEDICO' as const, clinicId: userClinicId }
                : { role: 'MEDICO' as const };

            const teamDoctors = await prisma.user.findMany({
                where: teamWhereClause,
                select: {
                    id: true,
                    name: true,
                    status: true,
                    clinicId: true
                }
            });

            occupancyRate = 78; // Mock value for now
            satisfactionIndex = 4.8; // Mock value for now

            // Single aggregation instead of N+1 queries
            const consultCounts = await prisma.consult.groupBy({
                by: ['doctorId'],
                where: {
                    doctorId: { in: teamDoctors.map(d => d.id) },
                    ...(userRole === 'GESTOR' && userClinicId ? { clinicId: userClinicId } : {})
                },
                _count: { id: true }
            });

            const countByDoctor = new Map(consultCounts.map(c => [c.doctorId, c._count.id]));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            teamPerformance = teamDoctors.map((doc: any) => ({
                id: doc.id,
                name: doc.name,
                specialty: "Clínico Geral",
                consults: countByDoctor.get(doc.id) || 0,
                rating: (4 + (doc.name.length % 10) / 10).toFixed(1),
                status: doc.status
            }));
        }

        const newPatientsEvolution: { name: string, novosPacientes: number }[] = [];
        const newPatientsMap = new Map<string, number>();

        allPatientFirstVisits.forEach(p => {
            if (p._min.date) {
                const dateStr = p._min.date.toISOString().split('T')[0];
                newPatientsMap.set(dateStr, (newPatientsMap.get(dateStr) || 0) + 1);
            }
        });

        for (let i = daysParam - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            newPatientsEvolution.push({
                name: daysParam > 7 ? `${d.getDate()}/${d.getMonth() + 1}` : getDayName(d),
                novosPacientes: newPatientsMap.get(dateStr) || 0
            });
        }



        // --- Clinic Info for Gestor ---
        let clinicInfo = null;
        if (userRole === 'GESTOR' && userClinicId) {
            const clinic = await prisma.clinic.findUnique({
                where: { id: userClinicId },
                select: { name: true, inviteCode: true }
            });
            if (clinic) clinicInfo = clinic;
        }

        const stats = {
            users: usersCount,
            totalPatients,
            todayConsults,
            consults: consultsCount,
            diagnoses: diagnosesCount,
            revenue: consultsCount * 250,
            avgTime: 28,
            occupancyRate,
            satisfactionIndex,
            teamPerformance,
            recentConsults,
            evolution,
            newPatientsEvolution,
            medicalTeam,
            clinic: clinicInfo,
            performance: {
                occupancyRate: 85,
                avgTime: 28,
                satisfaction: 4.8
            }
        };

        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
    }
};
