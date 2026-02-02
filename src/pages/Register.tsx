import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import LogoLiamed from "@/assets/logo-liamed.png"
import LogoLiamedWhite from "@/assets/logo-liamed-white.png"
import api from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Lock, Eye, EyeOff, Loader2, Stethoscope, ArrowLeft, Sparkles } from "lucide-react"

// Lista completa de especialidades médicas reconhecidas
const MEDICAL_SPECIALTIES = [
    "Acupuntura",
    "Alergia e Imunologia",
    "Anestesiologia",
    "Angiologia",
    "Cardiologia",
    "Cirurgia Cardiovascular",
    "Cirurgia da Mão",
    "Cirurgia de Cabeça e Pescoço",
    "Cirurgia do Aparelho Digestivo",
    "Cirurgia Geral",
    "Cirurgia Oncológica",
    "Cirurgia Pediátrica",
    "Cirurgia Plástica",
    "Cirurgia Torácica",
    "Cirurgia Vascular",
    "Clínica Médica",
    "Coloproctologia",
    "Dermatologia",
    "Endocrinologia e Metabologia",
    "Endoscopia",
    "Gastroenterologia",
    "Genética Médica",
    "Geriatria",
    "Ginecologia e Obstetrícia",
    "Hematologia e Hemoterapia",
    "Homeopatia",
    "Infectologia",
    "Mastologia",
    "Medicina de Emergência",
    "Medicina de Família e Comunidade",
    "Medicina do Trabalho",
    "Medicina do Tráfego",
    "Medicina Esportiva",
    "Medicina Física e Reabilitação",
    "Medicina Intensiva",
    "Medicina Legal e Perícia Médica",
    "Medicina Nuclear",
    "Medicina Preventiva e Social",
    "Nefrologia",
    "Neurocirurgia",
    "Neurologia",
    "Nutrologia",
    "Oftalmologia",
    "Oncologia Clínica",
    "Ortopedia e Traumatologia",
    "Otorrinolaringologia",
    "Patologia",
    "Patologia Clínica/Medicina Laboratorial",
    "Pediatria",
    "Pneumologia",
    "Psiquiatria",
    "Radiologia e Diagnóstico por Imagem",
    "Radioterapia",
    "Reumatologia",
    "Urologia"
]

export default function Register() {
    const { isDark } = useTheme()
    const navigate = useNavigate()
    const { login } = useAuth()
    
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    
    // Form fields
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [specialty, setSpecialty] = useState("")
    const [phone, setPhone] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validations
        if (!name.trim()) {
            toast.error("Por favor, informe seu nome completo")
            return
        }
        
        if (!specialty) {
            toast.error("Por favor, selecione sua especialidade médica")
            return
        }
        
        if (password.length < 6) {
            toast.error("A senha deve ter no mínimo 6 caracteres")
            return
        }
        
        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem")
            return
        }
        
        setIsLoading(true)

        try {
            // Register the doctor
            const response = await api.post('/auth/register', {
                name,
                email,
                password,
                specialty,
                phone: phone || null,
                role: "MEDICO"
            })
            
            const { token, user } = response.data
            
            // Auto-login after registration
            login(token, user)
            
            toast.success("Conta criada com sucesso!", {
                description: "Você ganhou acesso ao plano PRO por 15 dias grátis! 🎉"
            })
            
            navigate('/dashboard')
        } catch (error: any) {
            console.error("Register Error:", error)
            const errorMessage = error.response?.data?.error || "Erro ao criar conta. Tente novamente."
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:bg-[#222428] dark:bg-none p-4 transition-colors duration-500">
            <Card className="w-full max-w-[450px] shadow-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#222428]">
                <CardHeader className="space-y-1 text-center pb-4">
                    <div className="flex justify-center mb-4">
                        <img
                            src={isDark ? LogoLiamedWhite : LogoLiamed}
                            alt="LIAMED Logo"
                            className="h-14 w-auto object-contain dark:brightness-0 dark:invert"
                        />
                    </div>
                    <CardDescription className="dark:text-slate-400 text-base">
                        Crie sua conta e comece a usar a IA médica
                    </CardDescription>
                    
                    {/* PRO Trial Badge */}
                    <div className="flex justify-center pt-2">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600">
                            <Sparkles className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                15 dias grátis do Plano PRO
                            </span>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="dark:text-slate-200">Nome Completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Dr. João Silva"
                                    className="pl-9 border-slate-200 focus-visible:ring-blue-600 dark:bg-[#222428] dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="dark:text-slate-200">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="medico@email.com"
                                    className="pl-9 border-slate-200 focus-visible:ring-blue-600 dark:bg-[#222428] dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Specialty */}
                        <div className="space-y-2">
                            <Label className="dark:text-slate-200">Especialidade Médica</Label>
                            <Select value={specialty} onValueChange={setSpecialty}>
                                <SelectTrigger className="border-slate-200 dark:bg-[#222428] dark:border-slate-700 dark:text-white">
                                    <div className="flex items-center gap-2">
                                        <Stethoscope className="h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                        <SelectValue placeholder="Selecione sua especialidade" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[280px]">
                                    {MEDICAL_SPECIALTIES.map((spec) => (
                                        <SelectItem key={spec} value={spec}>
                                            {spec}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Phone (optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="dark:text-slate-200">
                                Telefone <span className="text-muted-foreground text-xs">(opcional)</span>
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="(11) 99999-9999"
                                className="border-slate-200 focus-visible:ring-blue-600 dark:bg-[#222428] dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="dark:text-slate-200">Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 6 caracteres"
                                    className="pl-9 pr-9 border-slate-200 focus-visible:ring-blue-600 dark:bg-[#222428] dark:border-slate-700 dark:text-white"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full w-9 hover:bg-transparent text-muted-foreground dark:text-slate-500"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="dark:text-slate-200">Confirmar Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground dark:text-slate-500" />
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Digite a senha novamente"
                                    className="pl-9 border-slate-200 focus-visible:ring-blue-600 dark:bg-[#222428] dark:border-slate-700 dark:text-white"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full bg-[#0066CC] hover:bg-[#0055AA] dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white" 
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Criando conta..." : "Criar Conta Grátis"}
                        </Button>
                    </form>
                </CardContent>
                
                <CardFooter className="flex flex-col gap-3 border-t p-4 dark:border-slate-800">
                    <p className="text-xs text-muted-foreground text-center dark:text-slate-400">
                        Ao criar sua conta, você concorda com nossos Termos de Uso e Política de Privacidade.
                    </p>
                    <Link 
                        to="/login" 
                        className="flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline dark:text-blue-400"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Já tenho uma conta
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
