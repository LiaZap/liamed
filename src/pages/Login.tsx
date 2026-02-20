import { useState } from "react"
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import LogoLiamed from "@/assets/logo-liamed.png";
import LogoLiamedWhite from "@/assets/logo-liamed-white.png";
import api from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardDescription, CardFooter } from "@/components/ui/card"
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react"

export default function Login() {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await api.post('/auth/login', { email, password })
            const { token, user } = response.data

            await login(token, user)
            toast.success(t('auth.login_success'))
            // Optionally navigate after successful login
            navigate('/dashboard');
        } catch (error: unknown) {
            console.error("Login Error:", error)
            const apiError = error as { response?: { data?: { error?: string } } }
            const errorMessage = apiError.response?.data?.error || t('auth.login_error')
            toast.error(errorMessage)
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
                            className="h-16 w-auto object-contain dark:brightness-0 dark:invert"
                        />
                    </div>
                    {/* <CardTitle> removed as logo contains text */}
                    <CardDescription className="dark:text-slate-400">{t('auth.login_subtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="dark:text-slate-200">{t('auth.email')}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="medico@liamed.com"
                                    className="pl-9 border-slate-200 focus-visible:ring-blue-600 dark:bg-[#222428] dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus-visible:ring-slate-300"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="dark:text-slate-200">{t('auth.password')}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="pl-9 pr-9 border-slate-200 focus-visible:ring-blue-600 dark:bg-[#222428] dark:border-slate-700 dark:text-white dark:focus-visible:ring-slate-300"
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
                                    <span className="sr-only">Toggle password visibility</span>
                                </Button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-[#0066CC] hover:bg-[#0055AA] dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? t('auth.logging_in') : t('auth.login')}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline dark:text-blue-400">
                            {t('auth.forgot_password')}
                        </Link>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t p-4 dark:border-slate-800">
                    <p className="px-8 text-center text-sm text-muted-foreground">
              <Link
                to="/register"
                className="hover:text-brand underline underline-offset-4"
              >
                Criar conta de Médico
              </Link>
              {" · "}
              <Link
                to="/register-clinic"
                className="hover:text-brand underline underline-offset-4"
              >
                Cadastrar Clínica
              </Link>
            </p>    </CardFooter>
            </Card>
        </div>
    )
}
