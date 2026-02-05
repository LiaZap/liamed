import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Users, Stethoscope, Activity, Star,
    Calendar, Building2, RefreshCw, Trophy,
    ArrowUpRight, Clock
} from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts'
import api from "@/services/api"
import { toast } from "sonner"
import { useTheme } from "@/contexts/ThemeContext"

const COLORS = ['#0066CC', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

export default function ClinicDashboard() {
    const { theme } = useTheme()
    const isDark = theme === 'dark'

    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('7')
    const [stats, setStats] = useState<any>({
        users: 0,
        totalPatients: 0,
        consults: 0,
        diagnoses: 0,
        todayConsults: 0,
        teamPerformance: [],
        evolution: [],
        occupancyRate: 0,
        satisfactionIndex: 0
    })

    const fetchStats = async () => {
        setLoading(true)
        try {
            const response = await api.get(`/stats?days=${period}`)
            setStats(response.data)
        } catch (error) {
            console.error("Failed to fetch stats", error)
            toast.error("Erro ao carregar estatísticas")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [period])

    // Top 3 doctors
    const topDoctors = [...(stats.teamPerformance || [])]
        .sort((a: any, b: any) => b.consults - a.consults)
        .slice(0, 3)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                            Visão da Clínica
                        </h1>
                        <p className="text-muted-foreground">
                            Acompanhe o desempenho da sua equipe médica
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[140px] dark:bg-slate-800 dark:border-slate-700">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Últimos 7 dias</SelectItem>
                            <SelectItem value="15">Últimos 15 dias</SelectItem>
                            <SelectItem value="30">Últimos 30 dias</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchStats} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="shadow-sm dark:bg-[#222428] dark:border-slate-800">
                            <CardContent className="p-6">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-16 mb-1" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <>
                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Médicos</CardTitle>
                                <Stethoscope className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                    {stats.teamPerformance?.length || 0}
                                </div>
                                <p className="text-xs text-muted-foreground pt-1">
                                    Ativos na clínica
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up animate-delay-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total Consultas</CardTitle>
                                <Calendar className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                    {stats.consults}
                                </div>
                                <p className="text-xs text-muted-foreground pt-1 flex items-center">
                                    <span className="text-green-600 flex items-center mr-1 font-medium">
                                        <ArrowUpRight className="h-3 w-3 mr-0.5" /> +12%
                                    </span> vs mês anterior
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up animate-delay-200">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Consultas Hoje</CardTitle>
                                <Clock className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                    {stats.todayConsults}
                                </div>
                                <p className="text-xs text-muted-foreground pt-1">
                                    Realizadas hoje
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up animate-delay-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Diagnósticos IA</CardTitle>
                                <Activity className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                                    {stats.diagnoses}
                                </div>
                                <p className="text-xs text-muted-foreground pt-1">
                                    Assistidos por IA
                                </p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Ranking de Médicos */}
                <Card className="col-span-1 shadow-sm dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up animate-delay-400">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            <CardTitle className="text-lg dark:text-slate-50">Ranking de Médicos</CardTitle>
                        </div>
                        <CardDescription>Por número de consultas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="flex-1 space-y-1">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {topDoctors.map((doctor: any, index: number) => (
                                    <div key={doctor.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <div className={`
                                            h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm
                                            ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                                                index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                                                    'bg-gradient-to-br from-amber-600 to-amber-700'}
                                        `}>
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{doctor.name}</p>
                                            <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-slate-900 dark:text-slate-100">{doctor.consults}</p>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                <Star className="h-3 w-3 fill-current" />
                                                <span className="text-xs font-medium">{doctor.rating}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {topDoctors.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">Nenhum médico encontrado</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Consultas por Médico - Bar Chart */}
                <Card className="col-span-2 shadow-sm dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up animate-delay-500">
                    <CardHeader>
                        <CardTitle className="text-lg dark:text-slate-50">Consultas por Médico</CardTitle>
                        <CardDescription>Distribuição nos últimos {period} dias</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <Skeleton className="h-[250px] w-full rounded-lg" />
                        ) : (
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.teamPerformance || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#e5e7eb"} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: isDark ? '#94a3b8' : '#6b7280', fontSize: 11 }}
                                            tickFormatter={(value) => value.split(' ')[0]}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94a3b8' : '#6b7280', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: isDark ? '#0f172a' : '#fff',
                                                borderRadius: '8px',
                                                border: isDark ? '1px solid #1e293b' : '1px solid #e5e7eb',
                                                color: isDark ? '#f8fafc' : '#0f172a'
                                            }}
                                        />
                                        <Bar dataKey="consults" name="Consultas" fill="#0066CC" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Full Team List */}
            <Card className="shadow-sm dark:bg-[#222428] dark:border-slate-800 animate-fade-in-up animate-delay-600">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg dark:text-slate-50">Equipe Médica Completa</CardTitle>
                        <CardDescription>Todos os médicos da clínica</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-slate-300">
                        {stats.teamPerformance?.length || 0} médicos
                    </Badge>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {Array(6).fill(0).map((_, i) => (
                                <div key={i} className="p-4 border rounded-lg flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {(stats.teamPerformance || []).map((doctor: any, index: number) => (
                                <div
                                    key={doctor.id}
                                    className="p-4 border rounded-lg flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-100 dark:border-slate-700"
                                >
                                    <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-700 shadow-sm">
                                        <AvatarFallback className={`text-white font-bold ${COLORS[index % COLORS.length].replace('#', 'bg-[#')}`} style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                                            {doctor.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{doctor.name}</p>
                                        <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-slate-900 dark:text-slate-100">{doctor.consults}</p>
                                        <div className="flex items-center justify-end gap-1 text-yellow-500">
                                            <Star className="h-3 w-3 fill-current" />
                                            <span className="text-xs font-medium">{doctor.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(stats.teamPerformance?.length || 0) === 0 && (
                                <div className="col-span-full text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhum médico cadastrado</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
