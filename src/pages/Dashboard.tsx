import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, Users, Calendar, ArrowUpRight } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"

// Mock data removed


import api from "@/services/api"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { Progress } from "@/components/ui/progress"
import { AnimatedCounter } from "@/components/ui/animated-counter"

export default function Dashboard() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>({ consults: 0, diagnoses: 0, revenue: 0, avgTime: 0, recentConsults: [], evolution: [], todayConsults: 0 })
    const [period, setPeriod] = useState('7')
    const { isDark } = useTheme()
    const { t } = useTranslation();

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await api.get(`/stats?days=${period}`)
                setStats(response.data)
            } catch (error) {
                console.error("Failed to fetch stats", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [period])

    const handleDownloadReport = () => {
        toast.info("Gerando relatório PDF...", { description: "Preparando documento profissional..." })

        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const primaryColor: [number, number, number] = [0, 102, 204] // LIAMED Blue
        const accentColor: [number, number, number] = [16, 185, 129] // Green
        const grayColor: [number, number, number] = [100, 116, 139]

        // ===== HEADER WITH BRANDING =====
        doc.setFillColor(...primaryColor)
        doc.rect(0, 0, pageWidth, 35, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text('LIAMED', 14, 18)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('Inteligência Clínica', 14, 26)

        doc.setFontSize(10)
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 14, 18, { align: 'right' })
        doc.text(`Período: Últimos ${period} dias`, pageWidth - 14, 26, { align: 'right' })

        // ===== REPORT TITLE =====
        doc.setTextColor(30, 41, 59)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('Relatório de Performance Médica', 14, 50)

        doc.setDrawColor(...primaryColor)
        doc.setLineWidth(0.5)
        doc.line(14, 54, 100, 54)

        // ===== SUMMARY CARDS (4 METRICS) =====
        const cardY = 62
        const cardWidth = 42
        const cardHeight = 25
        const cardGap = 6

        const metrics = [
            { label: 'Pacientes', value: stats.totalPatients || 0, color: primaryColor },
            { label: 'Consultas', value: stats.consults || 0, color: [139, 92, 246] as [number, number, number] },
            { label: 'Diagnósticos IA', value: stats.diagnoses || 0, color: [249, 115, 22] as [number, number, number] },
            { label: 'Consultas Hoje', value: stats.todayConsults || 0, color: accentColor }
        ]

        metrics.forEach((metric, i) => {
            const x = 14 + (cardWidth + cardGap) * i

            // Card background
            doc.setFillColor(248, 250, 252)
            doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, 'F')

            // Colored top border
            doc.setFillColor(...metric.color)
            doc.rect(x, cardY, cardWidth, 3, 'F')

            // Value
            doc.setTextColor(...metric.color)
            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.text(String(metric.value), x + cardWidth / 2, cardY + 14, { align: 'center' })

            // Label
            doc.setTextColor(...grayColor)
            doc.setFontSize(8)
            doc.setFont('helvetica', 'normal')
            doc.text(metric.label, x + cardWidth / 2, cardY + 21, { align: 'center' })
        })

        // ===== FINANCIAL SUMMARY =====
        const financeY = cardY + cardHeight + 10
        doc.setFillColor(240, 253, 244) // Light green bg
        doc.roundedRect(14, financeY, pageWidth - 28, 20, 3, 3, 'F')

        doc.setTextColor(21, 128, 61)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Receita Estimada do Período:', 20, financeY + 12)
        doc.setFontSize(16)
        doc.text(`R$ ${(stats.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 20, financeY + 12, { align: 'right' })

        // ===== EVOLUTION TABLE =====
        doc.setTextColor(30, 41, 59)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Evolução de Consultas', 14, financeY + 35)

        const evoRows = (stats.evolution || []).map((e: any) => [
            e.name,
            e.consultas || 0,
            e.consultas > 0 ? '●' : '○'
        ])

        autoTable(doc, {
            head: [['Dia', 'Consultas', 'Status']],
            body: evoRows.length > 0 ? evoRows : [['Sem dados', '-', '-']],
            startY: financeY + 40,
            theme: 'plain',
            headStyles: {
                fillColor: [...primaryColor] as [number, number, number],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                halign: 'center'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { fontStyle: 'bold', halign: 'left' },
                2: { textColor: accentColor }
            }
        })

        // ===== TEAM PERFORMANCE =====
        const teamY = (doc as any).lastAutoTable.finalY + 15

        if (stats.teamPerformance && stats.teamPerformance.length > 0) {
            doc.setTextColor(30, 41, 59)
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text('Desempenho da Equipe Médica', 14, teamY)

            const teamRows = stats.teamPerformance.map((d: any) => [
                d.name,
                d.specialty || 'Clínico Geral',
                d.consults,
                `★ ${d.rating}`
            ])

            autoTable(doc, {
                head: [['Médico', 'Especialidade', 'Consultas', 'Avaliação']],
                body: teamRows,
                startY: teamY + 5,
                theme: 'plain',
                headStyles: {
                    fillColor: [139, 92, 246] as [number, number, number],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                columnStyles: {
                    3: { textColor: [234, 179, 8] as [number, number, number], fontStyle: 'bold' }
                }
            })
        }

        // ===== FOOTER =====
        const footerY = doc.internal.pageSize.getHeight() - 20
        doc.setDrawColor(226, 232, 240)
        doc.line(14, footerY, pageWidth - 14, footerY)

        doc.setTextColor(...grayColor)
        doc.setFontSize(8)
        doc.text('LIAMED - Inteligência Clínica | Relatório gerado automaticamente', 14, footerY + 8)
        doc.text(`${user?.name || 'Administrador'} | ${user?.email || ''}`, pageWidth - 14, footerY + 8, { align: 'right' })

        // ===== SAVE =====
        doc.save(`LIAMED_Relatorio_${period}dias_${new Date().toISOString().split('T')[0]}.pdf`)

        setTimeout(() => toast.success("Relatório PDF profissional baixado!"), 1000)
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    {loading ? (
                        <Skeleton className="h-8 w-48 mb-2" />
                    ) : (
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('dashboard.title')}</h1>
                    )}
                    {loading ? (
                        <Skeleton className="h-4 w-64" />
                    ) : (
                        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {loading ? <Skeleton className="h-9 w-32" /> : (
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[180px] dark:bg-slate-800 dark:border-slate-700">
                                <Calendar className="mr-2 h-4 w-4" />
                                <SelectValue placeholder={t('dashboard.period_selector')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">{t('dashboard.last_7_days')}</SelectItem>
                                <SelectItem value="15">{t('dashboard.last_15_days')}</SelectItem>
                                <SelectItem value="30">{t('dashboard.last_30_days')}</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                    {loading ? <Skeleton className="h-9 w-32" /> : (
                        <Button className="bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" onClick={handleDownloadReport}>
                            <ArrowUpRight className="mr-2 h-4 w-4" /> {t('dashboard.new_report')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-[#222428]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4 rounded-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16 mb-2" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <>
                        {/* Card 1: Patients (Replaces Avg Time or similar) */}
                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.total_patients')}</CardTitle>
                                <Users className="h-4 w-4 text-blue-600 dark:text-slate-50" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                    <AnimatedCounter value={stats.totalPatients || 0} />
                                </div>
                                <p className="text-xs text-muted-foreground pt-1 flex items-center">
                                    <span className="text-green-600 dark:text-green-400 flex items-center mr-1 font-medium"><ArrowUpRight className="h-3 w-3 mr-0.5" /> {t('dashboard.active_in_base')}</span>
                                </p>
                            </CardContent>
                        </Card>

                        {/* Card 2: Consults (Total) */}
                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up animate-delay-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.total_consults')}</CardTitle>
                                <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                    <AnimatedCounter value={stats.consults || 0} />
                                </div>
                                <p className="text-xs text-muted-foreground pt-1 flex items-center">
                                    <span className="text-green-600 dark:text-green-400 flex items-center mr-1 font-medium"><ArrowUpRight className="h-3 w-3 mr-0.5" /> +12%</span> {t('dashboard.vs_last_month')}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Card 3: Consults Today (New!) */}
                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up animate-delay-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.consults_today')}</CardTitle>
                                <Activity className="h-4 w-4 text-blue-500 dark:text-slate-50" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                    <AnimatedCounter value={stats.todayConsults || 0} />
                                </div>
                                <p className="text-xs text-muted-foreground pt-1 flex items-center">
                                    {t('dashboard.scheduled_today')}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Card 3: Diagnoses */}
                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up animate-delay-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.ai_diagnoses')}</CardTitle>
                                <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                    <AnimatedCounter value={stats.diagnoses || 0} />
                                </div>
                                <p className="text-xs text-muted-foreground pt-1 flex items-center">
                                    <span className="text-green-600 dark:text-green-400 flex items-center mr-1 font-medium"><ArrowUpRight className="h-3 w-3 mr-0.5" /> +24%</span> {t('dashboard.avg_accuracy')} 98%
                                </p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Chart 1: Consultas */}
                <Card className="col-span-4 shadow-sm dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up animate-delay-400">
                    <CardHeader>
                        {loading ? <Skeleton className="h-6 w-48 mb-2" /> : <CardTitle className="dark:text-slate-50">{t('dashboard.chart_evolution')}</CardTitle>}
                        {loading ? <Skeleton className="h-4 w-64" /> : <CardDescription>{t('dashboard.chart_evolution_desc', { days: period })}</CardDescription>}
                    </CardHeader>
                    <CardContent className="pl-2">
                        {loading ? (
                            <Skeleton className="h-[250px] w-full rounded-lg" />
                        ) : (
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.evolution || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorConsultas" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={isDark ? "#f8fafc" : "#0066CC"} stopOpacity={0.1} />
                                                <stop offset="95%" stopColor={isDark ? "#f8fafc" : "#0066CC"} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#e5e7eb"} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#6b7280', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#6b7280', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: isDark ? '#0f172a' : '#fff',
                                                borderRadius: '8px',
                                                border: isDark ? '1px solid #1e293b' : '1px solid #e5e7eb',
                                                color: isDark ? '#f8fafc' : '#0f172a'
                                            }}
                                            itemStyle={{ color: isDark ? '#f8fafc' : '#0066CC', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="consultas" stroke={isDark ? "#f8fafc" : "#0066CC"} strokeWidth={2} fillOpacity={1} fill="url(#colorConsultas)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Chart 2: Novos Pacientes (New!) */}
                <Card className="col-span-3 shadow-sm dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up animate-delay-500">
                    <CardHeader>
                        {loading ? <Skeleton className="h-6 w-48 mb-2" /> : <CardTitle className="dark:text-slate-50">{t('dashboard.chart_new_users')}</CardTitle>}
                        {loading ? <Skeleton className="h-4 w-64" /> : <CardDescription>{t('dashboard.chart_new_users_desc')}</CardDescription>}
                    </CardHeader>
                    <CardContent className="pl-2">
                        {loading ? (
                            <Skeleton className="h-[250px] w-full rounded-lg" />
                        ) : (
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.newPatientsEvolution || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#e5e7eb"} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#6b7280', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#6b7280', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: isDark ? '#0f172a' : '#fff',
                                                borderRadius: '8px',
                                                border: isDark ? '1px solid #1e293b' : '1px solid #e5e7eb',
                                                color: isDark ? '#f8fafc' : '#0f172a'
                                            }}
                                            itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="novosPacientes" name="Novos Pacientes" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPatients)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Consults & Medical Team */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {/* Recent Consultations */}
                <Card className="shadow-sm dark:bg-[#222428] dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold dark:text-slate-50">{t('dashboard.recent_consults')}</CardTitle>
                        <div className="text-xs text-muted-foreground">1 de 16 <span className="mx-1">›</span></div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <div key={i} className="border rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-5 w-16" />
                                        </div>
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                ))
                            ) : (
                                (stats.recentConsults || []).map((consult: any, i: number) => (
                                    <div key={i} className="border rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{consult.patientName}</h4>
                                            <span className="bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                                {consult.status || 'CONCLUÍDA'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs text-muted-foreground">
                                                {consult.doctorName || 'Dr. Tiago Carlos Sulzbach'} • {consult.type?.toLowerCase()}
                                            </p>
                                            <p className="text-xs text-slate-500 font-medium">
                                                {consult.date} às {consult.time}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div className="pt-2 text-center text-xs text-muted-foreground border-t dark:border-slate-800 mt-4">
                                Total: {stats.consults} consultas
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Medical Team */}
                <Card className="shadow-sm dark:bg-[#222428] dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold dark:text-slate-50">{t('dashboard.medical_team')}</CardTitle>
                        <div className="flex items-center gap-1">
                            <span className="h-6 w-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-bold">MT</span>
                            <span className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold dark:bg-slate-800 dark:text-slate-300">TS</span>
                            <span className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">IC</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-3 w-32" />
                                            <Skeleton className="h-2 w-20" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                (stats.teamPerformance || []).map((doctor: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${i === 0 ? 'bg-green-600' :
                                                i === 1 ? 'bg-teal-500' :
                                                    i === 2 ? 'bg-purple-500' :
                                                        i === 3 ? 'bg-cyan-500' : 'bg-lime-500'
                                                }`}>
                                                {doctor.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{doctor.name}</p>
                                                <p className="text-xs text-muted-foreground">{doctor.specialty || 'Clínico Geral'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{doctor.consults} consultas</span>
                                            <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-bold dark:bg-yellow-900/30 dark:text-yellow-400">
                                                ★ {doctor.rating}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            {(!stats.teamPerformance || stats.teamPerformance.length === 0) && !loading && (
                                <p className="text-sm text-center text-muted-foreground py-4">{t('dashboard.no_team_data')}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Indicators - Only for Admin */}
            {user?.role === 'ADMIN' && (
                <Card className="shadow-sm dark:bg-[#222428] dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold dark:text-slate-50">{t('dashboard.performance_indicators')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('dashboard.occupancy_rate')}</span>
                                </div>
                                <Progress value={stats.occupancyRate || 0} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-blue-600 dark:bg-slate-100" />
                                <p className="text-xs text-muted-foreground mt-2">{stats.occupancyRate || 0}% das consultas agendadas</p>
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('dashboard.avg_time')}</span>
                                </div>
                                <Progress value={((stats.avgTime || 28) / 60) * 100} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-blue-500 dark:bg-slate-300" />
                                <p className="text-xs text-muted-foreground mt-2">{stats.avgTime || 28} minutos em média</p>
                            </div>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('dashboard.satisfaction_index')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-50">{stats.satisfactionIndex || 0}</span>
                                    <span className="text-xs text-muted-foreground">/ 5.0</span>
                                </div>
                                <Progress value={(stats.satisfactionIndex || 0) * 20} className="h-2 bg-slate-100 dark:bg-slate-800" indicatorClassName="bg-yellow-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>

    )
}
