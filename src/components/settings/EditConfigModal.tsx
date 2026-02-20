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
import { Switch } from "@/components/ui/switch"

interface ConfigItem {
    id: string
    name: string
    description: string
    value: string | number | boolean
    type: "BOOLEAN" | "STRING" | "NUMBER"
    required?: boolean
    hidden?: boolean
}

interface EditConfigModalProps {
    isOpen: boolean
    onClose: () => void
    config: ConfigItem | null
    onSave: (config: ConfigItem) => void
}

export function EditConfigModal({ isOpen, onClose, config, onSave }: EditConfigModalProps) {
    const [value, setValue] = useState<string | number | boolean>("")

    useEffect(() => {
        if (config) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setValue(config.value)
        }
    }, [config, isOpen])

    const handleSave = () => {
        if (config) {
            onSave({ ...config, value })
            onClose()
        }
    }

    if (!config) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[500px] dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="dark:text-slate-50">Editar Configuração</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-1">
                        <Label className="text-base dark:text-slate-200">{config.name}</Label>
                        <p className="text-sm text-muted-foreground dark:text-slate-400">{config.description}</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="dark:text-slate-300">Valor</Label>
                        {config.type === "BOOLEAN" ? (
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={value as boolean}
                                    onCheckedChange={(checked) => setValue(checked)}
                                />
                                <Label className="dark:text-slate-300">{value ? "Ativado" : "Desativado"}</Label>
                            </div>
                        ) : (
                            <Input
                                type={config.type === "NUMBER" ? "number" : "text"}
                                value={value as string}
                                onChange={(e) => setValue(config.type === "NUMBER" ? Number(e.target.value) : e.target.value)}
                                className="dark:bg-slate-800 dark:border-slate-700"
                            />
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="dark:text-slate-400 dark:hover:text-slate-200">Cancelar</Button>
                    <Button className="bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" onClick={handleSave}>Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
