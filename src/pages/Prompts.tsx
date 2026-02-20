import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import {
    Search,
    Plus,
    Eye,
    Pencil,
    Copy,
    Trash2
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

// Types
interface Prompt {
    id: string
    title?: string // UI expects title but DB has name, handle mapping
    name?: string
    category: "DIAGNÓSTICO" | "TRATAMENTO" | "EVOLUÇÃO"
    content: string
    isActive: boolean
}

// Mock Data
// Mock Data removed

const getCategoryColor = (category: string) => {
    switch (category) {
        case "DIAGNOSTICO": return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-slate-300";
        case "TRATAMENTO": return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300";
        case "EVOLUCAO": return "bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300";
        default: return "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300";
    }
}

export default function Prompts() {
    const { t } = useTranslation()
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Form State
    const [formTitle, setFormTitle] = useState("")
    const [formCategory, setFormCategory] = useState("DIAGNOSTICO")
    const [formContent, setFormContent] = useState("")
    const [formIsActive, setFormIsActive] = useState(true)

    useEffect(() => {
        fetchPrompts();
    }, [])

    const fetchPrompts = async () => {
        try {
            const response = await api.get('/prompts');
            setPrompts(response.data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar prompts");
        } finally {
            setLoading(false);
        }
    }

    const handleOpenCreate = () => {
        setSelectedPrompt(null)
        setFormTitle("")
        setFormCategory("DIAGNOSTICO")
        setFormContent("")
        setFormIsActive(true)
        setIsEditing(false)
        setIsEditModalOpen(true)
    }

    const handleOpenEdit = (prompt: Prompt) => {
        setSelectedPrompt(prompt)
        setFormTitle(prompt.title || prompt.name || "") // Handle 'title' vs 'name' based on DB vs UI mismatch
        setFormCategory(prompt.category)
        setFormContent(prompt.content)
        setFormIsActive(prompt.isActive)
        setIsEditing(true)
        setIsEditModalOpen(true)
    }

    const handleOpenView = (prompt: Prompt) => {
        setSelectedPrompt(prompt)
        setIsViewModalOpen(true)
    }

    const handleSave = async () => {
        const payload = {
            name: formTitle,
            category: formCategory,
            content: formContent,
            isActive: formIsActive
        };

        try {
            if (isEditing && selectedPrompt) {
                await api.put(`/prompts/${selectedPrompt.id}`, payload);
                toast.success("Prompt atualizado com sucesso!");
                fetchPrompts();
            } else {
                await api.post('/prompts', payload);
                toast.success("Prompt criado com sucesso!");
                fetchPrompts();
            }
            setIsEditModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar prompt");
        }
    }

    const handleDelete = async () => {
        if (deleteId) {
            try {
                await api.delete(`/prompts/${deleteId}`);
                toast.success("Prompt removido com sucesso", {
                    style: { borderColor: '#ef4444' }
                })
                fetchPrompts();
            } catch (error) {
                console.error(error);
                toast.error("Erro ao remover prompt");
            } finally {
                setDeleteId(null)
            }
        }
    }

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content)
        toast.success("Conteúdo copiado para a área de transferência")
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    {loading ? <Skeleton className="h-8 w-64 mb-2" /> : <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('prompts.title')}</h1>}
                    {loading ? <Skeleton className="h-4 w-48" /> : <p className="text-muted-foreground">{t('prompts.subtitle')}</p>}
                </div>
                <div>
                    {loading ? <Skeleton className="h-9 w-32" /> : (
                        <Button className="gap-2 bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" onClick={handleOpenCreate}>
                            <Plus className="h-4 w-4" /> {t('prompts.new')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-[#222428] p-4 rounded-lg border dark:border-slate-800 shadow-sm">
                <div className="relative w-full flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t('prompts.search_placeholder')} className="pl-9 dark:bg-slate-800 dark:border-slate-700" />
                </div>
                <Select>
                    <SelectTrigger className="w-full sm:w-[200px] dark:bg-slate-800 dark:border-slate-700">
                        <SelectValue placeholder={t('prompts.all_categories')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('prompts.categories.all')}</SelectItem>
                        <SelectItem value="diagnostico">{t('prompts.categories.diagnosis')}</SelectItem>
                        <SelectItem value="tratamento">{t('prompts.categories.treatment')}</SelectItem>
                        <SelectItem value="evolucao">{t('prompts.categories.evolution')}</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex items-center space-x-2 border-l pl-4 dark:border-slate-700">
                    <Label className="text-sm cursor-pointer dark:text-slate-300" htmlFor="active-filter">{t('prompts.only_active')}</Label>
                    <Switch id="active-filter" defaultChecked />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="group dark:bg-[#222428] dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-5 w-24" />
                            </CardHeader>
                            <CardContent className="py-4">
                                <Skeleton className="h-[80px] w-full rounded-md" />
                            </CardContent>
                            <CardFooter className="flex justify-between items-center py-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-lg border-t dark:border-slate-800">
                                <Skeleton className="h-4 w-16" />
                                <div className="flex gap-1">
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                    <Skeleton className="h-8 w-8" />
                                </div>
                            </CardFooter>
                        </Card>
                    ))
                ) : (prompts.map((prompt) => (
                    <Card
                        key={prompt.id}
                        className="group hover:border-[#0066CC] hover:shadow-md transition-all cursor-default dark:hover:border-slate-500"
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-semibold dark:text-slate-100">{prompt.title || prompt.name}</CardTitle>
                            <Badge className={`${getCategoryColor(prompt.category)} border-none font-bold`}>
                                {prompt.category}
                            </Badge>
                        </CardHeader>
                        <CardContent className="py-4">
                            <div className="bg-slate-50 dark:bg-[#222428] p-3 rounded-md border dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 font-mono h-[80px] overflow-hidden relative">
                                {prompt.content}
                                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-950" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center py-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-lg border-t dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <div className={`h-2.5 w-2.5 rounded-full ${prompt.isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                <span className={`text-sm font-medium ${prompt.isActive ? 'text-green-700 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {prompt.isActive ? t('prompts.active') : t('prompts.inactive')}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0066CC] hover:bg-blue-50 dark:hover:text-slate-200 dark:hover:bg-slate-800" onClick={() => handleOpenView(prompt)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0066CC] hover:bg-blue-50 dark:hover:text-slate-200 dark:hover:bg-slate-800" onClick={() => handleOpenEdit(prompt)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0066CC] hover:bg-blue-50 dark:hover:text-slate-200 dark:hover:bg-slate-800" onClick={() => handleCopy(prompt.content)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20" onClick={() => setDeleteId(prompt.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                )))}
            </div>

            {/* Create/Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-[900px] w-full p-0 gap-0 bg-white dark:bg-slate-900 dark:border-slate-800">
                    <DialogHeader className="p-6 border-b dark:border-slate-800">
                        <DialogTitle className="text-xl font-bold dark:text-slate-50">
                            {isEditing ? t('prompts.edit_title') : t('prompts.new_title')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">{t('prompts.name_label')}</Label>
                                <Input
                                    placeholder={t('prompts.name_placeholder')}
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    className="dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="dark:text-slate-300">{t('prompts.category_label')}</Label>
                                <Select value={formCategory} onValueChange={setFormCategory}>
                                    <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                                        <SelectValue placeholder={t('prompts.select')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DIAGNOSTICO">{t('prompts.categories.diagnosis')}</SelectItem>
                                        <SelectItem value="TRATAMENTO">{t('prompts.categories.treatment')}</SelectItem>
                                        <SelectItem value="EVOLUCAO">{t('prompts.categories.evolution')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">{t('prompts.content_label')}</Label>
                            <Textarea
                                className="min-h-[400px] font-mono text-sm leading-relaxed dark:bg-[#222428] dark:border-slate-800 dark:text-slate-200"
                                placeholder={t('prompts.content_placeholder')}
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">{t('prompts.variables_hint')}</p>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
                            <div className="space-y-0.5">
                                <Label className="text-base dark:text-slate-200">{t('prompts.active_label')}</Label>
                                <p className="text-xs text-muted-foreground">{t('prompts.active_desc')}</p>
                            </div>
                            <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                        </div>

                        <div className="flex justify-start pt-2">
                            <Button variant="outline" className="gap-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                🧪 {t('prompts.test_btn')}
                            </Button>
                        </div>
                    </div>
                    <DialogFooter className="p-6 border-t sm:justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800">
                        <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} className="dark:text-slate-400 dark:hover:text-slate-200">{t('common.cancel')}</Button>
                        <Button className="bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" onClick={handleSave}>{t('common.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-w-[800px] w-full p-0 gap-0 bg-white dark:bg-slate-900">
                    <DialogHeader className="p-6 border-b flex flex-row items-center justify-between space-y-0 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-xl font-bold dark:text-slate-50">{selectedPrompt?.title || selectedPrompt?.name}</DialogTitle>
                            {selectedPrompt && (
                                <Badge className={`${getCategoryColor(selectedPrompt.category)} border-none`}>
                                    {selectedPrompt.category}
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>
                    <div className="p-6 max-h-[70vh] overflow-y-auto bg-[#F9FAFB] dark:bg-[#222428]">
                        <pre className="whitespace-pre-wrap font-mono text-sm text-slate-800 dark:text-slate-300 leading-relaxed">
                            {selectedPrompt?.content}
                        </pre>
                    </div>
                    <DialogFooter className="p-6 border-t sm:justify-between items-center bg-white dark:bg-slate-900 dark:border-slate-800">
                        {selectedPrompt && (
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${selectedPrompt.isActive ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'text-slate-500 border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                                    {selectedPrompt.isActive ? 'ATIVO' : 'INATIVO'}
                                </Badge>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" className="dark:bg-slate-800 dark:border-slate-700" onClick={() => { setIsViewModalOpen(false); if (selectedPrompt) handleOpenEdit(selectedPrompt); }}>
                                Editar
                            </Button>
                            <Button variant="ghost" onClick={() => setIsViewModalOpen(false)}>
                                Fechar
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent className="dark:bg-slate-900 dark:border-slate-800">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold flex items-center gap-2 dark:text-slate-50">
                            <Trash2 className="h-5 w-5 text-red-600" /> {t('prompts.delete_title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-slate-400">
                            {t('prompts.delete_desc')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-slate-800 dark:border-slate-700">{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800" onClick={handleDelete}>{t('common.delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
