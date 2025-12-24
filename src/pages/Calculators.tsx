import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Search, Calculator as CalculatorIcon, ArrowRight, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { calculatorService, type CalculatorFormula } from "@/services/calculatorService"
import { toast } from "sonner"

export default function Calculators() {
    const { t } = useTranslation()
    const [searchTerm, setSearchTerm] = useState("")
    const [calculators, setCalculators] = useState<CalculatorFormula[]>([])
    const [selectedCalc, setSelectedCalc] = useState<CalculatorFormula | null>(null)
    const [inputs, setInputs] = useState<any>({})
    const [result, setResult] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isCalculating, setIsCalculating] = useState(false)

    useEffect(() => {
        loadCalculators()
    }, [])

    const loadCalculators = async () => {
        try {
            setIsLoading(true)
            const data = await calculatorService.list()
            setCalculators(data)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar calculadoras")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredCalculators = calculators.filter(calc =>
        calc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        calc.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleCalculate = async () => {
        if (!selectedCalc) return
        try {
            setIsCalculating(true)
            const res = await calculatorService.calculate(selectedCalc.id, inputs)
            setResult(res.result)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao realizar cálculo")
        } finally {
            setIsCalculating(false)
        }
    }

    const reset = () => {
        setInputs({})
        setResult(null)
    }

    // Client-side interpretation helper (optional, for demo)
    const getInterpretation = (calcName: string, value: number) => {
        if (calcName.includes("IMC") || calcName.includes("Body Mass")) {
            if (value < 18.5) return { text: "Abaixo do peso", color: "text-blue-600", bg: "bg-blue-100" }
            if (value < 25) return { text: "Peso normal", color: "text-green-600", bg: "bg-green-100" }
            if (value < 30) return { text: "Sobrepeso", color: "text-yellow-600", bg: "bg-yellow-100" }
            return { text: "Obesidade", color: "text-red-600", bg: "bg-red-100" }
        }
        return null
    }

    const interpretation = (selectedCalc && result !== null) ? getInterpretation(selectedCalc.name, result) : null

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('calculators.title')}</h1>
                <p className="text-muted-foreground">{t('calculators.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List of Calculators */}
                <Card className="lg:col-span-1 h-[600px] flex flex-col dark:bg-[#222428] dark:border-slate-800">
                    <CardHeader className="pb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('calculators.search_placeholder')}
                                className="pl-9 dark:bg-slate-800 dark:border-slate-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-2 p-2 relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-[#222428]/50">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        )}
                        {filteredCalculators.map(calc => (
                            <button
                                key={calc.id}
                                onClick={() => { setSelectedCalc(calc); reset(); }}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg text-sm transition-colors flex items-center justify-between group",
                                    selectedCalc?.id === calc.id
                                        ? "bg-slate-100 dark:bg-slate-800 border-l-4 border-primary"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-slate-200">{calc.name}</div>
                                    <div className="text-xs text-muted-foreground">{calc.category}</div>
                                </div>
                                <ArrowRight className={cn(
                                    "h-4 w-4 text-muted-foreground opacity-0 transition-opacity",
                                    selectedCalc?.id === calc.id ? "opacity-100" : "group-hover:opacity-50"
                                )} />
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Calculator Area */}
                <Card className="lg:col-span-2 flex flex-col dark:bg-[#222428] dark:border-slate-800">
                    {selectedCalc ? (
                        <>
                            <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <CardTitle className="text-xl flex items-center gap-2 dark:text-slate-50">
                                    <CalculatorIcon className="h-5 w-5 text-primary" />
                                    {selectedCalc.name}
                                </CardTitle>
                                <CardDescription>{selectedCalc.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 p-6 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {selectedCalc.variables.map((v) => (
                                        <div key={v.id} className="space-y-2">
                                            <Label className="dark:text-slate-300">{v.label} {v.unit && <span className="text-muted-foreground">({v.unit})</span>}</Label>

                                            {v.type === 'SELECT' && v.options ? (
                                                <Select onValueChange={(val) => setInputs({ ...inputs, [v.name]: val })}>
                                                    <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {(v.options as any[]).map((opt: any) => (
                                                            <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    className="dark:bg-slate-800 dark:border-slate-700"
                                                    value={inputs[v.name] || ''}
                                                    onChange={(e) => setInputs({ ...inputs, [v.name]: Number(e.target.value) })}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {result !== null && (
                                    <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 rounded-lg border-2 border-primary/10 bg-[#E6F2FF] dark:bg-slate-800 dark:border-slate-700 p-6 flex flex-col items-center justify-center text-center space-y-2">
                                        <span className="text-sm font-medium text-blue-600 dark:text-slate-300 uppercase tracking-wider">Resultado</span>
                                        <div className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                                            {result.toFixed(2)}
                                        </div>
                                        {interpretation && (
                                            <Badge variant="outline" className={cn("mt-2 text-base px-4 py-1 border-none", interpretation.bg, interpretation.color)}>
                                                {interpretation.text}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="border-t dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between">
                                <Button variant="ghost" onClick={reset} className="gap-2 dark:text-slate-400">
                                    <RotateCcw className="h-4 w-4" />
                                    {t('calculators.reset')}
                                </Button>
                                <Button onClick={handleCalculate} disabled={isCalculating} className="gap-2 bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">
                                    {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalculatorIcon className="h-4 w-4" />}
                                    {t('calculators.calculate')}
                                </Button>
                            </CardFooter>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
                            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                <CalculatorIcon className="h-8 w-8 text-slate-400" />
                            </div>
                            <p className="text-lg font-medium dark:text-slate-300">{t('calculators.select_prompt')}</p>
                            <p className="text-sm">{t('calculators.select_desc')}</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
