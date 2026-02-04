import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
    user?: any;
}

export const getStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const userClinicId = req.user.clinicId;

        let whereClause: any = {};
        let diagnosisWhereClause: any = {};
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

        for (let i = daysParam - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            d.setHours(0, 0, 0, 0);

            const nextD = new Date(d);
            nextD.setDate(d.getDate() + 1);

            const count = await prisma.consult.count({
                where: {
                    ...whereClause,
                    date: {
                        gte: d,
                        lt: nextD
                    }
                }
            });

            evolution.push({
                name: daysParam > 7 ? `${d.getDate()}/${d.getMonth() + 1}` : getDayName(d),
                consultas: count
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

            // For GESTOR, only count consults within their clinic
            teamPerformance = await Promise.all(teamDoctors.map(async (doc: any) => {
                const consultCount = await prisma.consult.count({
                    where: {
                        doctorId: doc.id,
                        ...(userRole === 'GESTOR' && userClinicId ? { clinicId: userClinicId } : {})
                    }
                });

                return {
                    id: doc.id,
                    name: doc.name,
                    specialty: "Clínico Geral", // Mock, needs field in DB or relation
                    consults: consultCount,
                    rating: (4 + Math.random()).toFixed(1), // Mock rating
                    status: doc.status
                };
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
    } catch (error) {
           console.error("New Patients Calculation Error", error);
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
