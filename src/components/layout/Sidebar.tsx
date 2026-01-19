import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LayoutDashboard, User, Calendar, Activity, Users, Link, Settings, Brain, FileText, CreditCard, Calculator, Server, Building2, Briefcase } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { LanguageSwitcher } from "../LanguageSwitcher"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/contexts/ThemeContext"

import LogoLiamed from "@/assets/logo-liamed.png"
import LogoLiamedWhite from "@/assets/logo-liamed-white.png"

export type NavItem = "Dashboard" | "Diagnóstico" | "Usuários" | "Consultas" | "Endpoints" | "Configurações" | "Prompts" | "Logs" | "Perfil" | "Notificações" | "Planos" | "Calculadoras" | "Health" | "Clínica" | "Vagas" | "Others"

interface SidebarProps {
    className?: string
    currentPath?: NavItem
    onNavigate?: (path: NavItem) => void
}



export function Sidebar({ className, currentPath = "Dashboard", onNavigate }: SidebarProps) {
    const { user } = useAuth()
    const { t } = useTranslation();

    const menuItems: { icon: any, label: string, key: NavItem, href: string, adminOnly?: boolean, gestorOnly?: boolean }[] = [
        { icon: LayoutDashboard, label: t('sidebar.dashboard'), key: "Dashboard", href: "#" },
        { icon: Building2, label: "Visão da Clínica", key: "Clínica", href: "#", gestorOnly: true },
        { icon: User, label: t('sidebar.profile'), key: "Perfil", href: "#" },
        { icon: Calendar, label: t('sidebar.appointments'), key: "Consultas", href: "#" },
        { icon: Activity, label: t('sidebar.diagnosis'), key: "Diagnóstico", href: "#" },
        { icon: Users, label: t('sidebar.users'), key: "Usuários", href: "#", adminOnly: true },
        { icon: Link, label: t('sidebar.endpoints'), key: "Endpoints", href: "#", adminOnly: true },
        { icon: Brain, label: t('sidebar.prompts'), key: "Prompts", href: "#", adminOnly: true },
        { icon: Settings, label: t('sidebar.settings'), key: "Configurações", href: "#", adminOnly: true },
        { icon: FileText, label: t('sidebar.logs'), key: "Logs", href: "#", adminOnly: true },
        { icon: CreditCard, label: t('plans.title'), key: "Planos", href: "#", adminOnly: true },
        { icon: Calculator, label: t('calculators.title'), key: "Calculadoras", href: "#" },
        { icon: Briefcase, label: "Vagas", key: "Vagas", href: "#" },
        { icon: Server, label: t('health.title'), key: "Health", href: "#", adminOnly: true },
    ]

    const filteredItems = menuItems.filter(item => {
        if (item.gestorOnly) {
            return user?.role === 'ADMIN' || user?.role === 'GESTOR'
        }
        if (item.adminOnly) {
            return user?.role === 'ADMIN'
        }
        return true
    })

    const { isDark } = useTheme()

    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-[#222428] border-r border-slate-200 dark:border-slate-800 w-[240px] transition-colors", className)}>
            {/* Logo Section */}
            <div className="h-16 flex items-center px-6 border-b dark:border-slate-800">
                <div className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-white">
                    <img
                        src={isDark ? LogoLiamedWhite : LogoLiamed}
                        alt="LIAMED Logo"
                        className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
                    />
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                {filteredItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => onNavigate?.(item.key)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1",
                            currentPath === item.key
                                ? "bg-[#E6F2FF] dark:bg-slate-800 text-primary border-l-4 border-primary pl-3"
                                : "text-muted-foreground hover:bg-[#E6F2FF] dark:hover:bg-slate-800 hover:text-primary"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </button>
                ))}
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border dark:border-slate-700">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold dark:bg-slate-800">
                            {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden mr-auto">
                        <span className="text-sm font-medium truncate dark:text-slate-200">{user?.name || 'Usuário'}</span>
                        <span className="text-xs text-muted-foreground truncate">{user?.email || 'email@medipro.com'}</span>
                    </div>
                    <LanguageSwitcher />
                </div>
            </div>
        </div>
    )
}
