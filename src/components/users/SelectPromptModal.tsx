import { useState, useEffect } from "react"
import api from "@/services/api"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface SelectPromptModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (content: string) => void
}

interface Prompt {
    id: string
    name: string
    category: string
    content: string
    isActive: boolean
}

const getCategoryColor = (category: string) => {
    switch (category) {
        case "DIAGNOSTICO": return "bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-slate-800 dark:text-slate-300";
        case "TRATAMENTO": return "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300";
        case "EVOLUCAO": return "bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300";
        default: return "bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300";
    }
}

export function SelectPromptModal({ isOpen, onClose, onSelect }: SelectPromptModalProps) {
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchPrompts()
        }
    }, [isOpen])

    const fetchPrompts = async () => {
        setLoading(true)
        try {
            const response = await api.get('/prompts')
            // Filter only active prompts for selection
            const activePrompts = response.data.filter((p: Prompt) => p.isActive !== false)
            setPrompts(activePrompts)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar prompts")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[800px] w-full p-0 gap-0 bg-white dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader className="p-6 border-b dark:border-slate-800">
                    <DialogTitle className="text-xl font-bold dark:text-slate-50">Selecionar Prompt Padrão</DialogTitle>
                </DialogHeader>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto bg-slate-50/50 dark:bg-[#222428]">
                    {loading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Card key={i} className="dark:bg-[#222428] dark:border-slate-800">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-20" />
                                </CardHeader>
                                <CardContent className="py-4">
                                    <Skeleton className="h-16 w-full" />
                                </CardContent>
                                <CardFooter>
                                    <Skeleton className="h-9 w-full" />
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        prompts.map((prompt) => (
                            <Card
                                key={prompt.id}
                                className="border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-default group bg-white dark:bg-slate-900 dark:border-slate-700 dark:hover:border-blue-500 flex flex-col"
                            >
                                <CardHeader className="p-4 pb-2 space-y-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1" title={prompt.name}>{prompt.name}</h3>
                                        <Badge className={`${getCategoryColor(prompt.category)} border-none text-[10px]`}>{prompt.category}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 flex-grow">
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded border dark:border-slate-800">
                                        {prompt.content}
                                    </p>
                                </CardContent>
                                <CardFooter className="p-4 pt-0 mt-auto">
                                    <Button
                                        onClick={() => onSelect(prompt.content)}
                                        className="w-full bg-slate-100 text-slate-700 hover:bg-[#0066CC] hover:text-white transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-[#0066CC] dark:hover:text-white"
                                    >
                                        Selecionar
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                    {!loading && prompts.length === 0 && (
                        <div className="col-span-full py-8 text-center text-muted-foreground">
                            Nenhum prompt ativo encontrado.
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t justify-end sm:justify-end dark:bg-slate-900 dark:border-slate-800">
                    <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-slate-900 dark:hover:text-slate-200">Cancelar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
