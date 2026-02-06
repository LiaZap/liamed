import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import LogoLiamed from "@/assets/logo-liamed.png"

import api from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRight, CheckCircle2, Building2, Users } from "lucide-react"

export default function RegisterGestor() {
    const navigate = useNavigate()
    const { login } = useAuth()
    
    const [isLoading, setIsLoading] = useState(false)
    
    // Form State
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [clinicName, setClinicName] = useState("")
    const [clinicCnpj, setClinicCnpj] = useState("")
    const [clinicPhone, setClinicPhone] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!name.trim()) return toast.error("Nome do gestor é obrigatório")
        if (!clinicName.trim()) return toast.error("Nome da clínica é obrigatório")
        if (password.length < 6) return toast.error("Senha muito curta (mínimo 6 caracteres)")
        if (password !== confirmPassword) return toast.error("Senhas não conferem")
        
        setIsLoading(true)

        try {
            const response = await api.post('/auth/register', {
                name,
                email,
                password,
                role: "GESTOR",
                clinicName,
                clinicCnpj,
                clinicPhone
            })
            
            const { token, user } = response.data
            await login(token, user)
            
            toast.success("Clínica registrada com sucesso!", {
                description: "Bem-vindo à LIAMED para Gestores."
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
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#1e293b] text-white flex-col p-12 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" 
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                </div>
                
                {/* Header / Logo */}
                <div className="relative z-10">
                    <img src={LogoLiamed} alt="LIAMED" className="h-10 opacity-90 brightness-0 invert" />
                </div>
                
                {/* Content */}
                <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg">
                    <div className="h-16 w-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                        <Building2 className="h-8 w-8 text-blue-400" />
                    </div>

                    <h1 className="text-4xl font-semibold tracking-tight leading-tight mb-6">
                        Gestão inteligente para <br/>sua clínica ou hospital.
                    </h1>
                    <ul className="space-y-4 text-lg text-slate-300">
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                            <span>Centralize o atendimento da sua equipe</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                            <span>Monitore a produtividade em tempo real</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                            <span>Padronize os protocolos médicos</span>
                        </li>
                    </ul>
                </div>

                {/* Footer Stat */}
                <div className="relative z-10 border-t border-white/10 pt-8 mt-8">
                     <div className="flex items-center gap-4">
                        <div className="flex -space-x-4">
                            {[1,2,3].map(i => (
                                <div key={i} className="h-10 w-10 rounded-full border-2 border-[#1e293b] bg-slate-600 flex items-center justify-center text-xs">
                                    <Users className="h-5 w-5 text-slate-300" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-slate-400">Junte-se a centenas de gestores que modernizaram suas clínicas.</p>
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
                        <span className="text-sm font-semibold text-blue-600 tracking-wider uppercase mb-2 block">Área do Gestor</span>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Cadastre sua Clínica
                        </h2>
                        <p className="mt-2 text-slate-600 dark:text-slate-400">
                            Crie sua conta administrativa e comece a adicionar sua equipe médica.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="clinicName">Nome da Clínica</Label>
                                <Input 
                                    id="clinicName" 
                                    placeholder="Ex: Clínica Santa Vida" 
                                    className="h-11"
                                    value={clinicName}
                                    onChange={e => setClinicName(e.target.value)}
                                    required 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="clinicCnpj">CNPJ (Opcional)</Label>
                                    <Input 
                                        id="clinicCnpj" 
                                        placeholder="00.000.000/0000-00" 
                                        className="h-11"
                                        value={clinicCnpj}
                                        onChange={e => setClinicCnpj(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="clinicPhone">Telefone (Opcional)</Label>
                                    <Input 
                                        id="clinicPhone" 
                                        placeholder="(00) 00000-0000" 
                                        className="h-11"
                                        value={clinicPhone}
                                        onChange={e => setClinicPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-[#0f1115] px-2 text-muted-foreground">Dados do Gestor</span>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Seu Nome Completo</Label>
                                <Input 
                                    id="name" 
                                    placeholder="Ex: Roberto Almeida" 
                                    className="h-11"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required 
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Seu E-mail Corporativo</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="roberto@clinica.com" 
                                    className="h-11"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required 
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <Input 
                                        id="password" 
                                        type="password" 
                                        className="h-11"
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
                                        className="h-11"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-12 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Criar Conta da Clínica"}
                            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>

                        <p className="text-xs text-center text-slate-500 mt-6">
                            Ao se cadastrar, você concorda com nossos <br/>Termos de Uso e Política de Privacidade.
                        </p>
                    </form>

                    <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            É um médico?{" "}
                            <Link to="/register" className="font-semibold text-[#0066CC] hover:underline">
                                Cadastro para Médicos
                            </Link>
                        </p>
                         <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                            Já tem conta?{" "}
                            <Link to="/login" className="font-semibold text-slate-900 dark:text-slate-200 hover:underline">
                                Fazer Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
