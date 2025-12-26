import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Printer } from "lucide-react"
import ReactMarkdown from 'react-markdown'

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

import { toast } from "sonner"

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[800px] w-full p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 dark:border-slate-800">
                {/* Header */}
                <DialogHeader className="p-6 border-b flex flex-row items-center justify-between space-y-0 dark:border-slate-800">
                    <DialogTitle className="text-xl font-semibold dark:text-slate-50">
                        {data ? `Detalhes da Consulta - ${data.patientName}` : 'Carregando...'}
                    </DialogTitle>
                </DialogHeader>

                {/* Body */}
                {data && (
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {/* Section 1: Basic Info */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4 dark:text-slate-50">Informações Básicas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground block">Paciente:</span>
                                    <span className="text-sm dark:text-slate-200">{data.patientName}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground block">Data/Hora:</span>
                                    <span className="text-sm dark:text-slate-200">
                                        {new Date(data.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground block">Status:</span>
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none dark:bg-slate-800 dark:text-slate-300">
                                        {data.status || 'CONCLUÍDO'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: User Prompt */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4 dark:text-slate-50">Dados da Solicitação</h3>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300">
                                <strong>Sintomas/Relato:</strong>
                                <br />
                                {data.userPrompt}

                                {data.complementaryData && (
                                    <>
                                        <br /><br />
                                        <strong>Dados Complementares:</strong>
                                        <br />
                                        {data.complementaryData}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Section 3: AI Response */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold dark:text-slate-50">Resposta da IA</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-8 gap-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" onClick={handleCopy}><Copy className="h-3 w-3" /> Copiar</Button>
                                    <Button variant="outline" size="sm" className="h-8 gap-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300" onClick={handlePrint}><Printer className="h-3 w-3" /> Imprimir</Button>
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                                <div className="prose prose-sm max-w-none prose-blue dark:prose-invert">
                                    <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                        <ReactMarkdown>{data.aiResponse}</ReactMarkdown>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t dark:border-slate-800 text-xs text-muted-foreground flex justify-between">
                                    <span>Modelo utilizado: {data.model}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Footer */}
                <DialogFooter className="p-6 border-t sm:justify-center dark:border-slate-800">
                    <Button className="bg-[#0066CC] hover:bg-[#0055AA] min-w-[200px] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" onClick={onClose}>
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
