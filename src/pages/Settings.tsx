import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
    AlertTriangle,
    RotateCw,
    Plus,
    Pencil,
    Trash2
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { EditConfigModal } from "@/components/settings/EditConfigModal"
import api from "@/services/api"
import { useTranslation } from "react-i18next"

// Types
interface ConfigItem {
    id: string
    name: string
    description: string
    value: string | number | boolean
    type: "BOOLEAN" | "STRING" | "NUMBER"
    required?: boolean
    hidden?: boolean
}

// Mock Data
export default function Settings() {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<Record<string, ConfigItem[]>>({
        general: [],
        security: [],
        email: [],
        notifications: [],
        system: []
    })
    const [editConfig, setEditConfig] = useState<ConfigItem | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    // Helper to group settings
    const groupSettings = (settings: Array<{ category: string, value: string, type: string } & ConfigItem>) => {
        const grouped: Record<string, ConfigItem[]> = {
            general: [],
            security: [],
            email: [],
            notifications: [],
            system: []
        }

        settings.forEach(s => {
            let cat = 'general';
            if (s.category === 'SEGURANCA') cat = 'security';
            if (s.category === 'EMAIL') cat = 'email';
            if (s.category === 'NOTIFICACOES') cat = 'notifications';
            if (s.category === 'SISTEMA') cat = 'system';

            // Map backend type to frontend type if needed, or keep as is if consistent
            // Note: Value comes as string from DB, we might need to parse it for boolean/number display logic
            let parsedValue: string | number | boolean = s.value as string | number | boolean;
            if (s.type === 'BOOLEAN') parsedValue = s.value === 'true';
            if (s.type === 'NUMBER') parsedValue = Number(s.value);

            if (grouped[cat]) {
                grouped[cat].push({
                    ...s,
                    value: parsedValue
                });
            } else {
                // Fallback for unknown categories
                if (!grouped['general']) grouped['general'] = [];
                grouped['general'].push({ ...s, value: parsedValue });
            }
        });
        return grouped;
    }

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            setData(groupSettings(response.data));
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar configurações");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleEdit = (item: ConfigItem) => {
        setEditConfig(item)
        setIsEditModalOpen(true)
    }

    const handleSaveConfig = async (updatedConfig: ConfigItem) => {
        try {
            await api.patch(`/settings/${updatedConfig.id}`, { value: updatedConfig.value });

            // Optimistic update or refetch
            const newData = { ...data };
            let found = false;
            for (const category in newData) {
                const index = newData[category].findIndex(c => c.id === updatedConfig.id);
                if (index !== -1) {
                    newData[category][index] = updatedConfig;
                    found = true;
                    break;
                }
            }

            if (found) {
                setData(newData);
                toast.success("Configuração atualizada", {
                    description: `O valor de ${updatedConfig.name} foi alterado.`
                });
            } else {
                // Fallback to refetch if structure is complex
                fetchSettings();
            }

        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar");
        }
    }

    const ConfigCard = ({ item }: { item: ConfigItem }) => {
        return (
            <Card className="shadow-sm hover:shadow-md transition-shadow dark:bg-[#222428] dark:border-slate-800">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="font-mono text-sm break-all text-slate-700 dark:text-slate-300">
                            {item.name}
                        </CardTitle>
                        {item.required && (
                            <Badge variant="warning" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[10px] whitespace-nowrap dark:bg-amber-900/30 dark:text-amber-400">
                                {t('settings.required')}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-3">
                    <p className="text-sm text-muted-foreground min-h-[40px] line-clamp-2">
                        {item.description}
                    </p>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center bg-slate-50 p-2 rounded border dark:bg-slate-950 dark:border-slate-800">
                            <span className="text-xs text-muted-foreground font-medium uppercase">{t('settings.current_value')}</span>
                            {item.type === "BOOLEAN" ? (
                                <span className={`text-sm font-bold ${item.value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {item.value ? t('settings.yes') : t('settings.no')}
                                </span>
                            ) : (
                                <span className={`text-sm font-bold ${item.hidden ? 'text-slate-400 italic' : 'text-blue-700 dark:text-slate-300'} break-all text-right ml-4`}>
                                    {item.value}
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center text-xs text-muted-foreground border-t p-4 mt-2 bg-slate-50/50 dark:bg-slate-800/20 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="opacity-70">{t('settings.type')}</span>
                        <Badge variant="outline" className="text-[10px] bg-white text-blue-600 border-blue-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                            {item.type}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600 dark:hover:text-slate-200" onClick={() => handleEdit(item)}>
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30"
                            disabled={item.required}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        )
    }

    const SkeletonCard = () => (
        <Card className="shadow-sm dark:bg-[#222428] dark:border-slate-800">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter className="pt-0 flex justify-between items-center border-t p-4 mt-2 dark:border-slate-800">
                <Skeleton className="h-4 w-20" />
                <div className="flex gap-1">
                    <Skeleton className="h-7 w-7" />
                    <Skeleton className="h-7 w-7" />
                </div>
            </CardFooter>
        </Card>
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    {loading ? <Skeleton className="h-8 w-64 mb-2" /> : <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('settings.title')}</h1>}
                    {loading ? <Skeleton className="h-4 w-48" /> : <p className="text-muted-foreground">{t('settings.subtitle')}</p>}
                </div>
                <div className="flex items-center gap-2">
                    {loading ? <Skeleton className="h-9 w-24" /> : (
                        <Button variant="outline" className="gap-2 bg-white dark:bg-slate-800 dark:border-slate-700" onClick={() => { setLoading(true); fetchSettings(); }}>
                            <RotateCw className="h-4 w-4" /> {t('settings.refresh')}
                        </Button>
                    )}
                    {loading ? <Skeleton className="h-9 w-40" /> : (
                        <Button className="gap-2 bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
                            <Plus className="h-4 w-4" /> {t('settings.add')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Alert */}
            <Alert className="bg-amber-50 border-amber-200 border-l-4 border-l-amber-500 dark:bg-amber-900/10 dark:border-amber-900/50 dark:border-l-amber-500">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                <AlertTitle className="text-amber-800 font-bold dark:text-amber-400">{t('settings.warning_title')}</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                    {t('settings.warning_desc')}
                </AlertDescription>
            </Alert>

            {/* Tabs */}
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-6 overflow-x-auto dark:border-slate-800">
                    <TabsTrigger
                        value="general"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-slate-50 dark:data-[state=active]:border-slate-50 rounded-none px-2 py-3 gap-2 dark:text-slate-400"
                    >
                        {t('settings.tabs.general')}
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] dark:bg-slate-800 dark:text-slate-400">
                            {data.general?.length || 0}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-slate-50 dark:data-[state=active]:border-slate-50 rounded-none px-2 py-3 gap-2 dark:text-slate-400"
                    >
                        {t('settings.tabs.security')}
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] dark:bg-slate-800 dark:text-slate-400">
                            {data.security?.length || 0}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                        value="email"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-slate-50 dark:data-[state=active]:border-slate-50 rounded-none px-2 py-3 gap-2 dark:text-slate-400"
                    >
                        {t('settings.tabs.email')}
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] dark:bg-slate-800 dark:text-slate-400">
                            {data.email?.length || 0}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                        value="notifications"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-slate-50 dark:data-[state=active]:border-slate-50 rounded-none px-2 py-3 gap-2 dark:text-slate-400"
                    >
                        {t('settings.tabs.notifications')}
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] dark:bg-slate-800 dark:text-slate-400">
                            {data.notifications?.length || 0}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger
                        value="system"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-slate-50 dark:data-[state=active]:border-slate-50 rounded-none px-2 py-3 gap-2 dark:text-slate-400"
                    >
                        {t('settings.tabs.system')}
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px] dark:bg-slate-800 dark:text-slate-400">
                            {data.system?.length || 0}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="general">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />) : data.general?.map(item => <ConfigCard key={item.id} item={item} />)}
                            {!loading && data.general?.length === 0 && <p className="text-slate-500">{t('settings.empty')}</p>}
                        </div>
                    </TabsContent>
                    <TabsContent value="security">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : data.security?.map(item => <ConfigCard key={item.id} item={item} />)}
                            {!loading && data.security?.length === 0 && <p className="text-slate-500">{t('settings.empty')}</p>}
                        </div>
                    </TabsContent>
                    <TabsContent value="email">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) : data.email?.map(item => <ConfigCard key={item.id} item={item} />)}
                            {!loading && data.email?.length === 0 && <p className="text-slate-500">{t('settings.empty')}</p>}
                        </div>
                    </TabsContent>
                    <TabsContent value="notifications">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? Array(2).fill(0).map((_, i) => <SkeletonCard key={i} />) : data.notifications?.map(item => <ConfigCard key={item.id} item={item} />)}
                            {!loading && data.notifications?.length === 0 && <p className="text-slate-500">{t('settings.empty')}</p>}
                        </div>
                    </TabsContent>
                    <TabsContent value="system">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? Array(2).fill(0).map((_, i) => <SkeletonCard key={i} />) : data.system?.map(item => <ConfigCard key={item.id} item={item} />)}
                            {!loading && data.system?.length === 0 && <p className="text-slate-500">{t('settings.empty')}</p>}
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            <EditConfigModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                config={editConfig}
                onSave={handleSaveConfig}
            />
        </div>
    )
}
