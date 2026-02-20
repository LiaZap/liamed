import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications, type Notification } from "@/contexts/NotificationContext"
import { Trash2, CheckCircle, Search, Info, AlertTriangle, AlertOctagon, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default function Notifications() {
    const { notifications, markAllAsRead, clearAll, deleteNotification, markAsRead } = useNotifications()
    const [filter, setFilter] = useState<'all' | 'unread' | 'info' | 'success' | 'warning' | 'error'>('all')
    const [search, setSearch] = useState('')

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'all'
            ? true
            : filter === 'unread'
                ? !n.read
                : n.type === filter
        const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.message.toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const NotificationIcon = ({ type }: { type: Notification['type'] }) => {
        switch (type) {
            case 'info': return <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-slate-300"><Info className="h-5 w-5" /></div>
            case 'success': return <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400"><CheckCircle className="h-5 w-5" /></div>
            case 'warning': return <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400"><AlertTriangle className="h-5 w-5" /></div>
            case 'error': return <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400"><AlertOctagon className="h-5 w-5" /></div>
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Central de Notificações</h1>
                    <p className="text-muted-foreground">Gerencie seus alertas e mensagens do sistema.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={markAllAsRead} className="dark:bg-slate-800 dark:border-slate-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marcar todas como lidas
                    </Button>
                    <Button variant="outline" onClick={clearAll} className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpar todas
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="dark:bg-[#222428] border-slate-200 dark:border-slate-800">
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar notificações..."
                            className="pl-9 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread' | 'info' | 'success' | 'warning' | 'error')} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-3 sm:w-auto bg-slate-100 dark:bg-slate-800">
                            <TabsTrigger value="all">Todas</TabsTrigger>
                            <TabsTrigger value="unread">Não lidas</TabsTrigger>
                            <TabsTrigger value="warning">Alertas</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Select defaultValue="7d">
                        <SelectTrigger className="w-full sm:w-[150px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Últimos 7 dias</SelectItem>
                            <SelectItem value="30d">Últimos 30 dias</SelectItem>
                            <SelectItem value="all">Todo o período</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* List */}
            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                        <Bell className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Nenhuma notificação encontrada</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                            Não encontramos notificações com os filtros atuais.
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cn(
                                "group relative flex items-start gap-4 p-5 rounded-lg border transition-all hover:shadow-md",
                                notification.read
                                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                    : "bg-blue-50/50 dark:bg-slate-800/30 border-blue-200 dark:border-slate-800 shadow-sm"
                            )}
                        >
                            <NotificationIcon type={notification.type} />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className={cn("font-semibold text-base", !notification.read ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300")}>
                                            {notification.title}
                                        </h3>
                                        {!notification.read && (
                                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-slate-300 border-none h-5 px-1.5 text-[10px]">
                                                Nova
                                            </Badge>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                                    {notification.message}
                                </p>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                    <Button variant="ghost" size="icon" title="Marcar como lida" onClick={() => markAsRead(notification.id)}>
                                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-slate-400" />
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" title="Excluir" className="hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => deleteNotification(notification.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
