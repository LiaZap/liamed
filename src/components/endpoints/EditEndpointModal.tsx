/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react"
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
import { Switch } from "@/components/ui/switch"

interface EditEndpointModalProps {
    isOpen: boolean
    onClose: () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    endpoint?: any
     
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSave: (data: any) => void
     
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onTest?: (data: any) => void
 
}

export function EditEndpointModal({ isOpen, onClose, endpoint, onSave, onTest }: EditEndpointModalProps) {
    const [name, setName] = useState("")
    const [url, setUrl] = useState("")
    const [method, setMethod] = useState("POST")
    const [authType, setAuthType] = useState("BEARER_TOKEN")
    const [token, setToken] = useState("")
    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
        if (isOpen) {
            if (endpoint) {
                setName(endpoint.name)
                setUrl(endpoint.url)
                setMethod(endpoint.method)
                setAuthType(endpoint.authType || "BEARER")
                // Credentials are JSON, extracting typical token field if exists
                setToken(endpoint.credentials?.token || "")
                setIsActive(endpoint.status === "ATIVO")
            } else {
                // New defaults
                setName("")
                setUrl("https://api.openai.com/v1/chat/completions")
                setMethod("POST")
                setAuthType("BEARER")
                setToken("")
                setIsActive(true)
            }
        }
    }, [isOpen, endpoint])

    const handleSave = () => {
        onSave({
            name,
            url,
            method,
            authType,
            credentials: { token }, // Storing token in credentials JSON
            status: isActive ? "ATIVO" : "INATIVO"
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[600px] bg-white dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="dark:text-slate-50">{endpoint ? "Editar Endpoint" : "Novo Endpoint"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="dark:text-slate-300">Nome do Endpoint</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: OpenAI GPT-4" className="dark:bg-slate-800 dark:border-slate-700" />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 space-y-2">
                            <Label className="dark:text-slate-300">URL Base</Label>
                            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/v1..." className="font-mono text-xs dark:bg-slate-800 dark:border-slate-700" />
                        </div>
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">Método</Label>
                            <Select value={method} onValueChange={setMethod}>
                                <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="PUT">PUT</SelectItem>
                                    <SelectItem value="DELETE">DELETE</SelectItem>
                                    <SelectItem value="PATCH">PATCH</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="dark:text-slate-300">Tipo de Autenticação</Label>
                        <Select value={authType} onValueChange={setAuthType}>
                            <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BASIC_AUTH">Basic Auth</SelectItem>
                                <SelectItem value="BEARER">Bearer Token</SelectItem>
                                <SelectItem value="API_KEY">API Key</SelectItem>
                                <SelectItem value="OAUTH2">OAuth 2.0</SelectItem>
                                <SelectItem value="JWT">JWT</SelectItem>
                                <SelectItem value="DIGEST_AUTH">Digest Auth</SelectItem>
                                <SelectItem value="NTLM">NTLM</SelectItem>
                                <SelectItem value="AWS_SIGNATURE">AWS Signature</SelectItem>
                                <SelectItem value="CUSTOM_HEADER">Custom Header</SelectItem>
                                <SelectItem value="NONE">Nenhuma</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {authType !== 'NONE' && (
                        <div className="space-y-2">
                            <Label className="dark:text-slate-300">{authType === 'BASIC_AUTH' ? 'Credenciais (Base64)' : 'Token / Key'}</Label>
                            <Input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="sk-..."
                                className="font-mono text-xs dark:bg-slate-800 dark:border-slate-700"
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 mt-4">
                        <div className="space-y-0.5">
                            <Label className="text-base dark:text-slate-200">Endpoint Ativo</Label>
                            <p className="text-xs text-muted-foreground">Endpoints inativos não serão usados pela IA.</p>
                        </div>
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    {onTest && (
                        <Button type="button" variant="outline" onClick={() => onTest({ url, method, authType, credentials: { token } })} className="dark:bg-slate-800 dark:border-slate-700">
                            Testar Conexão
                        </Button>
                    )}
                    <Button variant="ghost" onClick={onClose} className="dark:text-slate-300 dark:hover:bg-slate-800">Cancelar</Button>
                    <Button onClick={handleSave} className="bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200">Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
