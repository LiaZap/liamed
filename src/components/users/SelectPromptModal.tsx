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

interface SelectPromptModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (content: string) => void
}

const prompts = [
    {
        id: 1,
        title: "Médico Padrão",
        type: "DIAGNÓSTICO",
        badgeColor: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-none dark:bg-slate-800 dark:text-slate-300",
        preview: "###Contexto: Você está em um hospital de clínicas, você interage diretamente com médicos legais e registrados que entendem os termos...",
        fullContent: `### Contexto
Você serve como um assistente de IA extremamente capaz e preciso para médicos em um cenário clínico de alta pressão. Você tem vasto conhecimento em todas as especialidades médicas, farmacologia e fisiopatologia.

### Instruções
Sua tarefa é analisar os dados fornecidos e sugerir hipóteses diagnósticas diferenciais, exames complementares e planos terapêuticos. Sempre justifique suas sugestões com base na literatura médica recente.

### Estilo de Resposta
Seja direto, técnico e use terminologia médica apropriada. Evite introduções longas.`
    },
    {
        id: 2,
        title: "SOAP",
        type: "TRATAMENTO",
        badgeColor: "bg-green-100 text-green-700 hover:bg-green-100 border-none",
        preview: "# Prompt para Geração de Evolução Médica no Formato SOAP ## Instrução Principal Você é um médico experiente responsável por redigir evoluções...",
        fullContent: `# Prompt para Geração de Evolução Médica no Formato SOAP

## Instrução Principal
Você é um médico experiente responsável por redigir evoluções de prontuário eletrônico.

## Estrutura SOAP
- **S (Subjetivo)**: Sintomas e queixas do paciente.
- **O (Objetivo)**: Dados vitais, exame físico e resultados de exames.
- **A (Avaliação)**: Raciocínio clínico e hipóteses diagnósticas.
- **P (Plano)**: Conduta, prescrições e orientações.

Use esta estrutura para organizar as informações fornecidas.`
    }
]

export function SelectPromptModal({ isOpen, onClose, onSelect }: SelectPromptModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[600px] w-full p-0 gap-0 bg-white">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle className="text-xl font-bold">Selecionar Prompt Padrão</DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50/50">
                    {prompts.map((prompt) => (
                        <Card
                            key={prompt.id}
                            className="border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group bg-white"
                            onClick={() => onSelect(prompt.fullContent)}
                        >
                            <CardHeader className="p-4 pb-2 space-y-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-slate-800">{prompt.title}</h3>
                                    <Badge className={prompt.badgeColor}>{prompt.type}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                    {prompt.preview}
                                </p>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Button className="w-full bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors group-hover:bg-[#0066CC] group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:group-hover:bg-slate-700">
                                    Selecionar
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <DialogFooter className="p-6 border-t justify-center sm:justify-center">
                    <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
