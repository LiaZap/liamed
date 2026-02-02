import { useState, useEffect } from "react"
import { useTheme } from "@/contexts/ThemeContext"
import { useAuth } from "@/contexts/AuthContext"
import LogoLiamed from "@/assets/logo-liamed.png"
import LogoLiamedWhite from "@/assets/logo-liamed-white.png"
import { Briefcase, Sparkles, Clock, Bell, Mail, MessageCircle, Save, Loader2 } from "lucide-react"
import { PlanGate } from "@/components/PlanGate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import api from "@/services/api"

export default function Vagas() {
    const { isDark } = useTheme()
    const { user } = useAuth()
    
    // Notification preferences state
    const [notifyWhatsApp, setNotifyWhatsApp] = useState(false)
    const [notifyEmail, setNotifyEmail] = useState(false)
    const [whatsappNumber, setWhatsappNumber] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Load user preferences
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const response = await api.get('/users/profile')
                const userData = response.data
                setNotifyWhatsApp(userData.notifyVagasWhatsApp || false)
                setNotifyEmail(userData.notifyVagasEmail || false)
                setWhatsappNumber(userData.phone || "")
            } catch (error) {
                console.error("Failed to load preferences", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadPreferences()
    }, [])

    const handleSavePreferences = async () => {
        setIsSaving(true)
        try {
            await api.put('/users/profile', {
                notifyVagasWhatsApp: notifyWhatsApp,
                notifyVagasEmail: notifyEmail,
                phone: whatsappNumber
            })
            toast.success("Preferências salvas!", {
                description: "Você receberá notificações de vagas conforme configurado."
            })
        } catch (error) {
            console.error("Failed to save preferences", error)
            toast.error("Erro ao salvar preferências")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <PlanGate requiredPlan="PREMIUM" featureName="Mural de Vagas Médicas">
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

            {/* Notification Preferences Card */}
            <Card className="mt-10 w-full max-w-md animate-fade-in-up animate-delay-500 dark:bg-slate-800 dark:border-slate-700">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg dark:text-slate-50">
                        <Bell className="h-5 w-5 text-primary" />
                        Notificações de Vagas
                    </CardTitle>
                    <CardDescription>
                        Seja notificado quando novas vagas forem publicadas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
                            {/* Email Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="text-left">
                                        <Label htmlFor="notify-email" className="font-medium dark:text-slate-200">
                                            Notificar por Email
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id="notify-email"
                                    checked={notifyEmail}
                                    onCheckedChange={setNotifyEmail}
                                />
                            </div>

                            {/* WhatsApp Toggle */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                            <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="text-left">
                                            <Label htmlFor="notify-whatsapp" className="font-medium dark:text-slate-200">
                                                Notificar por WhatsApp
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Receba alertas instantâneos
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        id="notify-whatsapp"
                                        checked={notifyWhatsApp}
                                        onCheckedChange={setNotifyWhatsApp}
                                    />
                                </div>
                                
                                {/* WhatsApp Number Input */}
                                {notifyWhatsApp && (
                                    <div className="pl-13 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <Input
                                            placeholder="(11) 99999-9999"
                                            value={whatsappNumber}
                                            onChange={(e) => setWhatsappNumber(e.target.value)}
                                            className="dark:bg-slate-900 dark:border-slate-600"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Número com DDD para receber mensagens
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Save Button */}
                            <Button 
                                className="w-full gap-2"
                                onClick={handleSavePreferences}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Salvar Preferências
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

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
        </PlanGate>
    )
}

