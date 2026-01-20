import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Search,
    Download,
    X,
    Eye,
    ChevronLeft,
    ChevronRight,
    Trash2,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"

// Mock Data removed


import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportToCSV, exportToPDF } from "@/utils/exportUtils"
import api from "@/services/api"

import { CreateConsultationModal } from "@/components/consultations/CreateConsultationModal"
import { Plus } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

// ... imports ...

export default function Consultations() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'GESTOR';
    const [consultations, setConsultations] = useState<any[]>([])
    const [stats, setStats] = useState({ total: 0, scheduled: 0, completed: 0, cancelled: 0 })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const [typeFilter, setTypeFilter] = useState('all')

    // Details Modal State
    const [selectedConsult, setSelectedConsult] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [detailsLoading, setDetailsLoading] = useState(false)

    // Create Modal State
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    // Delete confirmation state
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    // Fetch Consults
    async function fetchConsultations() {
        setLoading(true)
        try {
            // Fetch stats separately to keep them global even when filtering table
            const statsResponse = await api.get('/consults/stats');
            setStats(statsResponse.data);

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter !== 'all') params.append('status', statusFilter === 'scheduled' ? 'AGENDADA' : statusFilter === 'completed' ? 'CONCLUIDA' : statusFilter === 'cancelled' ? 'CANCELADA' : statusFilter);
            if (typeFilter !== 'all') params.append('type', typeFilter === 'consultation' ? 'CONSULTA' : typeFilter === 'return' ? 'RETORNO' : typeFilter === 'emergency' ? 'EMERGENCIA' : typeFilter);

            const response = await api.get(`/consults?${params.toString()}`)
            setConsultations(response.data)
        } catch (error) {
            console.error("Failed to fetch consults", error)
            toast.error(t('consultations.toasts.load_error'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Add small debounce if searching
        const timeout = setTimeout(() => {
            fetchConsultations()
        }, 300)

        return () => clearTimeout(timeout)
    }, [searchTerm, statusFilter, typeFilter])

    const handleExport = (type: 'csv' | 'pdf') => {
        // ... handled existing ...
        if (consultations.length === 0) {
            toast.error(t('consultations.toasts.no_data_export'))
            return;
        }

        toast.info(t('consultations.toasts.generating_report'), {
            description: t('consultations.toasts.download_starting')
        })

        // Prepare Data
        const headers = [
            "ID",
            t('consultations.table.headers.patient'),
            t('consultations.table.headers.doctor'),
            t('consultations.table.headers.datetime'),
            t('consultations.table.headers.type'),
            t('consultations.table.headers.status')
        ];

        const data = consultations.map(c => [
            c.id,
            c.patient.name,
            c.doctor,
            `${c.date} ${c.time}`,
            c.type,
            c.status
        ]);

        if (type === 'csv') {
            exportToCSV(data, headers, 'report_consultations');
        } else {
            exportToPDF(data, headers, t('consultations.title'), 'report_consultations');
        }

        setTimeout(() => {
            toast.success(t('consultations.toasts.report_success'))
        }, 1000)
    }

    const handleViewDetails = async (id: string) => {
        setIsDetailsOpen(true)
        setDetailsLoading(true)
        try {
            const response = await api.get(`/consults/${id}`)
            setSelectedConsult(response.data)
        } catch (error) {
            console.error("Failed to fetch details", error)
            toast.error(t('consultations.toasts.details_error'))
            setIsDetailsOpen(false)
        } finally {
            setDetailsLoading(false)
        }
    }

    const handleUpdateStatus = async (newStatus: string) => {
        if (!selectedConsult) return;
        try {
            await api.patch(`/consults/${selectedConsult.id}/status`, { status: newStatus })
            toast.success(t('consultations.toasts.status_success'))

            // Update local state
            setSelectedConsult({ ...selectedConsult, status: newStatus })

            // Update list state locally to avoid refetch
            setConsultations(prev => prev.map(c => c.id === selectedConsult.id ? { ...c, status: newStatus } : c))

            // Refresh stats if needed
            fetchConsultations() // Just refresh everything to be safe and update stats
        } catch (error) {
            console.error("Failed to update status", error)
            toast.error(t('consultations.toasts.status_error'))
        }
    }

    const handleDelete = async (id: string) => {
        if (!isAdmin) {
            toast.error("Apenas administradores podem excluir consultas")
            return
        }

        try {
            await api.delete(`/consults/${id}`)
            toast.success("Consulta excluída com sucesso!")
            setDeleteConfirmId(null)
            fetchConsultations()
        } catch (error: any) {
            console.error("Failed to delete consultation", error)
            toast.error(error.response?.data?.error || "Erro ao excluir consulta")
        }
    }

    return (<>
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    {loading ? <Skeleton className="h-8 w-48 mb-2" /> : <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('consultations.title')}</h1>}
                    {loading ? <Skeleton className="h-4 w-64" /> : <p className="text-muted-foreground">{t('consultations.subtitle')}</p>}
                </div>
                <div className="flex gap-2">
                    {loading ? <Skeleton className="h-9 w-32" /> : (
                        <>
                            <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-[#0066CC] hover:bg-[#0055AA] text-white dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
                                <Plus className="h-4 w-4" /> {t('consultations.new_button')}
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2 bg-white dark:bg-slate-800 dark:border-slate-700">
                                        <Download className="h-4 w-4" /> {t('consultations.report_button')}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
                                        {t('common.export_csv')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
                                        {t('common.export_pdf')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>
            </div>

            {/* Section 1 - Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="shadow-sm dark:bg-[#222428] dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-16" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <>
                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400">
                                    {t('consultations.stats.total')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats.total}</div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground text-blue-600 dark:text-blue-400">
                                    {t('consultations.stats.scheduled')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.scheduled}</div>
                                <p className="text-xs text-muted-foreground mt-1">{t('consultations.stats.upcoming')}</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground text-green-600 dark:text-green-400">
                                    {t('consultations.stats.completed')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
                                <p className="text-xs text-muted-foreground mt-1">{t('consultations.stats.done')}</p>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all duration-300 dark:bg-[#222428] dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground text-red-600 dark:text-red-400">
                                    {t('consultations.stats.cancelled')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</div>
                                <p className="text-xs text-muted-foreground mt-1">{t('consultations.stats.not_done')}</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Section 2 - Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-[#222428] p-4 rounded-lg border dark:border-slate-800 shadow-sm">
                <div className="relative w-full flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('consultations.filters.search_placeholder')}
                        className="pl-9 dark:bg-slate-800 dark:border-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] dark:bg-slate-800 dark:border-slate-700">
                        <SelectValue placeholder={t('consultations.filters.all_status')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('consultations.filters.all')}</SelectItem>
                        <SelectItem value="scheduled">{t('consultations.filters.scheduled')}</SelectItem>
                        <SelectItem value="completed">{t('consultations.filters.completed')}</SelectItem>
                        <SelectItem value="cancelled">{t('consultations.filters.cancelled')}</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] dark:bg-slate-800 dark:border-slate-700">
                        <SelectValue placeholder={t('consultations.filters.all_types')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('consultations.filters.all')}</SelectItem>
                        <SelectItem value="consultation">{t('consultations.filters.consultation')}</SelectItem>
                        <SelectItem value="return">{t('consultations.filters.return')}</SelectItem>
                        <SelectItem value="emergency">{t('consultations.filters.emergency')}</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2 text-muted-foreground dark:bg-slate-800 dark:border-slate-700">
                    <X className="h-4 w-4" /> {t('consultations.filters.clear')}
                </Button>
            </div>

            {/* Section 3 - Table */}
            <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                    <strong>{loading ? '...' : consultations.length}</strong> {t('consultations.table.found_info', { count: consultations.length, total: stats.total }).replace(consultations.length.toString() + ' ', '').replace(' ' + stats.total.toString() + ' ', '')}
                </div>

                <div className="border rounded-lg bg-white dark:bg-[#222428] dark:border-slate-800 overflow-hidden shadow-sm">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                <TableRow className="dark:border-slate-800">
                                    <TableHead className="uppercase text-xs font-semibold dark:text-slate-400">{t('consultations.table.headers.patient')}</TableHead>
                                    <TableHead className="uppercase text-xs font-semibold dark:text-slate-400">{t('consultations.table.headers.doctor')}</TableHead>
                                    <TableHead className="uppercase text-xs font-semibold dark:text-slate-400">{t('consultations.table.headers.datetime')}</TableHead>
                                    <TableHead className="uppercase text-xs font-semibold hidden lg:table-cell dark:text-slate-400">{t('consultations.table.headers.type')}</TableHead>
                                    <TableHead className="uppercase text-xs font-semibold dark:text-slate-400">{t('consultations.table.headers.status')}</TableHead>
                                    <TableHead className="text-right uppercase text-xs font-semibold dark:text-slate-400">{t('consultations.table.headers.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i} className="dark:border-slate-800">
                                            <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-24" /></div></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><div className="space-y-1"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-16" /></div></TableCell>
                                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    consultations.length > 0 ? (
                                        consultations.map((consult) => (
                                            <TableRow key={consult.id} className="hover:bg-[#E6F2FF] dark:hover:bg-slate-800/50 transition-colors dark:border-slate-800">
                                                <TableCell className="py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8 border border-white dark:border-slate-700 shadow-sm">
                                                            <AvatarFallback className={`text-white text-xs ${consult.patient.color} dark:opacity-80`}>
                                                                {consult.patient.initial}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium text-sm text-slate-900 dark:text-slate-200">{consult.patient.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium text-slate-600 dark:text-slate-300">{consult.doctor}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">📅 {consult.date}</span>
                                                        <span className="flex items-center gap-1 text-xs">🕐 {consult.time}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 border-none font-normal text-[11px] uppercase">
                                                        {consult.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${consult.status === 'CONCLUÍDA' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : consult.status === 'CANCELADA' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-800 dark:bg-amber-900/30 dark:text-amber-300'} hover:bg-opacity-80 border-none font-normal text-[11px] uppercase`}>
                                                        {consult.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-blue-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200" onClick={() => handleViewDetails(consult.id)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {isAdmin && (
                                                            deleteConfirmId === consult.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30" onClick={() => handleDelete(consult.id)}>
                                                                        ✓
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" onClick={() => setDeleteConfirmId(null)}>
                                                                        ✕
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/30" onClick={() => setDeleteConfirmId(consult.id)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                {t('consultations.table.empty')}
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Cards (Visible below md) */}
                    <div className="md:hidden divide-y dark:divide-slate-800">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="p-4 space-y-3 dark:bg-slate-900">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-32" /></div>
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                    <Skeleton className="h-4 w-48" />
                                    <div className="flex justify-between items-center"><Skeleton className="h-3 w-24" /><Skeleton className="h-5 w-20" /></div>
                                </div>
                            ))
                        ) : (
                            consultations.map((consult) => (
                                <div key={consult.id} className="p-4 bg-white dark:bg-slate-900 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-white dark:border-slate-700 shadow-sm">
                                                <AvatarFallback className={`text-white text-xs ${consult.patient.color} dark:opacity-80`}>
                                                    {consult.patient.initial}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{consult.patient.name}</p>
                                                <p className="text-xs text-muted-foreground">{consult.type}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 dark:text-slate-400" onClick={() => handleViewDetails(consult.id)}>
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2 rounded">
                                        <span className="text-xs text-muted-foreground block mb-1">{t('consultations.details.doctor')}:</span>
                                        <span className="block font-medium text-black dark:text-slate-100">{consult.doctor}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            📅 {consult.date} 🕐 {consult.time}
                                        </span>
                                        <Badge className={`${consult.status === 'CONCLUÍDA' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : consult.status === 'CANCELADA' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-100 text-yellow-800 dark:bg-amber-900/30 dark:text-amber-300'} hover:bg-opacity-80 border-none font-normal text-[11px] uppercase`}>
                                            {consult.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-center p-4 border-t bg-white dark:bg-[#222428] dark:border-slate-800 gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs dark:bg-slate-800 dark:border-slate-700" disabled>
                            <ChevronLeft className="h-3 w-3 mr-1" /> {t('consultations.table.pagination.previous')}
                        </Button>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8 text-xs bg-[#0066CC] text-white hover:bg-[#0055AA] hover:text-white border-primary dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 dark:border-slate-50">1</Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-xs dark:text-slate-400 dark:hover:bg-slate-800">2</Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-xs dark:text-slate-400 dark:hover:bg-slate-800">3</Button>
                            <span className="text-xs text-muted-foreground px-1">...</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-xs dark:text-slate-400 dark:hover:bg-slate-800">8</Button>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-xs dark:bg-slate-800 dark:border-slate-700">
                            {t('consultations.table.pagination.next')} <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>


        {/* Create Modal */}
        <CreateConsultationModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSuccess={fetchConsultations}
        />

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle>{t('consultations.details.title')}</DialogTitle>
                    <DialogDescription>{t('consultations.details.subtitle')}</DialogDescription>
                </DialogHeader>

                {detailsLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : selectedConsult ? (
                    <ScrollArea className="flex-1 pr-4">
                        <div className="grid gap-6 py-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">{t('consultations.details.patient')}</Label>
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md border dark:border-slate-800">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-green-500 text-white text-xs">
                                                {selectedConsult.patientName?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-sm">{selectedConsult.patientName}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">{t('consultations.details.doctor')}</Label>
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md border dark:border-slate-800 font-medium text-sm">
                                        {selectedConsult.doctorName}
                                    </div>
                                </div>
                            </div>

                            {/* Date/Time/Type/Status */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('consultations.details.date')}</Label>
                                    <div className="text-sm font-medium">{new Date(selectedConsult.date).toLocaleDateString(t('language') === 'en' ? 'en-US' : 'pt-BR')}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('consultations.details.time')}</Label>
                                    <div className="text-sm font-medium">{new Date(selectedConsult.date).toLocaleTimeString(t('language') === 'en' ? 'en-US' : 'pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('consultations.details.type')}</Label>
                                    <div>
                                        <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">{selectedConsult.type}</Badge>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">{t('consultations.details.status')}</Label>
                                    <Select value={selectedConsult.status} onValueChange={handleUpdateStatus}>
                                        <SelectTrigger className="h-7 text-xs w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="AGENDADA">{t('consultations.filters.scheduled')}</SelectItem>
                                            <SelectItem value="CONCLUIDA">{t('consultations.filters.completed')}</SelectItem>
                                            <SelectItem value="CANCELADA">{t('consultations.filters.cancelled')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* AI Diagnosis Data */}
                            {selectedConsult.diagnosis ? (
                                <>
                                    <div className="space-y-2">
                                        <Label>{t('consultations.details.user_prompt')}</Label>
                                        <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800 p-3 rounded-md border whitespace-pre-wrap">
                                            {selectedConsult.diagnosis.userPrompt}
                                            {selectedConsult.diagnosis.complementaryData && (
                                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                                    <span className="font-semibold text-xs block mb-1">{t('consultations.details.complementary_data')}</span>
                                                    {selectedConsult.diagnosis.complementaryData}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('consultations.details.ai_response')}</Label>
                                        <div className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-md border whitespace-pre-wrap font-mono h-[300px] overflow-y-auto">
                                            {selectedConsult.diagnosis.aiResponse}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground bg-slate-50 dark:bg-slate-800 rounded-lg border border-dashed">
                                    {t('consultations.details.no_diagnosis')}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                ) : null}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>{t('consultations.details.close')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>)
}
