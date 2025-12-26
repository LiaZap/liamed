import { useState, useEffect } from "react"
import api from "@/services/api"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Menu } from "lucide-react"
import { SelectPromptModal } from "./SelectPromptModal"

interface EditUserModalProps {
    isOpen: boolean
    onClose: () => void
    user?: any
    onSave?: (userData: any) => void
}

export function EditUserModal({ isOpen, onClose, user, onSave }: EditUserModalProps) {
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false)
    const [promptText, setPromptText] = useState("")

    // Form State
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("MEDICO")
    const [isActive, setIsActive] = useState(true)
    const [endpointId, setEndpointId] = useState("none")
    const [endpoints, setEndpoints] = useState<any[]>([])

    useEffect(() => {
        const fetchEndpoints = async () => {
            try {
                const response = await api.get('/endpoints')
                setEndpoints(response.data)
            } catch (error) {
                console.error("Failed to fetch endpoints", error)
            }
        }
        fetchEndpoints()
    }, [])

    useEffect(() => {
        if (isOpen) {
            if (user) {
                setName(user.name)
                setEmail(user.email)
                setRole(user.role || "MEDICO")
                setIsActive(user.status === "ATIVO")
                setPromptText(user.customPrompt || "")
                setEndpointId(user.endpointId || "none")
                setPassword("") // Limpar senha ao editar para evitar envio acidental de dados antigos
            } else {
                // New User defaults
                setName("")
                setEmail("")
                setPassword("")
                setRole("MEDICO")
                setIsActive(true)
                setEndpointId("none")
                setPromptText(`# Prompt para Geração de Evolução Médica no Formato SOAP...`)
            }
        }
    }, [isOpen, user])

    const handlePromptSelect = (content: string) => {
        setPromptText(content)
        setIsPromptModalOpen(false)
    }

    const handleSave = () => {
        if (!user && !password) {
            toast.error("A senha é obrigatória para novos usuários.")
            return
        }

        if (onSave) {
            // @ts-ignore
            onSave({
                name,
                email,
                password,
                role,
                status: isActive ? "ATIVO" : "INATIVO",
                customPrompt: promptText,
                endpointId: endpointId === "none" ? null : endpointId
            })
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-[700px] w-full p-0 gap-0 bg-white">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle className="text-xl font-bold">{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@medipro.com" />
                        </div>

                        {/* Password - Agora visível sempre, mas opcional para edição */}
                        <div className="space-y-2">
                            <Label>Senha {user && <span className="text-xs font-normal text-muted-foreground">(Deixe em branco para manter a atual)</span>}</Label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={user ? "Nova senha (opcional)" : "Senha inicial obrigatória"}
                            />
                        </div>

                        {/* User Type */}
                        <div className="space-y-2">
                            <Label>Tipo de Usuário</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MEDICO">Médico</SelectItem>
                                    <SelectItem value="ADMIN">Administrador</SelectItem>
                                    <SelectItem value="RECEPCIONISTA">Recepcionista</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Endpoint Selection */}
                        <div className="space-y-2">
                            <Label>Endpoint de IA (Opcional)</Label>
                            <Select value={endpointId} onValueChange={setEndpointId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um endpoint..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Padrão do Sistema (System Key)</SelectItem>
                                    {endpoints.map((ep) => (
                                        <SelectItem key={ep.id} value={ep.id}>
                                            {ep.name} ({ep.model || 'OpenAI'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">Define qual API de IA este usuário utilizará.</p>
                        </div>

                        {/* Prompt AI */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Prompt IA</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => setIsPromptModalOpen(true)}
                                >
                                    <Menu className="h-3 w-3" /> Selecionar Prompt
                                </Button>
                            </div>
                            <Textarea
                                className="min-h-[150px] font-mono text-sm"
                                maxLength={5000}
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                            <div className="space-y-0.5">
                                <Label className="text-base">Usuário Ativo</Label>
                                <p className="text-xs text-muted-foreground">Desative para bloquear o acesso deste usuário.</p>
                            </div>
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t sm:justify-end gap-2">
                        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button className="bg-[#0066CC] hover:bg-[#0055AA]" onClick={handleSave}>Salvar Alterações</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SelectPromptModal
                isOpen={isPromptModalOpen}
                onClose={() => setIsPromptModalOpen(false)}
                onSelect={handlePromptSelect}
            />
        </>
    )
}
