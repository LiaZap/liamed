import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Share2, Printer } from "lucide-react"

interface ConsultationDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    data?: any // Replace with specific type if available
}

export function ConsultationDetailsModal({ isOpen, onClose }: ConsultationDetailsModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[800px] w-full p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 dark:border-slate-800">
                {/* Header */}
                <DialogHeader className="p-6 border-b flex flex-row items-center justify-between space-y-0 dark:border-slate-800">
                    <DialogTitle className="text-xl font-semibold dark:text-slate-50">Detalhes da Consulta</DialogTitle>
                </DialogHeader>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">

                    {/* Section 1: Basic Info */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 dark:text-slate-50">Informações Básicas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground block">Paciente:</span>
                                <span className="text-sm dark:text-slate-200">joão</span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground block">Data/Hora:</span>
                                <span className="text-sm dark:text-slate-200">08/12/2025, 11:04:12</span>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-muted-foreground block">Status:</span>
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none dark:bg-slate-800 dark:text-slate-300">ORIGINAL</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: User Prompt */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 dark:text-slate-50">Prompt do Usuário</h3>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-line dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300">
                            {`paciente relata dores no peito e uma extrema dor de cabeça, histórico de pressão alta
--- DADOS ANTROPOMÉTRICOS ---
Altura: 1.80m
Peso: 89kg
IMC: 27.5

--- DADOS DEMOGRÁFICOS ---
Sexo: Masculino`}
                        </div>
                    </div>

                    {/* Section 3: AI Response */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold dark:text-slate-50">Resposta da IA</h3>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 gap-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><Copy className="h-3 w-3" /> Copiar</Button>
                                <Button variant="outline" size="sm" className="h-8 gap-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><Share2 className="h-3 w-3" /> Compartilhar</Button>
                                <Button variant="outline" size="sm" className="h-8 gap-2 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"><Printer className="h-3 w-3" /> Imprimir</Button>
                            </div>
                        </div>

                        <div className="bg-white border rounded-lg p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                            <h4 className="text-xl font-bold text-[#0066CC] mb-2 dark:text-slate-100">Modelo de Evolução Médica (SOAP)</h4>
                            <p className="text-sm text-muted-foreground italic mb-6">SOAP é um formato universal para registros clínicos: Subjetivo | Objetivo | Avaliação | Plano</p>

                            <div className="space-y-6 text-sm text-slate-800 dark:text-slate-300">
                                <div>
                                    <p className="font-bold mb-1 dark:text-slate-100">Identificação do paciente</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Nome: joão</li>
                                        <li>Idade: 45 anos (estimado)</li>
                                        <li>Sexo: Masculino</li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-bold text-[#0066CC] mb-1 dark:text-slate-200">Subjetivo (S):</p>
                                    <p>Paciente relata dores no peito e cefaleia intensa, associada a histórico de hipertensão arterial sistêmica.</p>
                                </div>

                                <div>
                                    <p className="font-bold text-[#0066CC] mb-1 dark:text-slate-200">Objetivo (O):</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Pressão arterial: Elevada (sugerido pelo histórico)</li>
                                        <li>IMC: 27.5 (Sobrepeso)</li>
                                        <li>Exame físico: Aguardando dados complementares.</li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-bold text-[#0066CC] mb-1 dark:text-slate-200">Avaliação (A):</p>
                                    <p className="mb-1">Diagnóstico diferencial:</p>
                                    <ol className="list-decimal pl-5 space-y-1">
                                        <li>Cefaleia aguda grave (Emergência Hipertensiva?)</li>
                                        <li>Síndrome Coronariana Aguda (pela dor torácica)</li>
                                        <li>Dissecção de aorta (diagnóstico crítico a descartar)</li>
                                    </ol>
                                </div>

                                <div>
                                    <p className="font-bold text-[#0066CC] mb-1 dark:text-slate-200">Plano (P):</p>
                                    <ol className="list-decimal pl-5 space-y-1">
                                        <li>Monitorização contínua de sinais vitais.</li>
                                        <li>Solicitar Angiotomografia de tórax e crânio.</li>
                                        <li>ECG de 12 derivações imediato.</li>
                                        <li>Avaliação neurológica detalhada.</li>
                                    </ol>
                                </div>

                                <div className="pt-4 border-t mt-4 dark:border-slate-800">
                                    <p className="font-bold mb-2 dark:text-slate-100">Fontes:</p>
                                    <p className="text-xs text-muted-foreground">Baseado em diretrizes da SBC (Sociedade Brasileira de Cardiologia) e protocolos de emergência clínica.</p>
                                </div>

                                <div>
                                    <p className="font-bold mb-2 dark:text-slate-100">Referências:</p>
                                    <ul className="list-disc pl-5 space-y-1 text-[#0066CC] dark:text-slate-400">
                                        <li><a href="#" className="hover:underline">Diretriz de Hipertensão Arterial - 2020</a></li>
                                        <li><a href="#" className="hover:underline">Protocolo de Dor Torácica</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

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
