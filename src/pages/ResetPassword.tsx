import { useState } from "react"
import { useTranslation } from "react-i18next"
import api from "@/services/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Lock, Eye, EyeOff, Loader2, KeyRound, ArrowLeft } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

export default function ResetPassword() {
    const { t } = useTranslation()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const token = searchParams.get('token')

    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    // Password strength
    const getPasswordStrength = (pwd: string) => {
        const checks = {
            length: pwd.length >= 8,
            upper: /[A-Z]/.test(pwd),
            lower: /[a-z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            special: /[^A-Za-z0-9]/.test(pwd),
        }
        const score = Object.values(checks).filter(Boolean).length
        return { checks, score }
    }
    const strength = getPasswordStrength(password)
    const strengthLabel = ['', 'Muito fraca', 'Fraca', 'Razoável', 'Forte', 'Muito forte'][strength.score] || ''
    const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'][strength.score] || ''

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 8) {
            toast.error("Senha deve ter no mínimo 8 caracteres")
            return
        }

        if (strength.score < 3) {
            toast.error("Senha muito fraca. Inclua letras maiúsculas, minúsculas, números ou caracteres especiais.")
            return
        }

        if (password !== confirmPassword) {
            toast.error(t('auth.passwords_must_match'))
            return
        }

        setIsLoading(true)

        try {
            await api.post('/auth/reset-password', { token, newPassword: password })
            toast.success(t('auth.password_reset_success'))
            setTimeout(() => navigate('/login'), 2000)
        } catch (error: unknown) {
            console.error("Reset Password Error:", error)
            const apiError = error as { response?: { data?: { error?: string } } }
            const msg = apiError.response?.data?.error || t('common.error')
            toast.error(msg)
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 p-4">
                <Card className="w-full max-w-[400px] shadow-lg border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900">
                    <CardHeader className="text-center">
                        <CardTitle className="text-red-700 dark:text-red-400">{t('common.error')}</CardTitle>
                        <CardDescription className="text-red-600 dark:text-red-300">{t('auth.invalid_token')}</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Link to="/login"><Button variant="outline">{t('auth.back_to_login')}</Button></Link>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 p-4 transition-colors duration-500">
            <Card className="w-full max-w-[400px] shadow-lg border-slate-100 dark:border-slate-800 bg-white dark:bg-[#222428]">
                <CardHeader className="space-y-1 text-center pb-6">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-slate-800 rounded-full">
                            <KeyRound className="h-6 w-6 text-blue-600 dark:text-slate-200" />
                        </div>
                    </div>
                    <CardTitle className="text-xl font-bold dark:text-slate-50">{t('auth.reset_password')}</CardTitle>
                    <CardDescription className="dark:text-slate-400">
                        {t('auth.reset_password_subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="dark:text-slate-200">{t('auth.new_password')}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="pl-9 pr-9 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full w-9 hover:bg-transparent text-muted-foreground dark:text-slate-500 dark:hover:text-slate-300"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="dark:text-slate-200">{t('auth.confirm_password')}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    className="pl-9 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {password && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 flex gap-1">
                                        {[1,2,3,4,5].map(i => (
                                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.score ? strengthColor : 'bg-slate-200 dark:bg-slate-700'}`} />
                                        ))}
                                    </div>
                                    <span className={`text-xs font-medium ${strength.score <= 2 ? 'text-red-500' : strength.score <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                        {strengthLabel}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                                    <span className={strength.checks.length ? 'text-green-600' : 'text-slate-400'}>
                                        {strength.checks.length ? '✓' : '○'} Mínimo 8 caracteres
                                    </span>
                                    <span className={strength.checks.upper ? 'text-green-600' : 'text-slate-400'}>
                                        {strength.checks.upper ? '✓' : '○'} Letra maiúscula
                                    </span>
                                    <span className={strength.checks.lower ? 'text-green-600' : 'text-slate-400'}>
                                        {strength.checks.lower ? '✓' : '○'} Letra minúscula
                                    </span>
                                    <span className={strength.checks.number ? 'text-green-600' : 'text-slate-400'}>
                                        {strength.checks.number ? '✓' : '○'} Número
                                    </span>
                                    <span className={strength.checks.special ? 'text-green-600' : 'text-slate-400'}>
                                        {strength.checks.special ? '✓' : '○'} Caractere especial
                                    </span>
                                    {confirmPassword && (
                                        <span className={password === confirmPassword ? 'text-green-600' : 'text-red-500'}>
                                            {password === confirmPassword ? '✓' : '✗'} Senhas conferem
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? t('common.saving') : t('auth.reset_password_action')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4 dark:border-slate-800">
                    <Link to="/login" className="flex items-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> {t('auth.back_to_login')}
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
