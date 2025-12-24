import { useState } from "react"
import { useTranslation } from "react-i18next"
import api from "@/services/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"
import LogoLiamed from "@/assets/logo-liamed.png"
import LogoLiamedWhite from "@/assets/logo-liamed-white.png"
import { useTheme } from "@/contexts/ThemeContext"

export default function ForgotPassword() {
    const { t } = useTranslation()
    const { isDark } = useTheme()
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await api.post('/auth/forgot-password', { email })
            // Always show success for security
            setIsSubmitted(true)
            toast.success(t('auth.forgot_password_sent'))
        } catch (error) {
            console.error("Forgot Password Error:", error)
            toast.error(t('common.error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:bg-[#222428] dark:bg-none p-4 transition-colors duration-500">
            <Card className="w-full max-w-[400px] shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#222428]">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <img
                            src={isDark ? LogoLiamedWhite : LogoLiamed}
                            alt="LIAMED Logo"
                            className="h-10 w-auto dark:brightness-0 dark:invert"
                        />
                    </div>
                    <CardTitle className="text-2xl">{t('auth.forgot_password')}</CardTitle>
                    <CardDescription className="dark:text-slate-400">
                        {isSubmitted ? t('auth.forgot_password_check_email') : t('auth.forgot_password_subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSubmitted ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-4 animate-in fade-in zoom-in duration-500">
                            <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                            <p className="text-center text-sm text-muted-foreground">
                                {t('auth.forgot_password_success_msg', { email })}
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="dark:text-slate-200">{t('auth.email')}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="medico@medipro.com"
                                        className="pl-9 border-slate-200 focus-visible:ring-blue-600 dark:bg-[#222428] dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-slate-300"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-[#0066CC] hover:bg-[#0055AA] dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? t('common.sending') : t('auth.send_recovery_link')}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4 dark:border-slate-800">
                    <Link to="/login" className="flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> {t('auth.back_to_login')}
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
