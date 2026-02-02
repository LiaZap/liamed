import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import LogoLiamed from "@/assets/logo-liamed.png"
import LogoLiamedWhite from "@/assets/logo-liamed-white.png"
import api from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowRight, CheckCircle2, ShieldCheck, Star } from "lucide-react"

// Lista completa de especialidades médicas (mantida)
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
    const navigate = useNavigate()
    const { login } = useAuth()
    
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [specialty, setSpecialty] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!name.trim()) return toast.error("Nome é obrigatório")
        if (!specialty) return toast.error("Especialidade é obrigatória")
        if (password.length < 6) return toast.error("Senha muito curta (mínimo 6 caracteres)")
        if (password !== confirmPassword) return toast.error("Senhas não conferem")
        
        setIsLoading(true)

        try {
            const response = await api.post('/auth/register', {
                name,
                email,
                password,
                specialty,
                phone: null,
                role: "MEDICO"
            })
            
            const { token, user } = response.data
            login(token, user)
            
            toast.success("Conta criada com sucesso!", {
                description: "Bem-vindo à LIAMED Profissional."
            })
            
            navigate('/dashboard')
        } catch (error: any) {
            console.error("Register Error:", error)
            const errorMessage = error.response?.data?.error || "Falha no cadastro."
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-white dark:bg-[#0f1115]">
            {/* Esquerda - Visual / Trust (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#002A4D] text-white flex-col justify-between p-12 overflow-hidden">
                {/* Background Pattern Subtle */}
                <div className="absolute inset-0 opacity-10" 
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                </div>
                
                {/* Content */}
                <div className="relative z-10 mt-10">
                    <img src={LogoLiamedWhite} alt="LIAMED" className="h-10 mb-8 opacity-90" />
                    <h1 className="text-4xl font-semibold tracking-tight leading-tight mb-6">
                        A inteligência clínica <br/>que o seu consultório merece.
                    </h1>
                    <ul className="space-y-4 text-lg text-blue-100/90">
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-blue-400" />
                            <span>Transcrição de consultas em tempo real</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-blue-400" />
                            <span>Geração automática de documentos</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-blue-400" />
                            <span>Segurança de dados nível hospitalar</span>
                        </li>
                    </ul>
                </div>

                {/* Testimonial / Footer */}
                <div className="relative z-10 space-y-6">
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                        <div className="flex gap-1 mb-3">
                            {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
                        </div>
                        <p className="text-lg italic font-light mb-4 text-blue-50">
                            "A LIAMED reduziu meu tempo de burocracia em 70%. Hoje consigo focar totalmente no paciente."
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-400 flex items-center justify-center font-bold text-[#002A4D]">DR</div>
                            <div>
                                <p className="font-medium text-sm">Dr. Rafael Mendes</p>
                                <p className="text-xs text-blue-300">Cardiologista</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-blue-300/60">
                         <ShieldCheck className="h-4 w-4" /> Dados criptografados ponta-a-ponta.
                    </div>
                </div>
            </div>

            {/* Direita - Formulário */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
                <div className="max-w-md w-full space-y-8">
                    {/* Header Mobile */}
                    <div className="lg:hidden text-center mb-8">
                        <img src={LogoLiamed} alt="LIAMED" className="h-10 mx-auto" />
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Crie sua conta profissional
                        </h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">
                            Comece seu teste de 15 dias do plano PRO. <br className="hidden lg:block"/>Sem compromisso.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome Completo</Label>
                                <Input 
                                    id="name" 
                                    placeholder="Ex: Dr. João Silva" 
                                    className="h-11 bg-slate-50 border-slate-200 focus:border-blue-600 focus:ring-blue-600/20 transition-all dark:bg-[#1a1d21] dark:border-slate-800"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required 
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">E-mail Profissional</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="seu@email.com" 
                                    className="h-11 bg-slate-50 border-slate-200 focus:border-blue-600 focus:ring-blue-600/20 transition-all dark:bg-[#1a1d21] dark:border-slate-800"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required 
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Especialidade</Label>
                                <Select value={specialty} onValueChange={setSpecialty}>
                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 focus:ring-blue-600/20 dark:bg-[#1a1d21] dark:border-slate-800">
                                        <SelectValue placeholder="Selecione sua especialidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MEDICAL_SPECIALTIES.map((spec) => (
                                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <Input 
                                        id="password" 
                                        type="password" 
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-blue-600 focus:ring-blue-600/20 transition-all dark:bg-[#1a1d21] dark:border-slate-800"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required 
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                                    <Input 
                                        id="confirmPassword" 
                                        type="password" 
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-blue-600 focus:ring-blue-600/20 transition-all dark:bg-[#1a1d21] dark:border-slate-800"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-12 text-base font-semibold bg-[#0066CC] hover:bg-[#0052a3] text-white shadow-lg shadow-blue-900/10 transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Criar Conta e Acessar"}
                            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>

                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
                            Ao se cadastrar, você concorda com nossos <br/>Termos de Uso e Política de Privacidade.
                        </p>
                    </form>

                    <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Já tem uma conta?{" "}
                            <Link to="/login" className="font-semibold text-[#0066CC] hover:underline">
                                Fazer Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
