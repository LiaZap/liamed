import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { toast } from "sonner";

// Planos LIAMED
const PLANS = [
  {
    id: "essential",
    name: "Essential",
    price: 59.9,
    peculiarity: "Consultas Rápidas",
    description:
      "IA apoio diagnóstico + transcrições até 20 minutos por consulta",
    features: [
      "Assistente IA LIAMED",
      "Apoio Diagnóstico com IA",
      "Transcrições (até 20min por consulta)",
      "Suporte por Email",
    ],
    notIncluded: [
      "Transcrições Ilimitadas",
      "Análise de Gasometria",
      "Calculadoras Médicas",
      "Protocolos Médicos",
      "Vagas Médicas",
    ],
    transcriptionLimit: 20,
    current: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 89.9,
    peculiarity: "Otimização Clínica",
    description:
      "IA apoio diagnóstico + transcrições ilimitadas + análise de gasometria + calculadoras médicas + protocolos médicos",
    features: [
      "Assistente IA LIAMED",
      "Apoio Diagnóstico com IA",
      "Transcrições Ilimitadas",
      "Análise de Gasometria",
      "Calculadoras Médicas",
      "Protocolos Médicos",
      "Suporte Prioritário",
    ],
    notIncluded: ["Vagas Médicas"],
    transcriptionLimit: null,
    current: false,
    popular: true,
    recommended: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 119.9,
    peculiarity: "Completo + Carreira",
    description:
      "Tudo do Pro + Vagas Médicas de trabalho",
    features: [
      "Assistente IA LIAMED",
      "Apoio Diagnóstico com IA",
      "Transcrições Ilimitadas",
      "Análise de Gasometria",
      "Calculadoras Médicas",
      "Protocolos Médicos",
      "Vagas Médicas de Trabalho",
      "Suporte VIP",
    ],
    notIncluded: [],
    transcriptionLimit: null,
    current: false,
  },
];





