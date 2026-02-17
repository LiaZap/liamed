import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportToCSV, exportToPDF } from "@/utils/exportUtils"
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, RefreshCw, Filter, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from "react-i18next";

interface AuditLog {
    id: string;
    userName: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ipAddress?: string;
    createdAt: string;
    user?: {
        name: string;
        email: string;
    };
}

export default function AuditLogs() {
    const { t } = useTranslation();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const fetchLogs = async (currentPage = 1) => {
        setLoading(true);
        try {
            const params = {
                page: String(currentPage),
                limit: '20',
                search,
                action: actionFilter
            };

            const response = await api.get('/audit', { params });

            setLogs(response.data.data);
            setTotalPages(response.data.pagination.pages);
            setTotal(response.data.pagination.total);
            setPage(response.data.pagination.page);

        } catch (error) {
            console.error('Fetch audit logs error:', error);
            toast.error('Erro ao carregar logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, actionFilter]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchLogs(newPage);
        }
    };

    const handleViewDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setIsDetailsOpen(true);
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
            case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-slate-300';
            case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
            case 'LOGIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
            case 'USE_PROMO_CODE': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    const handleExport = (type: 'csv' | 'pdf') => {
        if (logs.length === 0) {
            toast.error(t('consultations.toasts.no_data_export')) // reusing existing key or create generic
            return;
        }

        toast.info(t('consultations.toasts.generating_report'), {
            description: t('consultations.toasts.download_starting')
        })

        const headers = [
            "ID",
            t('audit.table.date'),
            t('audit.table.user'),
            t('audit.table.action'),
            t('audit.table.resource'),
            t('audit.table.details')
        ];

        const data = logs.map(log => [
            log.id,
            format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss"),
            `${log.userName} (${log.user?.email || ''})`,
            log.action,
            `${log.resource} ${log.resourceId ? `(${log.resourceId})` : ''}`,
            JSON.stringify(log.details || {})
        ]);

        if (type === 'csv') {
            exportToCSV(data, headers, 'audit_logs');
        } else {
            exportToPDF(data, headers, t('audit.title'), 'audit_logs');
        }

        setTimeout(() => {
            toast.success(t('consultations.toasts.report_success'))
        }, 1000)
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('audit.title')}</h1>
                    <p className="text-muted-foreground">{t('audit.subtitle')}</p>
                </div>
                <Button variant="outline" onClick={() => fetchLogs(page)} className="gap-2 dark:bg-slate-800 dark:border-slate-700">
                    <RefreshCw className="h-4 w-4" /> {t('audit.refresh')}
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 dark:bg-slate-800 dark:border-slate-700">
                            <FileDown className="h-4 w-4" /> {t('common.export')}
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
            </div>

            <Card className="dark:bg-[#222428] dark:border-slate-800">
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('audit.search_placeholder')}
                                className="pl-9 dark:bg-slate-800 dark:border-slate-700"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-full md:w-[200px] dark:bg-slate-800 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder={t('audit.filter_action')} />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">{t('audit.actions.all')}</SelectItem>
                                <SelectItem value="LOGIN">{t('audit.actions.login')}</SelectItem>
                                <SelectItem value="CREATE">{t('audit.actions.create')}</SelectItem>
                                <SelectItem value="UPDATE">{t('audit.actions.update')}</SelectItem>
                                <SelectItem value="DELETE">{t('audit.actions.delete')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border dark:border-slate-800">
                        <Table>
                            <TableHeader>
                                <TableRow className="dark:border-slate-800">
                                    <TableHead>{t('audit.table.date')}</TableHead>
                                    <TableHead>{t('audit.table.user')}</TableHead>
                                    <TableHead>{t('audit.table.action')}</TableHead>
                                    <TableHead>{t('audit.table.resource')}</TableHead>
                                    <TableHead>{t('audit.table.details')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i} className="dark:border-slate-800">
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            {t('audit.empty')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <TableCell className="font-mono text-xs">
                                                {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.userName}</span>
                                                    <span className="text-xs text-muted-foreground">{log.user?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${getActionColor(log.action)} border-none`}>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{log.resource}</span>
                                                    {log.resourceId && <span className="text-[10px] text-muted-foreground font-mono">{log.resourceId.substring(0, 8)}...</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={() => handleViewDetails(log)}>
                                                    <Eye className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-muted-foreground">
                            {t('audit.pagination.showing', { count: logs.length, total: total })}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || loading}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            >
                                {t('audit.pagination.prev')}
                            </Button>
                            <div className="text-sm font-medium">
                                {t('audit.pagination.page', { current: page, total: totalPages })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages || loading}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            >
                                {t('audit.pagination.next')}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 dark:text-slate-50">
                            {t('audit.details_title')}
                            <Badge variant="outline" className="ml-2 font-mono text-xs">ID: {selectedLog?.id}</Badge>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">{t('audit.table.user')}</p>
                                    <p className="font-medium dark:text-slate-200">{selectedLog.userName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">{t('audit.table.action')}</p>
                                    <Badge className={getActionColor(selectedLog.action)}>{selectedLog.action}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">{t('audit.table.resource')}</p>
                                    <p className="font-mono dark:text-slate-200">{selectedLog.resource} / {selectedLog.resourceId || '-'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">IP / User Agent</p>
                                    <p className="dark:text-slate-200">{selectedLog.ipAddress || 'Unknown'}</p>
                                </div>
                            </div>

                            <div className="border rounded-md p-3 bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
                                <p className="text-xs text-muted-foreground mb-2 font-semibold">{t('audit.metadata')}</p>
                                <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[300px] text-slate-700 dark:text-slate-300">
                                    {selectedLog.details ? JSON.stringify(selectedLog.details, null, 2) : t('audit.no_details')}
                                </pre>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setIsDetailsOpen(false)}>{t('audit.close')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
