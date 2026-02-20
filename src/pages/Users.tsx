import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Plus, RotateCcw, FileDown, Pencil, Trash2, UserPlus } from "lucide-react"
import { EditUserModal } from "@/components/users/EditUserModal"
import { toast } from "sonner"
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
import { Skeleton } from "@/components/ui/skeleton"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { exportToCSV, exportToPDF } from "@/utils/exportUtils"
import { useTranslation } from "react-i18next"

interface User {
    id: string
    name: string
    role: "MÉDICO" | "ADMIN"
    status: "ATIVO" | "INATIVO"
    email: string
    lastAccess: string
    endpointId?: string
}

import api from "@/services/api"

export default function UsersPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([])
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const response = await api.get('/users')
            setUsers(response.data)
        } catch (error) {
            console.error("Failed to fetch users", error)
            toast.error("Erro ao carregar usuários")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleEditClick = (user: User) => {
        setSelectedUser(user)
        setIsEditModalOpen(true)
    }

    const handleCreateClick = () => {
        setSelectedUser(null)
        setIsEditModalOpen(true)
    }

    const handleSaveUser = async (userData: Record<string, unknown>) => {
        try {
            if (selectedUser) {
                await api.put(`/users/${selectedUser.id}`, userData)
                toast.success("Usuário atualizado com sucesso!")
            } else {
                // New user requires password - mocking it or asking in modal? 
                // For now, defaulting to '123456' if not provided (should be in modal really)
                await api.post('/users', userData)
                toast.success("Usuário criado com sucesso!")
            }
            setIsEditModalOpen(false)
            fetchUsers()
        } catch (error) {
            console.error("Save user error", error)
            toast.error("Erro ao salvar usuário.")
        }
    }

    const handleDeleteUser = async () => {
        if (deleteId) {
            try {
                await api.delete(`/users/${deleteId}`)
                setUsers(users.filter(u => u.id !== deleteId))
                toast.success("Usuário removido")
                setDeleteId(null)
            } catch (error) {
                console.error("Delete user error", error)
                toast.error("Erro ao remover usuário.")
            }
        }
    }

    const handleExport = (type: 'csv' | 'pdf') => {
        if (users.length === 0) {
            toast.error("Sem dados para exportar.")
            return;
        }

        toast.info("Gerando relatório...", {
            description: "O download iniciará em instantes."
        })

        const headers = ["ID", "Nome", "Email", "Cargo", "Status", "Último Acesso"];
        const data = users.map(u => [u.id, u.name, u.email, u.role, u.status, u.lastAccess]);

        if (type === 'csv') {
            exportToCSV(data, headers, 'relatorio_usuarios');
        } else {
            exportToPDF(data, headers, 'Relatório de Usuários', 'relatorio_usuarios');
        }

        setTimeout(() => {
            toast.success("Relatório baixado com sucesso")
        }, 1000)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    {loading ? <Skeleton className="h-8 w-48 mb-2" /> : <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Gerenciamento de Usuários</h1>}
                    {loading ? <Skeleton className="h-4 w-64" /> : <p className="text-muted-foreground">Adicione, edite ou remova acessos ao sistema.</p>}
                </div>
                <div className="flex items-center gap-2">
                    {loading ? <Skeleton className="h-9 w-32" /> : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="dark:bg-slate-800 dark:border-slate-700"> <FileDown className="mr-2 h-4 w-4" /> {t ? t('common.export') : 'Exportar'}</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
                                    {t ? t('common.export_csv') : 'Exportar CSV'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
                                    {t ? t('common.export_pdf') : 'Exportar PDF'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {loading ? <Skeleton className="h-9 w-32" /> : <Button variant="outline" className="dark:bg-slate-800 dark:border-slate-700" onClick={() => setLoading(true)}> <RotateCcw className="mr-2 h-4 w-4" /> Atualizar</Button>}
                    {loading ? <Skeleton className="h-9 w-32" /> : <Button className="bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" onClick={handleCreateClick}> <Plus className="mr-2 h-4 w-4" /> Novo Usuário</Button>}
                </div>
            </div>

            {/* Filters */}
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-[#222428]">
                <CardContent className="p-4 grid gap-4 md:grid-cols-4 items-end">
                    <div className="space-y-2 md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar por nome, email..." className="pl-9 dark:bg-slate-800 dark:border-slate-700" />
                        </div>
                    </div>
                    <Select>
                        <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                            <SelectValue placeholder="Todos os cargos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="medico">Médico</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                        <Select>
                            <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="inativo">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <div className="rounded-lg border shadow-sm bg-white dark:bg-[#222428] dark:border-slate-800 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                        <TableRow className="border-slate-200 dark:border-slate-800">
                            <TableHead className="w-[300px] dark:text-slate-400">NOME / EMAIL</TableHead>
                            <TableHead className="dark:text-slate-400">CARGO</TableHead>
                            <TableHead className="dark:text-slate-400">STATUS</TableHead>
                            <TableHead className="dark:text-slate-400">ÚLTIMO ACESSO</TableHead>
                            <TableHead className="text-right dark:text-slate-400">AÇÕES</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i} className="border-slate-200 dark:border-slate-800">
                                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                                </TableRow>
                            ))
                        ) : users.length === 0 ? (
                            <TableRow className="border-slate-200 dark:border-slate-800">
                                <TableCell colSpan={5} className="h-[300px] text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3">
                                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                                            <Search className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <p className="font-medium text-lg text-slate-900 dark:text-slate-100">Nenhum usuário encontrado</p>
                                        <p className="text-sm">Tente ajustar seus filtros ou adicione um novo.</p>
                                        <Button variant="outline" className="mt-4 dark:bg-slate-800 dark:border-slate-700" onClick={handleCreateClick}>
                                            <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-200 dark:border-slate-800">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-white dark:border-slate-700 shadow-sm">
                                                <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-slate-700 dark:text-slate-200 font-bold text-xs">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800 font-medium dark:text-slate-200 dark:border-slate-600">
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={user.status === "ATIVO" ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/50 dark:text-green-300 border-none" : "bg-slate-100 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-none"}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {user.lastAccess}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-[#0066CC] hover:bg-blue-50 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200" onClick={() => handleEditClick(user)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-slate-400 dark:hover:text-red-400" onClick={() => setDeleteId(user.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Footer */}
                {!loading && users.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#222428]">
                        <span className="text-xs text-muted-foreground">Mostrando <strong>{users.length}</strong> de <strong>{users.length}</strong> resultados</span>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled className="dark:bg-slate-800 dark:border-slate-700">Anterior</Button>
                            <Button variant="outline" size="sm" className="bg-[#0066CC] text-white hover:bg-[#0055AA] hover:text-white border-transparent dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">1</Button>
                            <Button variant="outline" size="sm" disabled className="dark:bg-slate-800 dark:border-slate-700">Próxima</Button>
                        </div>
                    </div>
                )}
            </div>

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={selectedUser ? { ...selectedUser, endpoint: "Endpoint Principal", prompt: "Médico Padrão" } : undefined}
                onSave={handleSaveUser}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold flex items-center gap-2 dark:text-slate-50">
                            <Trash2 className="h-5 w-5 text-red-600" /> Confirmar Exclusão
                        </AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-400">
                            Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita e ele perderá o acesso ao sistema imediatamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600" onClick={handleDeleteUser}>Sim, Deletar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
