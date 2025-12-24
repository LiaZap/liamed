import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Calendar as CalendarIcon, Clock } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"

interface CreateConsultationModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    initialPatientName?: string
}

export function CreateConsultationModal({ isOpen, onClose, onSuccess, initialPatientName = '' }: CreateConsultationModalProps) {
    const { t } = useTranslation()
    const [isLoading, setIsLoading] = useState(false)
    const [patientName, setPatientName] = useState(initialPatientName)
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [type, setType] = useState('CONSULTA')

    useEffect(() => {
        if (isOpen) {
            setPatientName(initialPatientName)
            setDate('')
            setTime('')
            setType('CONSULTA')
        }
    }, [isOpen, initialPatientName])

    const handleSave = async () => {
        if (!patientName || !date || !time) {
            toast.error(t('common.fill_required'))
            return
        }

        try {
            setIsLoading(true)

            // Combine date and time into ISO string
            const dateTime = new Date(`${date}T${time}:00`)

            await api.post('/consults', {
                patientName,
                date: dateTime.toISOString(),
                type
            })

            toast.success(t('consultations.toasts.create_success'))
            onSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            toast.error(t('consultations.toasts.create_error'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] dark:bg-slate-900 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle>{t('consultations.create.title')}</DialogTitle>
                    <DialogDescription>{t('consultations.create.subtitle')}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="patientName">{t('consultations.create.patient_name')} <span className="text-red-500">*</span></Label>
                        <Input
                            id="patientName"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder={t('consultations.create.patient_placeholder')}
                            className="dark:bg-slate-800 dark:border-slate-700"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">{t('consultations.create.date')} <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="pl-9 dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">{t('consultations.create.time')} <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="time"
                                    type="time"
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="pl-9 dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">{t('consultations.create.type')}</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CONSULTA">{t('consultations.filters.consultation')}</SelectItem>
                                <SelectItem value="RETORNO">{t('consultations.filters.return')}</SelectItem>
                                <SelectItem value="EMERGENCIA">{t('consultations.filters.emergency')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-[#0066CC] hover:bg-[#0055AA] text-white">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('consultations.create.submit')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
