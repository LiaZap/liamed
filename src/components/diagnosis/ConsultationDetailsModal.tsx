import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Printer, User, Calendar, Activity, Stethoscope, FileText, Bot, CheckCircle } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { toast } from "sonner"

interface ConsultationDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    data?: {
        patientName: string;
        createdAt: string;
        status: string;
        userPrompt: string;
        complementaryData?: string;
        aiResponse: string;
        model: string;
    } | null
}

export function ConsultationDetailsModal({ isOpen, onClose, data }: ConsultationDetailsModalProps) {
    const handleCopy = () => {
        const textToCopy = data?.aiResponse || "";
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            toast.success("Copiado com sucesso!");
        }
    }

    const handlePrint = () => {
        window.print();
    }

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { bg: string; text: string; icon: any }> = {
            'ORIGINAL': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400', icon: CheckCircle },
            'EDITADO': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', icon: Activity },
            'CONCLUÍDO': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
        }
        return configs[status] || configs['ORIGINAL'];
    }

    const statusConfig = data ? getStatusConfig(data.status) : getStatusConfig('ORIGINAL');
    const StatusIcon = statusConfig.icon;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[850px] w-full p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 dark:border-slate-800 rounded-xl">
                {/* Premium Header */}
                <DialogHeader className="p-0">
                    <div className="bg-gradient-to-r from-[#0066CC] to-[#0088FF] p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                <User className="h-7 w-7" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold text-white mb-1">
                                    {data?.patientName || 'Carregando...'}
                                </DialogTitle>
                                <p className="text-blue-100 text-sm flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {data ? new Date(data.createdAt).toLocaleString('pt-BR') : '...'}
                                </p>
                            </div>
                            <div className="ml-auto">
                                <Badge className={`${statusConfig.bg} ${statusConfig.text} border-none px-3 py-1.5 text-sm font-medium`}>
                                    <StatusIcon className="h-4 w-4 mr-1.5" />
                                    {data?.status || 'ORIGINAL'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body */}
                {data && (
                    <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                        {/* Section: Sintomas */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <Stethoscope className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Sintomas e Relato</h3>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {data.userPrompt}
                            </p>
                        </div>

                        {/* Section: Dados Complementares */}
                        {data.complementaryData && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-5 border border-amber-100 dark:border-amber-800/50">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Dados Complementares</h3>
                                </div>
                                <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                                    {data.complementaryData}
                                </div>
                            </div>
                        )}

                        {/* Section: AI Response */}
                        <div className="bg-white dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h3 className="font-semibold text-slate-800 dark:text-slate-100">Análise da IA</h3>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-2 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 hover:bg-green-50 dark:hover:bg-green-900/20"
                                        onClick={handleCopy}
                                    >
                                        <Copy className="h-3.5 w-3.5" /> Copiar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 gap-2 bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                        onClick={handlePrint}
                                    >
                                        <Printer className="h-3.5 w-3.5" /> Imprimir
                                    </Button>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="prose prose-sm max-w-none prose-blue dark:prose-invert 
                                    prose-headings:text-slate-800 dark:prose-headings:text-slate-100 
                                    prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
                                    prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:my-3 prose-p:leading-relaxed
                                    prose-strong:text-slate-800 dark:prose-strong:text-slate-100
                                    prose-li:my-1
                                    prose-a:text-blue-600 prose-a:underline prose-a:font-medium hover:prose-a:text-blue-800
                                    dark:prose-a:text-blue-400 dark:hover:prose-a:text-blue-300">
                                    <ReactMarkdown
                                        components={{
                                            a: ({ node, ...props }) => (
                                                <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-800 dark:hover:text-blue-300 break-all" />
                                            ),
                                            p: ({ node, ...props }) => (
                                                <p {...props} className="my-4 leading-relaxed text-slate-700 dark:text-slate-300" />
                                            ),
                                            strong: ({ node, ...props }) => (
                                                <strong {...props} className="font-bold text-slate-900 dark:text-slate-100" />
                                            ),
                                            h1: ({ node, ...props }) => (
                                                <h1 {...props} className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-6 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700" />
                                            ),
                                            h2: ({ node, ...props }) => (
                                                <h2 {...props} className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-6 mb-3" />
                                            ),
                                            h3: ({ node, ...props }) => (
                                                <h3 {...props} className="text-base font-bold text-slate-800 dark:text-slate-200 mt-5 mb-2" />
                                            ),
                                            ul: ({ node, ...props }) => (
                                                <ul {...props} className="my-3 pl-5 space-y-2" />
                                            ),
                                            ol: ({ node, ...props }) => (
                                                <ol {...props} className="my-3 pl-5 space-y-2" />
                                            ),
                                            li: ({ node, ...props }) => (
                                                <li {...props} className="text-slate-700 dark:text-slate-300 leading-relaxed" />
                                            ),
                                        }}
                                    >
                                        {data.aiResponse}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <Activity className="h-3.5 w-3.5" />
                                    Modelo: <span className="font-medium text-slate-700 dark:text-slate-300">{data.model}</span>
                                </span>
                                <span className="text-xs text-slate-400">
                                    LIAMED - Inteligência Clínica
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <DialogFooter className="p-5 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                    <Button
                        className="bg-gradient-to-r from-[#0066CC] to-[#0088FF] hover:from-[#0055AA] hover:to-[#0077EE] text-white min-w-[180px] h-11 rounded-lg font-medium shadow-lg shadow-blue-500/20"
                        onClick={onClose}
                    >
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
