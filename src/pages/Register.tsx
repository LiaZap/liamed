import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import LogoLiamed from "@/assets/logo-liamed.png"

import api from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowRight, CheckCircle2, ShieldCheck, Star } from "lucide-react"

// Lista de Depoimentos (15 variações)
const TESTIMONIALS = [
    {
        name: "Dr. Rafael Mendes",
        role: "Cardiologista",
        text: "A LIAMED reduziu meu tempo de burocracia em 70%. Hoje consigo focar totalmente no paciente e não na papelada."
    },
    {
        name: "Dra. Juliana Costa",
        role: "Dermatologista",
        text: "Impressionante como a IA captura os detalhes das lesões e já sugere o protocolo correto. Minhas consultas ficaram muito mais ágeis."
    },
    {
        name: "Dr. Marcos Oliveira",
        role: "Neurologista",
        text: "Para exames complexos, a precisão da transcrição é fundamental. A LIAMED nunca errou um termo técnico. Recomendo."
    },
    {
        name: "Dra. Fernanda Santos",
        role: "Pediatra",
        text: "Consigo dar muito mais atenção aos pais e às crianças, pois não preciso ficar digitando durante a consulta."
    },
    {
        name: "Dr. André Ferreira",
        role: "Ortopedista",
        text: "A geração automática de atestados e pedidos de exames agilizou muito o fluxo do meu consultório lotado."
    },
    {
        name: "Dra. Beatriz Lima",
        role: "Ginecologista",
        text: "Segurança de dados era minha maior preocupação. A criptografia da LIAMED me deu a tranquilidade que eu precisava."
    },
    {
        name: "Dr. Ricardo Alves",
        role: "Psiquiatra",
        text: "A IA capta nuances do discurso do paciente que antes eu precisava anotar correndo. A qualidade dos meus prontuários triplicou."
    },
    {
        name: "Dra. Camila Rocha",
        role: "Endocrinologista",
        text: "A interface é limpa e não atrapalha o atendimento. Parece que tenho uma assistente invisível anotando tudo."
    },
    {
        name: "Dr. Bruno Carvalho",
        role: "Cirurgião Geral",
        text: "Uso no pós-operatório para registrar evoluções rápidas. É um divisor de águas na gestão do tempo hospitalar."
    },
    {
        name: "Dra. Luana Martins",
        role: "Oftalmologista",
        text: "Integração perfeita com meu fluxo de trabalho. Não consigo mais imaginar atender sem esse suporte."
    },
    {
        name: "Dr. Tiago Gomes",
        role: "Urologista",
        text: "Simples, direto e eficiente. Cumpre exatamente o que promete sem complicações desnecessárias."
    },
    {
        name: "Dra. Mariana Dias",
        role: "Geriatra",
        text: "Meus pacientes idosos se sentem mais ouvidos, pois olho para eles o tempo todo, não para a tela do computador."
    },
    {
        name: "Dr. Gustavo Pereira",
        role: "Otorrinolaringologista",
        text: "A transcrição funciona perfeitamente até mesmo com ruído ambiente do consultório. Tecnologia de ponta."
    },
    {
        name: "Dra. Vanessa Cunha",
        role: "Nefrologista",
        text: "O suporte é excelente e a ferramenta evolui a cada semana. Sinto que faço parte de algo inovador."
    },
    {
        name: "Dr. Felipe Barbosa",
        role: "Infectologista",
        text: "Essencial para manter o histórico detalhado dos pacientes sem perder horas digitando após os atendimentos."
    }
]

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
    
    // Carousel State
    const [currentTestimonial, setCurrentTestimonial] = useState(0)
    const [fadeKey, setFadeKey] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)
            setFadeKey((prev) => prev + 1)
        }, 5000) // 5 seconds per slide
        return () => clearInterval(interval)
    }, [])
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
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#002A4D] text-white flex-col p-12 overflow-hidden">
                {/* Background Pattern Subtle */}
                <div className="absolute inset-0 opacity-10" 
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                </div>
                
                {/* Header / Logo */}
                <div className="relative z-10">
                    <img src={LogoLiamed} alt="LIAMED" className="h-10 opacity-90 brightness-0 invert" />
                </div>
                
                {/* Content - Vertically Centered */}
                <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
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
                <div className="relative z-10 space-y-8">
                    {/* Carousel Container */}
                    <div className="min-h-[160px] flex items-end"> 
                        <div 
                            key={fadeKey}
                            className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full"
                        >
                            <div className="relative">
                                {/* Large Quote Icon for visual interest */}
                                <span className="absolute -top-6 -left-2 text-6xl text-blue-400/20 font-serif leading-none">"</span>
                                
                                <p className="relative text-xl md:text-2xl font-light leading-relaxed text-blue-50 mb-6 pl-4">
                                    {TESTIMONIALS[currentTestimonial].text}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 pl-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/20 text-sm">
                                    {TESTIMONIALS[currentTestimonial].name.split(" ")[0].substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="flex gap-1 mb-1">
                                        {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />)}
                                    </div>
                                    <p className="font-semibold text-white tracking-wide">{TESTIMONIALS[currentTestimonial].name}</p>
                                    <p className="text-sm text-blue-200 font-medium">{TESTIMONIALS[currentTestimonial].role}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs font-medium text-blue-200/50 pt-6 border-t border-white/5">
                         <div className="flex items-center gap-2">
                             <ShieldCheck className="h-4 w-4 text-blue-400" /> 
                             <span className="tracking-wide uppercase">Dados criptografados</span>
                         </div>
                         <div className="flex gap-2">
                            {TESTIMONIALS.map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`h-1 rounded-full transition-all duration-500 ${idx === currentTestimonial ? 'w-6 bg-blue-400' : 'w-1 bg-white/10'}`}
                                />
                            ))}
                         </div>
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
