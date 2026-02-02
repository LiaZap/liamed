import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, ArrowUpCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"

export type PlanType = 'ESSENTIAL' | 'PRO' | 'PREMIUM'

interface PlanGateProps {
    requiredPlan: PlanType
    children: React.ReactNode
    featureName?: string
}

const PLAN_HIERARCHY: Record<PlanType, number> = {
    ESSENTIAL: 1,
    PRO: 2,
    PREMIUM: 3
}

const PLAN_NAMES: Record<PlanType, string> = {
    ESSENTIAL: 'Essential',
    PRO: 'Pro',
    PREMIUM: 'Premium'
}

/**
 * Componente que bloqueia acesso a recursos baseado no plano do usuário.
 * Se o usuário não tiver o plano mínimo necessário, mostra um prompt de upgrade.
 */
export function PlanGate({ requiredPlan, children, featureName }: PlanGateProps) {
    const { user } = useAuth()
    const navigate = useNavigate()
    
    // Plano atual do usuário (default: ESSENTIAL se não definido)
    const userPlan = (user?.plan as PlanType) || 'ESSENTIAL'
    const userPlanLevel = PLAN_HIERARCHY[userPlan] || 1
    const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan]
    
    // Se o usuário tem acesso, renderiza o conteúdo
    if (userPlanLevel >= requiredPlanLevel) {
        return <>{children}</>
    }
    
    // Caso contrário, mostra o prompt de upgrade
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
            <Card className="max-w-md w-full border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <CardContent className="flex flex-col items-center text-center p-8 gap-6">
                    {/* Icon */}
                    <div className="relative">
                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                            <Lock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <ArrowUpCircle className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    
                    {/* Title */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                            Recurso Exclusivo
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {featureName 
                                ? `${featureName} está disponível a partir do plano ${PLAN_NAMES[requiredPlan]}.`
                                : `Este recurso está disponível a partir do plano ${PLAN_NAMES[requiredPlan]}.`
                            }
                        </p>
                    </div>
                    
                    {/* Current Plan Info */}
                    <div className="w-full p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-muted-foreground mb-1">Seu plano atual</p>
                        <p className="font-semibold text-slate-900 dark:text-slate-50">
                            {PLAN_NAMES[userPlan]}
                        </p>
                    </div>
                    
                    {/* Upgrade Button */}
                    <Button 
                        className="w-full gap-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                        onClick={() => navigate('/planos')}
                    >
                        <ArrowUpCircle className="h-4 w-4" />
                        Fazer Upgrade para {PLAN_NAMES[requiredPlan]}
                    </Button>
                    
                    {/* Extra info */}
                    <p className="text-xs text-muted-foreground">
                        🎁 Experimente grátis por 15 dias
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

/**
 * Hook para verificar se o usuário tem acesso a um plano específico
 */
export function usePlanAccess(requiredPlan: PlanType): boolean {
    const { user } = useAuth()
    const userPlan = (user?.plan as PlanType) || 'ESSENTIAL'
    const userPlanLevel = PLAN_HIERARCHY[userPlan] || 1
    const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan]
    
    return userPlanLevel >= requiredPlanLevel
}

/**
 * Hook para obter informações do plano do usuário
 */
export function useUserPlan() {
    const { user } = useAuth()
    const userPlan = (user?.plan as PlanType) || 'ESSENTIAL'
    
    return {
        plan: userPlan,
        planName: PLAN_NAMES[userPlan],
        planLevel: PLAN_HIERARCHY[userPlan] || 1,
        hasAccess: (requiredPlan: PlanType) => {
            const userPlanLevel = PLAN_HIERARCHY[userPlan] || 1
            const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan]
            return userPlanLevel >= requiredPlanLevel
        }
    }
}
