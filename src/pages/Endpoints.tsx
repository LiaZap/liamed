import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
    RotateCw,
    Plus,
    Pencil,
    Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import api from "@/services/api"
import { EditEndpointModal } from "@/components/endpoints/EditEndpointModal"

export default function Endpoints() {
    const [endpoints, setEndpoints] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedEndpoint, setSelectedEndpoint] = useState<any>(null)

    const fetchEndpoints = async () => {
        setLoading(true)
        try {
            const response = await api.get('/endpoints')
            setEndpoints(response.data)
        } catch (error) {
            console.error("Failed to fetch endpoints", error)
            toast.error("Erro ao carregar endpoints")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEndpoints()
    }, [])

    const handleEditClick = (endpoint: any) => {
        setSelectedEndpoint(endpoint)
        setIsEditModalOpen(true)
    }

    const handleCreateClick = () => {
        setSelectedEndpoint(null)
        setIsEditModalOpen(true)
    }

    const handleSaveEndpoint = async (data: any) => {
        try {
            if (selectedEndpoint) {
                await api.put(`/endpoints/${selectedEndpoint.id}`, data)
                toast.success("Endpoint atualizado com sucesso!")
            } else {
                await api.post('/endpoints', data)
                toast.success("Endpoint criado com sucesso!")
            }
            setIsEditModalOpen(false)
            fetchEndpoints()
        } catch (error) {
            console.error("Save endpoint error", error)
            toast.error("Erro ao salvar endpoint")
        }
    }

    const handleDelete = async () => {
        if (deleteId) {
            try {
                await api.delete(`/endpoints/${deleteId}`)
                setEndpoints(endpoints.filter(e => e.id !== deleteId))
                toast.success("Endpoint removido")
                setDeleteId(null)
            } catch (error) {
                console.error("Delete endpoint error", error)
                toast.error("Erro ao remover endpoint")
            }
        }
    }

    const handleTestConnection = async (data: any) => {
        try {
            toast.info("Testando conexão...")
            const response = await api.post('/endpoints/test', data)
            if (response.data.success) {
                toast.success("Conexão bem sucedida!", {
                    description: `Latência: ${response.data.latency}ms`
                })
            } else {
                toast.error("Falha na conexão", {
                    description: response.data.message
                })
            }
        } catch (error) {
            toast.error("Erro ao testar conexão")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    {loading ? <Skeleton className="h-8 w-64 mb-2" /> : <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Gerenciamento de Endpoints</h1>}
                    {loading ? <Skeleton className="h-4 w-48" /> : <p className="text-muted-foreground">Configure as conexões externas e webhooks do sistema.</p>}
                </div>
                <div>
                    {loading ? <Skeleton className="h-9 w-32" /> : (
                        <Button className="gap-2 bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" onClick={handleCreateClick}>
                            <Plus className="h-4 w-4" /> Novo Endpoint
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4 dark:bg-[#222428] dark:border-slate-800">
                <h2 className="font-semibold text-lg dark:text-slate-50">Filtros</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <Label className="dark:text-slate-300">Buscar</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Nome ou URL..." className="pl-9 dark:bg-slate-800 dark:border-slate-700" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="dark:text-slate-300">Método</Label>
                        <Select>
                            <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                                <SelectValue placeholder="Todos os métodos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="get">GET</SelectItem>
                                <SelectItem value="post">POST</SelectItem>
                                <SelectItem value="put">PUT</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button className="w-full gap-2 bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" onClick={fetchEndpoints}>
                        <RotateCw className="h-4 w-4" /> Atualizar
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg bg-white overflow-hidden shadow-sm dark:bg-[#222428] dark:border-slate-800">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                        <TableRow className="dark:border-slate-800">
                            <TableHead className="uppercase text-xs font-semibold w-1/3 dark:text-slate-400">Endpoint</TableHead>
                            <TableHead className="uppercase text-xs font-semibold dark:text-slate-400">Status</TableHead>
                            <TableHead className="uppercase text-xs font-semibold dark:text-slate-400">Tipo de Auth</TableHead>
                            <TableHead className="uppercase text-xs font-semibold dark:text-slate-400">Criado Em</TableHead>
                            <TableHead className="text-right uppercase text-xs font-semibold dark:text-slate-400">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <TableRow key={i} className="dark:border-slate-800">
                                    <TableCell><div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                                </TableRow>
                            ))
                        ) : endpoints.length === 0 ? (
                            <TableRow className="dark:border-slate-800">
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nenhum endpoint encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            endpoints.map((endpoint) => (
                                <TableRow key={endpoint.id} className="hover:bg-[#E6F2FF] dark:hover:bg-slate-800/50 transition-colors dark:border-slate-800">
                                    <TableCell className="py-4 align-top">
                                        <div className="flex flex-col gap-2">
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{endpoint.name}</span>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-blue-600 hover:bg-blue-700 text-[10px] font-bold dark:bg-slate-50 dark:text-slate-900">
                                                    {endpoint.method}
                                                </Badge>
                                                <code className="text-xs font-mono text-slate-500 max-w-[200px] truncate dark:text-slate-400">
                                                    {endpoint.url}
                                                </code>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Badge className={`${endpoint.status === 'ATIVO' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'} hover:bg-opacity-80 border-none font-normal text-[11px] uppercase`}>
                                            {endpoint.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-normal text-[11px] uppercase dark:bg-slate-800 dark:text-slate-300">
                                            {endpoint.authType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4 text-sm text-muted-foreground">
                                        {new Date(endpoint.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800" onClick={() => handleEditClick(endpoint)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20" onClick={() => setDeleteId(endpoint.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold flex items-center gap-2 dark:text-slate-50">
                            <Trash2 className="h-5 w-5 text-red-600" /> Confirmar Exclusão
                        </AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-400">
                            Tem certeza que deseja remover este endpoint? Integrações que utilizam ele podem parar de funcionar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-slate-800 dark:border-slate-700">Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600" onClick={handleDelete}>Sim, Deletar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <EditEndpointModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                endpoint={selectedEndpoint}
                onSave={handleSaveEndpoint}
                onTest={handleTestConnection}
            />
        </div>
    )
}
