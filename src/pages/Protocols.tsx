import { useState } from "react"

import { Search, BookOpen, Clock, FileText, ChevronRight, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PlanGate } from "@/components/PlanGate"
import { PROTOCOLS, CATEGORIES, type Protocol } from "@/data/protocols"

export default function Protocols() {
    // const { t } = useTranslation() // Unused for now as content is static Portuguese
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("Todos")
    const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null)

    // Filter protocols
    const filteredProtocols = PROTOCOLS.filter(protocol => {
        const matchesSearch = protocol.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              protocol.description.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === "Todos" || protocol.category === selectedCategory

        return matchesSearch && matchesCategory
    })

    return (
        <PlanGate requiredPlan="PRO" featureName="Protocolos Médicos">
            <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
                            <BookOpen className="h-8 w-8 text-primary" />
                            Protocolos Médicos
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Guias conduta rápida baseados nas diretrizes mais recentes.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-[#222428] p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar protocolo..." 
                            className="pl-9 bg-slate-50 dark:bg-slate-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <ScrollArea className="w-full whitespace-nowrap pb-2 md:pb-0">
                        <div className="flex gap-2">
                           {CATEGORIES.map(category => (
                               <Button
                                   key={category}
                                   variant={selectedCategory === category ? "default" : "outline"}
                                   size="sm"
                                   onClick={() => setSelectedCategory(category)}
                                   className="rounded-full"
                               >
                                   {category}
                               </Button>
                           ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProtocols.map((protocol) => (
                        <Card 
                            key={protocol.id} 
                            className="hover:shadow-md transition-all cursor-pointer border-l-4 border-l-primary hover:scale-[1.02]"
                            onClick={() => setSelectedProtocol(protocol)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="mb-2">{protocol.category}</Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Activity className="h-3 w-3" />
                                        {protocol.lastUpdate}
                                    </span>
                                </div>
                                <CardTitle className="text-lg leading-tight">{protocol.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {protocol.description}
                                </p>
                            </CardContent>
                            <CardFooter className="pt-0 text-primary text-sm font-medium flex items-center gap-1">
                                Ver protocolo <ChevronRight className="h-4 w-4" />
                            </CardFooter>
                        </Card>
                    ))}

                    {filteredProtocols.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nenhum protocolo encontrado</p>
                            <p className="text-sm">Tente buscar por outro termo ou categoria</p>
                            <Button 
                                variant="link" 
                                onClick={() => {setSearchTerm(""); setSelectedCategory("Todos")}}
                                className="mt-2"
                            >
                                Limpar filtros
                            </Button>
                        </div>
                    )}
                </div>

                {/* Details Modal */}
                <Dialog open={!!selectedProtocol} onOpenChange={(open) => !open && setSelectedProtocol(null)}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                        {selectedProtocol && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge>{selectedProtocol.category}</Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Atualizado: {selectedProtocol.lastUpdate}
                                        </span>
                                    </div>
                                    <DialogTitle className="text-2xl">{selectedProtocol.title}</DialogTitle>
                                    <DialogDescription className="text-base text-slate-700 dark:text-slate-300 mt-2">
                                        {selectedProtocol.description}
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <ScrollArea className="flex-1 pr-4 mt-4">
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-primary" />
                                                Passo a Passo
                                            </h3>
                                            <ol className="list-decimal pl-5 space-y-3">
                                                {selectedProtocol.steps.map((step, idx) => (
                                                    <li key={idx} className="text-sm md:text-base leading-relaxed pl-1 marker:font-bold marker:text-primary">
                                                        {step}
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                        
                                        <div className="text-xs text-muted-foreground text-right italic">
                                            Fonte: {selectedProtocol.source}
                                        </div>
                                    </div>
                                </ScrollArea>
                                
                                <DialogFooter className="mt-4 pt-2 border-t">
                                    {selectedProtocol.link && (
                                      <Button variant="outline" asChild>
                                        <a href={selectedProtocol.link} target="_blank" rel="noopener noreferrer" className="gap-2">
                                          Ler na íntegra <ChevronRight className="h-4 w-4" />
                                        </a>
                                      </Button>
                                    )}
                                    <Button onClick={() => setSelectedProtocol(null)}>Fechar</Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </PlanGate>
    )
}