export default function Plans() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    // Fetch payment history for non-admin users
    if (user && user.role !== 'ADMIN') {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/payments/history');
                setInvoices(response.data);
            } catch (error) {
                console.error("Failed to fetch payment history", error);
            }
        };
        fetchHistory();
    }
  }, [user]);

  useEffect(() => {
    // Check for payment return query params
    const query = new URLSearchParams(window.location.search);
    
    if (query.get("success")) {
      toast.success("Pagamento realizado com sucesso!", {
        description: "Sua assinatura está sendo ativada. Pode levar alguns instantes."
      });
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (query.get("canceled")) {
      toast.info("Pagamento cancelado", {
        description: "A operação foi cancelada. Nenhum valor foi cobrado."
      });
        // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users');
                // Map users to subscription format
                const subs = response.data.map((u: any) => ({
                    id: u.id,
                    user: u.name,
                    plan: u.plan || 'Essential',
                    status: (u.planStatus === 'ACTIVE' || u.planStatus === 'TRIALING') ? 'ACTIVE' : (u.planStatus || 'ACTIVE')
                })).filter((u:any) => u.plan !== 'Essential'); // Optional: Filter out free users if desired, or keep all
                setUserSubscriptions(subs);
            } catch (error) {
                console.error('Failed to fetch subscriptions', error);
            }
        };
        fetchUsers();
    }
  }, [user]);

  // Determine user's current plan (normalize to lowercase for comparison)
  const currentUserPlan = user?.plan?.toLowerCase() || null;
  const currentPlanStatus = user?.planStatus?.toUpperCase() || 'ACTIVE';
  const hasPlan = currentUserPlan && currentUserPlan !== 'essential' && ['ACTIVE', 'TRIALING'].includes(currentPlanStatus);

  // Get current plan details for display
  const currentPlanDetails = PLANS.find(p => p.id === currentUserPlan);

  const handleSubscribe = async (planName: string) => {
    try {
      setIsLoading(true);
      const response = await api.post("/payments/create-checkout-session", {
        plan: planName.toUpperCase(),
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Checkout error", error);
      toast.error("Erro ao iniciar pagamento");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ADMIN VIEW ---
  if (user?.role === "ADMIN") {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {t("plans.management_title")}
            </h1>
            <p className="text-muted-foreground">
              {t("plans.management_subtitle")}
            </p>
          </div>
        </div>

        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="plans">{t("plans.tabs_plans")}</TabsTrigger>
            <TabsTrigger value="subscriptions">
              {t("plans.tabs_subscriptions")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="space-y-4">
            <div className="border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="dark:border-slate-800">
                    <TableHead>{t("plans.table_plan_name")}</TableHead>
                    <TableHead>{t("plans.table_plan_price")}</TableHead>
                    <TableHead>Peculiaridade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PLANS.map((plan) => (
                    <TableRow key={plan.id} className="dark:border-slate-800">
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>R$ {plan.price.toFixed(2)}</TableCell>
                      <TableCell>{(plan as any).peculiarity || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <span className="text-amber-600 dark:text-amber-400 text-sm">⚠️</span>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Para alterar, criar ou excluir planos, acesse o{" "}
                <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100">Painel do Stripe</a>.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                  <TableRow className="dark:border-slate-800">
                    <TableHead>{t("plans.table_user_name")}</TableHead>
                    <TableHead>{t("plans.table_user_plan")}</TableHead>
                    <TableHead>{t("plans.table_user_status")}</TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userSubscriptions.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Nenhuma assinatura ativa encontrada.</TableCell>
                    </TableRow>
                  ) : (
                    userSubscriptions.map((sub) => (
                    <TableRow key={sub.id} className="dark:border-slate-800">
                      <TableCell className="font-medium">{sub.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.plan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            sub.status === "ACTIVE" &&
                              "bg-green-100 text-green-700 hover:bg-green-100",
                            sub.status === "Past Due" &&
                              "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
                            sub.status === "Canceled" &&
                              "bg-red-100 text-red-700 hover:bg-red-100",
                          )}
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          {t("common.view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // --- USER VIEW (Existing) ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {t("plans.title")}
        </h1>
        <p className="text-muted-foreground">{t("plans.subtitle")}</p>
      </div>

      {/* Current Plan Card - Only show if user has a paid plan */}
      {hasPlan && currentPlanDetails && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Check className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seu plano atual</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    {currentPlanDetails.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {(currentPlanDetails as any).peculiarity}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300">
                  {currentPlanStatus === 'ACTIVE' ? 'Ativo' : currentPlanStatus === 'TRIALING' ? 'Período de Teste' : currentPlanStatus}
                </Badge>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  R$ {currentPlanDetails.price.toFixed(2).replace(".", ",")}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => {
          const isCurrentPlan = plan.id === currentUserPlan;
          const planIndex = PLANS.findIndex(p => p.id === plan.id);
          const currentPlanIndex = PLANS.findIndex(p => p.id === currentUserPlan);
          const isUpgrade = currentUserPlan ? planIndex > currentPlanIndex : true;
          
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg dark:bg-slate-900 dark:border-slate-800",
                isCurrentPlan
                  ? "border-green-500 shadow-md ring-2 ring-green-500/30"
                  : "",
                (plan as any).recommended && !isCurrentPlan
                  ? "border-primary/50 shadow-lg ring-2 ring-primary/30"
                  : "",
              )}
            >
              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  SEU PLANO
                </div>
              )}
              {/* Recommended Badge (only if not current plan) */}
              {plan.popular && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  RECOMENDADO
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-xl font-bold dark:text-slate-50">
                    {plan.name}
                  </CardTitle>
                  {(plan as any).peculiarity && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {(plan as any).peculiarity}
                    </Badge>
                  )}
                </div>
                {(plan as any).description && (
                  <p className="text-xs text-muted-foreground mb-3">
                    {(plan as any).description}
                  </p>
                )}
                <CardDescription>
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                    R${" "}
                    {plan.price.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-muted-foreground mr-1">
                    {" "}
                    /{" "}
                    {t("plans.year_short")}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
                    >
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {plan.notIncluded.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-muted-foreground"
                    >
                      <X className="h-4 w-4 text-slate-300 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={isCurrentPlan ? "outline" : "default"}
                  className={cn(
                    "w-full",
                    isCurrentPlan
                      ? "border-green-500 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400"
                      : "bg-primary hover:bg-primary/90",
                  )}
                  disabled={isCurrentPlan || isLoading}
                  onClick={() => !isCurrentPlan && handleSubscribe(plan.id)}
                >
                  {isCurrentPlan
                    ? "✓ Plano Atual"
                    : isLoading
                      ? "Processando..."
                      : isUpgrade
                        ? "Fazer Upgrade"
                        : "Alterar Plano"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Trial Banner */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
          <span className="text-2xl">🎁</span>
          <span className="text-sm font-medium text-green-800 dark:text-green-300">
            Todos os planos incluem <strong>15 dias de teste gratuito</strong>
          </span>
        </div>
      </div>

      {/* Billing Info */}
      <p className="text-center text-xs text-muted-foreground">
        Faturamento via Stripe com renovação anual automática
      </p>

      {/* Billing History */}
      <div className="space-y-4 pt-8">
        <h2 className="text-xl font-bold dark:text-slate-50">
          {t("plans.history_title")}
        </h2>
        <div className="border rounded-lg bg-white dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow className="dark:border-slate-800">
                <TableHead className="w-[100px]">
                  {t("plans.column_invoice")}
                </TableHead>
                <TableHead>{t("plans.column_date")}</TableHead>
                <TableHead>{t("plans.column_amount")}</TableHead>
                <TableHead className="text-right">
                  {t("plans.column_status")}
                </TableHead>
                  <TableHead className="text-right">
                      PDF
                  </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {invoices.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">Nenhum pagamento encontrado.</TableCell>
                </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} className="dark:border-slate-800">
                  <TableCell className="font-medium text-xs truncate max-w-[100px]" title={invoice.id}>{invoice.id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    {new Date(invoice.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    R$ {Number(invoice.amount || 0).toFixed(2).replace(".", ",")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                          "border-green-200",
                          invoice.status === 'PAID' ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300" : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {invoice.status === 'PAID' ? 'Pago' : invoice.status}
                    </Badge>
                  </TableCell>
                    <TableCell className="text-right">
                        {invoice.pdfUrl && (
                            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">
                                Ver PDF
                            </a>
                        )}
                    </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
