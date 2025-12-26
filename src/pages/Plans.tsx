import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, X, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/services/api"
import { toast } from "sonner"

// Mock Data
const PLANS = [
    {
        id: "free",
        name: "Free",
        price: 0,
        features: ["5 Clientes", "Consultas Básicas", "Suporte por Email"],
        notIncluded: ["IA Avançada", "Relatórios Personalizados", "Whitelabel"],
        current: false,
        usersCount: 120
    },
    {
        id: "pro",
        name: "Pro",
        price: 49.90,
        features: ["Clientes Ilimitados", "Consultas Ilimitadas", "IA Avançada (GPT-4)", "Relatórios"],
        notIncluded: ["Whitelabel"],
        current: true,
        popular: true,
        usersCount: 45
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: 199.90,
        features: ["Tudo do Pro", "Whitelabel", "API Personalizada", "Suporte 24/7", "Gestor de Conta"],
        notIncluded: [],
        current: false,
        usersCount: 12
    }
]

const INVOICES = [
    { id: "INV-001", date: "2025-12-01", amount: 49.90, status: "PAID" },
    { id: "INV-002", date: "2025-11-01", amount: 49.90, status: "PAID" },
    { id: "INV-003", date: "2025-10-01", amount: 49.90, status: "PAID" },
]

const SUBSCRIPTIONS = [
    { id: "SUB-001", user: "Dr. Silva", plan: "Pro", status: "ACTIVE" },
    { id: "SUB-002", user: "Dra. Ana", plan: "Enterprise", status: "ACTIVE" },
    { id: "SUB-003", user: "Dr. Pedro", plan: "Free", status: "Past Due" },
    { id: "SUB-004", user: "Clínica Vida", plan: "Pro", status: "Canceled" },
]

export default function Plans() {
    const { t } = useTranslation()
    const { user } = useAuth()
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubscribe = async (planName: string) => {
        try {
            setIsLoading(true)
            const response = await api.post('/payments/create-checkout-session', {
                plan: planName.toUpperCase()
            })

            if (response.data.url) {
                window.location.href = response.data.url
            }
        } catch (error) {
            console.error("Checkout error", error)
            toast.error("Erro ao iniciar pagamento")
        } finally {
            setIsLoading(false)
        }
    }

    // --- ADMIN VIEW ---
    if (user?.role === 'ADMIN') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('plans.management_title')}</h1>
                        <p className="text-muted-foreground">{t('plans.management_subtitle')}</p>
                    </div>
                </div>

                <Tabs defaultValue="plans" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="plans">{t('plans.tabs_plans')}</TabsTrigger>
                        <TabsTrigger value="subscriptions">{t('plans.tabs_subscriptions')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="plans" className="space-y-4">
                        <div className="flex justify-end">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> {t('plans.new_plan_btn')}
                            </Button>
                        </div>
                        <div className="border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                    <TableRow className="dark:border-slate-800">
                                        <TableHead>{t('plans.table_plan_name')}</TableHead>
                                        <TableHead>{t('plans.table_plan_price')}</TableHead>
                                        <TableHead>{t('plans.table_plan_users')}</TableHead>
                                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {PLANS.map((plan) => (
                                        <TableRow key={plan.id} className="dark:border-slate-800">
                                            <TableCell className="font-medium">{plan.name}</TableCell>
                                            <TableCell>R$ {plan.price.toFixed(2)}</TableCell>
                                            <TableCell>{plan.usersCount}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="subscriptions">
                        <div className="border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                    <TableRow className="dark:border-slate-800">
                                        <TableHead>{t('plans.table_user_name')}</TableHead>
                                        <TableHead>{t('plans.table_user_plan')}</TableHead>
                                        <TableHead>{t('plans.table_user_status')}</TableHead>
                                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {SUBSCRIPTIONS.map((sub) => (
                                        <TableRow key={sub.id} className="dark:border-slate-800">
                                            <TableCell className="font-medium">{sub.user}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{sub.plan}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        sub.status === 'ACTIVE' && "bg-green-100 text-green-700 hover:bg-green-100",
                                                        sub.status === 'Past Due' && "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
                                                        sub.status === 'Canceled' && "bg-red-100 text-red-700 hover:bg-red-100"
                                                    )}
                                                >
                                                    {sub.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    {t('common.view')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        )
    }

    // --- USER VIEW (Existing) ---
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">{t('plans.title')}</h1>
                <p className="text-muted-foreground">{t('plans.subtitle')}</p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center">
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all",
                            billingCycle === 'monthly' ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-muted-foreground hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                    >
                        {t('plans.monthly')}
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all",
                            billingCycle === 'yearly' ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "text-muted-foreground hover:text-slate-900 dark:hover:text-slate-200"
                        )}
                    >
                        {t('plans.yearly')}
                        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px]">
                            -20%
                        </Badge>
                    </button>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PLANS.map((plan) => (
                    <Card
                        key={plan.id}
                        className={cn(
                            "relative flex flex-col transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg dark:bg-slate-900 dark:border-slate-800",
                            plan.current ? "border-primary shadow-md ring-1 ring-primary/20" : ""
                        )}
                    >
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                POPULAR
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-xl font-bold dark:text-slate-50">{plan.name}</CardTitle>
                            <CardDescription>
                                <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                                    R$ {billingCycle === 'monthly' ? plan.price.toFixed(2).replace('.', ',') : (plan.price * 10).toFixed(2).replace('.', ',')}
                                </span>
                                <span className="text-muted-foreground"> / {t(billingCycle === 'monthly' ? 'plans.month_short' : 'plans.year_short')}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3 text-sm">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                                {plan.notIncluded.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                                        <X className="h-4 w-4 text-slate-300 flex-shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                variant={plan.current ? "outline" : "default"}
                                className={cn("w-full", plan.current ? "border-primary text-primary hover:bg-primary/5" : "bg-primary hover:bg-primary/90")}
                                disabled={plan.current || isLoading}
                                onClick={() => !plan.current && handleSubscribe(plan.id)}
                            >
                                {plan.current ? t('plans.current_plan') : isLoading ? "Processando..." : t('plans.upgrade')}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Billing History */}
            <div className="space-y-4 pt-8">
                <h2 className="text-xl font-bold dark:text-slate-50">{t('plans.history_title')}</h2>
                <div className="border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                            <TableRow className="dark:border-slate-800">
                                <TableHead className="w-[100px]">{t('plans.column_invoice')}</TableHead>
                                <TableHead>{t('plans.column_date')}</TableHead>
                                <TableHead>{t('plans.column_amount')}</TableHead>
                                <TableHead className="text-right">{t('plans.column_status')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {INVOICES.map((invoice) => (
                                <TableRow key={invoice.id} className="dark:border-slate-800">
                                    <TableCell className="font-medium">{invoice.id}</TableCell>
                                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                                    <TableCell>R$ {invoice.amount.toFixed(2).replace('.', ',')}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-900">
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
