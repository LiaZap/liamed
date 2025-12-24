import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Database, Server, Cpu, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/services/api';
import { format } from 'date-fns';

interface HealthStats {
    status: string;
    timestamp: string;
    system: {
        uptime: number;
        platform: string;
        nodeVersion: string;
        cpuLoad: number[];
        memory: {
            rss: number;
            heapTotal: number;
            heapUsed: number;
            systemFree: number;
            systemTotal: number;
        };
    };
    database: {
        status: string;
        latency: string;
        counts: {
            users: number;
            consults: number;
            diagnoses: number;
            logs: number;
        };
    };
    recentActivity: any[];
}

export default function SystemHealth() {
    const { t } = useTranslation();
    const [stats, setStats] = useState<HealthStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await api.get('/health/dashboard');
            setStats(response.data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error fetching health stats:', error);
            toast.error('Erro ao atualizar status do sistema');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const formatBytes = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    };

    if (!stats && loading) {
        return <div className="p-10 text-center">Carregando status do sistema...</div>;
    }

    if (!stats) return null;

    // Calculations
    const memoryUsagePercent = (stats.system.memory.heapUsed / stats.system.memory.heapTotal) * 100;
    // const systemMemoryPercent = ((stats.system.memory.systemTotal - stats.system.memory.systemFree) / stats.system.memory.systemTotal) * 100;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                        {t('health.title', 'System Health')}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {t('health.last_updated')}: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
                <Button onClick={fetchStats} variant="outline" className="gap-2">
                    <Activity className="h-4 w-4" /> {t('health.refresh', 'Atualizar')}
                </Button>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="dark:bg-[#222428] border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Status</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Online</div>
                        <p className="text-xs text-muted-foreground">Uptime: {formatUptime(stats.system.uptime)}</p>
                    </CardContent>
                </Card>

                <Card className="dark:bg-[#222428] border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Database</CardTitle>
                        <Database className="h-4 w-4 text-blue-500 dark:text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.database.status === 'connected' ? 'Connected' : 'Error'}</div>
                        <p className="text-xs text-muted-foreground">Latency: {stats.database.latency}</p>
                    </CardContent>
                </Card>

                <Card className="dark:bg-[#222428]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Node Memory</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatBytes(stats.system.memory.heapUsed)}</div>
                        <Progress value={memoryUsagePercent} className="h-2 mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">of {formatBytes(stats.system.memory.heapTotal)} Hip</p>
                    </CardContent>
                </Card>

                <Card className="dark:bg-[#222428]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">CPU Load (1m)</CardTitle>
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.system.cpuLoad[0].toFixed(2)}%</div>
                        <p className="text-xs text-muted-foreground">Platform: {stats.system.platform}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Database Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="dark:bg-[#222428] dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Database Records
                        </CardTitle>
                        <CardDescription>Total counts of primary entities</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                            <span className="font-medium">Users</span>
                            <Badge variant="secondary">{stats.database.counts.users}</Badge>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                            <span className="font-medium">Consults</span>
                            <Badge variant="secondary">{stats.database.counts.consults}</Badge>
                        </div>
                        <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                            <span className="font-medium">Diagnoses</span>
                            <Badge variant="secondary">{stats.database.counts.diagnoses}</Badge>
                        </div>
                        <div className="flex items-center justify-between pb-2">
                            <span className="font-medium">Audit Logs</span>
                            <Badge variant="secondary">{stats.database.counts.logs}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Error Logs (or System Logs) */}
                <Card className="dark:bg-[#222428] dark:border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Latest system events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentActivity.map((log, i) => (
                                <div key={i} className="flex flex-col gap-1 border-b last:border-0 pb-2 dark:border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm">{log.action}</span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), 'HH:mm:ss')}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">{log.user?.name || 'System'}</span>
                                        <span className="font-mono text-muted-foreground">{log.resource}</span>
                                    </div>
                                </div>
                            ))}
                            {stats.recentActivity.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No recent activity found.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
