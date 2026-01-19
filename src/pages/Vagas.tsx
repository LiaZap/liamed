import { useTheme } from "@/contexts/ThemeContext"
import LogoLiamed from "@/assets/logo-liamed.png"
import LogoLiamedWhite from "@/assets/logo-liamed-white.png"
import { Briefcase, Sparkles, Clock } from "lucide-react"

export default function Vagas() {
    const { isDark } = useTheme()

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
            {/* Logo */}
            <div className="mb-8 animate-fade-in-up">
                <img
                    src={isDark ? LogoLiamedWhite : LogoLiamed}
                    alt="LIAMED Logo"
                    className="h-16 w-auto object-contain mx-auto"
                />
            </div>

            {/* Icon */}
            <div className="relative mb-6 animate-fade-in-up animate-delay-100">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                    <Briefcase className="h-12 w-12 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg animate-pulse">
                    <Sparkles className="h-4 w-4 text-yellow-800" />
                </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-3 animate-fade-in-up animate-delay-200">
                Vagas & Oportunidades
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground mb-6 max-w-md animate-fade-in-up animate-delay-300">
                Em breve você poderá encontrar e publicar vagas para profissionais de saúde diretamente na plataforma.
            </p>

            {/* Badge Em Desenvolvimento */}
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600 animate-fade-in-up animate-delay-400">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                    Em Desenvolvimento
                </span>
            </div>

            {/* Features Preview */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl animate-fade-in-up animate-delay-500">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3 mx-auto">
                        <span className="text-xl">👨‍⚕️</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Buscar Vagas</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3 mx-auto">
                        <span className="text-xl">🏥</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Publicar Vagas</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3 mx-auto">
                        <span className="text-xl">🤝</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Conectar Talentos</p>
                </div>
            </div>
        </div>
    )
}
