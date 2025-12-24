import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    Search, RefreshCw, ChevronLeft, ChevronRight,
    Mic, FileText, Plus, Send,
    Bot, Copy, Maximize2, Share2, Printer, Loader2, X
} from "lucide-react"
import { ConsultationDetailsModal } from "@/components/diagnosis/ConsultationDetailsModal"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotifications } from "@/contexts/NotificationContext"

import api from "@/services/api"

export default function Diagnosis() {
    const { t } = useTranslation();
    const [responseState, setResponseState] = useState<'empty' | 'loading' | 'content'>('empty')
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [patientName, setPatientName] = useState('')

    // New States
    const [symptoms, setSymptoms] = useState('')
    const [complementaryData, setComplementaryData] = useState('')
    // const [showComplementary, setShowComplementary] = useState(false) // Removed simple toggle
    const [isComplementaryModalOpen, setIsComplementaryModalOpen] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [isRecording, setIsRecording] = useState(false)

    const [history, setHistory] = useState<any[]>([])
    const [historyLoading, setHistoryLoading] = useState(true)

    // ... existing states ...

    // Fetch history
    const fetchHistory = async () => {
        setHistoryLoading(true)
        try {
            const res = await api.get('/diagnosis')
            setHistory(res.data)
        } catch (error) {
            console.error("Failed to fetch history", error)
            toast.error(t('diagnosis.toasts.history_error'))
        } finally {
            setHistoryLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [])

    // Web Speech API State
    const [recognition, setRecognition] = useState<any>(null)

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            const recognitionInstance = new SpeechRecognition()
            recognitionInstance.continuous = true
            recognitionInstance.interimResults = true
            recognitionInstance.lang = t('language') === 'en' ? 'en-US' : 'pt-BR'

            recognitionInstance.onresult = (event: any) => {
                let interimTranscript = ''
                let finalTranscript = ''

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript
                    } else {
                        interimTranscript += event.results[i][0].transcript
                    }
                }

                // Show interim result if specific UI element existed, 
                // but for now we append to text area if we want live updates.
                // However, appending interim to a state managed textarea is tricky because of cursor position.
                // We will stick to final transcript for appending, but maybe we can update a "currentUtterance" state for visual feedback?
                // Let's just trust the finalTranscript for now but make sure it works reliably.

                if (finalTranscript) {
                    setSymptoms(prev => {
                        const newText = prev ? `${prev} ${finalTranscript}` : finalTranscript
                        return newText
                    })
                }
            }

            recognitionInstance.onerror = (event: any) => {
                console.error("Speech recognition error", event.error)
                // Don't stop recording on "no-speech" error which is common in continuous mode
                if (event.error !== 'no-speech') {
                    setIsRecording(false)
                    toast.error(t('diagnosis.toasts.speech_error') + event.error)
                }
            }

            recognitionInstance.onend = () => {
                // If we are still supposed to be recording, restart (for continuous dictation if browser stops it)
                // But simplified: just set IsRecording false
                setIsRecording(false)
            }

            setRecognition(recognitionInstance)
        } else {
            console.warn("Web Speech API not supported in this browser.")
        }
    }, [t])

    const toggleRecording = () => {
        if (!recognition) {
            toast.error(t('diagnosis.toasts.browser_support_error'))
            return
        }

        if (isRecording) {
            recognition.stop()
            setIsRecording(false)
            toast.success(t('diagnosis.toasts.transcription_ended'))
        } else {
            recognition.start()
            setIsRecording(true)
            toast.info(t('diagnosis.toasts.recording_start'), {
                description: t('diagnosis.toasts.recording_desc'),
            })
        }
    }

    // Modal Form States
    const [height, setHeight] = useState('')
    const [weight, setWeight] = useState('')
    const [imc, setImc] = useState('')
    const [gender, setGender] = useState('')
    const [pressure, setPressure] = useState('')
    const [heartRate, setHeartRate] = useState('')
    const [temp, setTemp] = useState('')
    const [satO2, setSatO2] = useState('')
    const [meds, setMeds] = useState('')
    const [allergies, setAllergies] = useState('')
    const [obs, setObs] = useState('')

    // Auto calculate IMC
    useEffect(() => {
        if (height && weight) {
            const h = parseFloat(height)
            const w = parseFloat(weight)
            if (h > 0 && w > 0) {
                setImc((w / (h * h)).toFixed(2))
            }
        }
    }, [height, weight])

    const handleConfirmComplementary = () => {
        // Format data nicely for the prompt or text view
        const lines = []
        if (height) lines.push(`- ${t('diagnosis.modal.fields.height')}: ${height}m`)
        if (weight) lines.push(`- ${t('diagnosis.modal.fields.weight')}: ${weight}kg`)
        if (imc) lines.push(`- ${t('diagnosis.modal.fields.imc')}: ${imc}`)
        if (gender) lines.push(`- ${t('diagnosis.modal.fields.sex')}: ${gender === 'm' ? t('diagnosis.modal.fields.male') : gender === 'f' ? t('diagnosis.modal.fields.female') : t('diagnosis.modal.fields.other')}`)
        if (pressure) lines.push(`- ${t('diagnosis.modal.fields.pressure')}: ${pressure}`)
        if (heartRate) lines.push(`- ${t('diagnosis.modal.fields.heart_rate')}: ${heartRate}`)
        if (temp) lines.push(`- ${t('diagnosis.modal.fields.temp')}: ${temp}`)
        if (satO2) lines.push(`- ${t('diagnosis.modal.fields.sat_o2')}: ${satO2}`)
        if (meds) lines.push(`\n${t('diagnosis.modal.fields.meds')}:\n${meds}`)
        if (allergies) lines.push(`\n${t('diagnosis.modal.fields.allergies')}:\n${allergies}`)
        if (obs) lines.push(`\n${t('diagnosis.modal.fields.notes')}:\n${obs}`)

        const formatted = lines.join('\n')
        setComplementaryData(formatted)
        setIsComplementaryModalOpen(false)
        toast.success(t('diagnosis.toasts.data_added'))
    }

    const fileInputRef = useRef<HTMLInputElement>(null)
    const { addNotification } = useNotifications()

    // ... (useEffect)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files))
            toast.success(t('diagnosis.toasts.files_selected', { count: e.target.files.length }))
        }
    }

    const handleSend = async () => {
        if (!patientName || !symptoms) {
            toast.error(t('diagnosis.toasts.fill_required'))
            return
        }

        setResponseState('loading')

        try {
            const formData = new FormData();
            formData.append('patientName', patientName);
            formData.append('userPrompt', symptoms); // renamed to userPrompt to match backend
            formData.append('complementaryData', complementaryData);

            files.forEach(file => {
                formData.append('exams', file);
            });

            // Call API
            // Note: In a real scenario, we would use the response from the API.
            // For now, we are simulating the streaming response or just showing the static one defined in the backend/frontend.
            // The backend returns a Diagnosis object with aiResponse.
            await api.post('/diagnosis', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Simulate delayed response for UX (or use real data if we parse it)
            setTimeout(() => {
                setResponseState('content')
                toast.success(t('diagnosis.toasts.success_title'))

                addNotification({
                    type: 'success',
                    title: t('diagnosis.toasts.success_title'),
                    message: t('diagnosis.toasts.success_msg', { name: patientName }),
                    link: '/diagnostico'
                })
            }, 1500)

        } catch (error) {
            console.error(error);
            toast.error(t('diagnosis.toasts.send_error'))
            setResponseState('empty')
        }
    }

    const handleHistoryClick = () => {
        setIsModalOpen(true)
    }

    const handleCopy = () => {
        toast.success(t('diagnosis.toasts.copy_success'), {
            description: t('diagnosis.toasts.copy_desc')
        })
    }

    const handleReloadHistory = () => {
        fetchHistory()
        toast.success(t('diagnosis.toasts.history_updated'))
    }

    return (
        <>
            <ConsultationDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6">
                {/* ... (Left Column - History) ... */}
                <div className="w-full lg:w-[30%] flex flex-col gap-4 h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-lg text-slate-900 dark:text-slate-50">{t('diagnosis.history.title')}</h2>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={handleReloadHistory}>
                            <RefreshCw className={`h-4 w-4 dark:text-slate-400 ${historyLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t('diagnosis.history.search_placeholder')} className="pl-9 bg-white dark:bg-[#222428] dark:border-slate-800" />
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-2 gap-2">
                        <Select>
                            <SelectTrigger className="bg-white dark:bg-[#222428] dark:border-slate-800">
                                <SelectValue placeholder={t('diagnosis.history.period')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">{t('diagnosis.history.days_7')}</SelectItem>
                                <SelectItem value="30d">{t('diagnosis.history.days_30')}</SelectItem>
                                <SelectItem value="all">{t('diagnosis.history.all')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex gap-1">
                            <Input className="bg-white dark:bg-slate-900 dark:border-slate-800 px-2 text-xs" type="date" />
                        </div>
                    </div>

                    {/* History List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {historyLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <div key={i} className="p-3 rounded-lg border bg-white dark:bg-[#222428] dark:border-slate-800">
                                    <div className="flex items-start gap-3">
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                            <Skeleton className="h-3 w-32" />
                                            <Skeleton className="h-3 w-full" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            history.length > 0 ? (
                                history.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={handleHistoryClick}
                                        className="p-3 rounded-lg border cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-[#222428] dark:border-slate-800"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-8 w-8 border dark:border-slate-700">
                                                <AvatarFallback className="text-xs text-white bg-slate-500 dark:bg-slate-700 dark:text-slate-200">
                                                    {item.patientName ? item.patientName.substring(0, 2).toUpperCase() : 'PA'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                                        {item.patientName}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mb-1">
                                                    📅 {new Date(item.createdAt).toLocaleDateString(t('language') === 'en' ? 'en-US' : 'pt-BR')}
                                                </p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                    {item.userPrompt}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    {t('diagnosis.history.empty')}
                                </div>
                            )
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                        <Button variant="outline" size="sm" className="h-8 text-xs dark:bg-slate-800 dark:border-slate-700" disabled>
                            <ChevronLeft className="h-3 w-3 mr-1" /> {t('diagnosis.history.previous')}
                        </Button>
                        <span className="text-xs text-muted-foreground">{t('diagnosis.history.page_info')}</span>
                        <Button variant="outline" size="sm" className="h-8 text-xs dark:bg-slate-800 dark:border-slate-700">
                            {t('diagnosis.history.next')} <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="w-full lg:w-[70%] flex flex-col gap-6 h-full overflow-y-auto pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0066CC] dark:text-slate-100">{t('diagnosis.form.title')}</h1>
                        <p className="text-sm text-muted-foreground">{t('diagnosis.form.subtitle')}</p>
                    </div>

                    {/* Form */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="dark:text-slate-200">{t('diagnosis.form.patient_name')} <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder={t('diagnosis.form.patient_placeholder')}
                                className="bg-white dark:bg-[#222428] dark:border-slate-800"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="dark:text-slate-200">{t('diagnosis.form.symptoms_label')} <span className="text-red-500">*</span></Label>
                            <Textarea
                                placeholder={t('diagnosis.form.symptoms_placeholder')}
                                className="min-h-[120px] bg-white dark:bg-[#222428] dark:border-slate-800 resize-none"
                                rows={6}
                                value={symptoms}
                                onChange={(e) => setSymptoms(e.target.value)}
                            />
                        </div>



                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-2 animate-in fade-in">
                                {files.map((f, i) => (
                                    <div key={i} className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border flex items-center gap-2">
                                        <FileText className="h-3 w-3" /> {f.name}
                                        <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700">×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />

                            <Button
                                variant={isRecording ? "destructive" : "outline"}
                                className={`gap-2 ${isRecording ? "animate-pulse" : "text-slate-600 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700"}`}
                                onClick={toggleRecording}
                            >
                                {isRecording ? <div className="h-3 w-3 bg-white rounded-sm" /> : <Mic className="h-4 w-4" />}
                                {isRecording ? t('diagnosis.form.recording') : t('diagnosis.form.transcribe')}
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 text-slate-600 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Plus className="h-4 w-4" /> {t('diagnosis.form.upload_exams')}
                            </Button>
                            <Button
                                variant={complementaryData ? "default" : "outline"}
                                className={`gap-2 ${complementaryData ? "bg-green-600 hover:bg-green-700 text-white" : "text-slate-600 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700"}`}
                                onClick={() => setIsComplementaryModalOpen(true)}
                            >
                                <FileText className="h-4 w-4" /> {complementaryData ? t('diagnosis.form.data_inserted') : t('diagnosis.form.complementary_data')}
                            </Button>
                            <div className="flex-1"></div>
                            <Button className="gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 text-white dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200" onClick={handleSend} disabled={responseState === 'loading'}>
                                {responseState === 'loading' ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" /> {t('diagnosis.form.generating')}
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" /> {t('diagnosis.form.send')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Response Area */}
                    <div className="flex-1 flex flex-col gap-3 min-h-[300px]">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                <Bot className="h-5 w-5 text-primary" />
                                {t('diagnosis.response.title')}
                            </h3>
                            {responseState === 'content' && (
                                <div className="flex gap-1">
                                    <TooltipProvider>
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={handleCopy}><Copy className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{t('diagnosis.tooltips.copy')}</TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"><Maximize2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{t('diagnosis.tooltips.expand')}</TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"><Share2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{t('diagnosis.tooltips.share')}</TooltipContent></Tooltip>
                                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"><Printer className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{t('diagnosis.tooltips.print')}</TooltipContent></Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}
                        </div>

                        <Card className="flex-1 bg-white dark:bg-[#222428] border-slate-200 dark:border-slate-800 overflow-hidden">
                            <CardContent className="h-full p-6">
                                {responseState === 'empty' && (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-3 opacity-60">
                                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
                                            <Bot className="h-8 w-8" />
                                        </div>
                                        <p>{t('diagnosis.response.empty_state')}</p>
                                    </div>
                                )}

                                {responseState === 'loading' && (
                                    <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                        <p className="text-sm font-medium text-primary">{t('diagnosis.response.loading')}</p>
                                    </div>
                                )}

                                {responseState === 'content' && (
                                    <div className="prose prose-sm max-w-none prose-blue dark:prose-invert">
                                        <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 border-b dark:border-slate-700 pb-2 mb-4">{t('diagnosis.response.preliminary_analysis')}</h4>
                                        <p className="text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: t('diagnosis.mock.analysis') }}></p>

                                        <ul className="my-4 space-y-2 text-slate-600 dark:text-slate-300">
                                            <li dangerouslySetInnerHTML={{ __html: t('diagnosis.mock.step_1') }}></li>
                                            <li dangerouslySetInnerHTML={{ __html: t('diagnosis.mock.step_2') }}></li>
                                            <li dangerouslySetInnerHTML={{ __html: t('diagnosis.mock.step_3') }}></li>
                                        </ul>

                                        <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 border-b dark:border-slate-700 pb-2 mb-4 mt-6">{t('diagnosis.response.conduct_suggestion')}</h4>
                                        <p className="text-slate-600 dark:text-slate-300">{t('diagnosis.mock.suggestion')}</p>

                                        <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-md">
                                            <span className="text-yellow-800 dark:text-yellow-500 font-medium text-xs">{t('diagnosis.response.disclaimer')}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Complementary Data Modal */}
            <Dialog open={isComplementaryModalOpen} onOpenChange={setIsComplementaryModalOpen}>
                <DialogContent className="max-w-[700px] w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 dark:border-slate-800 p-0 gap-0">
                    <DialogHeader className="p-6 border-b dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
                        <DialogTitle className="text-xl font-bold dark:text-slate-50">{t('diagnosis.modal.title')}</DialogTitle>
                        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </DialogClose>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        {/* 1. Antropométricos */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[#0066CC] dark:text-slate-300 uppercase tracking-wide">{t('diagnosis.modal.sections.anthropometric')}</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">{t('diagnosis.modal.fields.height')}</Label>
                                    <Input placeholder="Ex: 1.75" className="dark:bg-slate-800" value={height} onChange={e => setHeight(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{t('diagnosis.modal.fields.weight')}</Label>
                                    <Input placeholder="Ex: 70.5" className="dark:bg-slate-800" value={weight} onChange={e => setWeight(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{t('diagnosis.modal.fields.imc')}</Label>
                                    <Input placeholder={t('diagnosis.modal.fields.calculated')} className="dark:bg-slate-800 bg-slate-50" readOnly value={imc} />
                                </div>
                            </div>
                        </div>

                        {/* 2. Demográficos */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[#0066CC] dark:text-slate-300 uppercase tracking-wide">{t('diagnosis.modal.sections.demographic')}</h3>
                            <div className="space-y-1">
                                <Label className="text-xs">{t('diagnosis.modal.fields.sex')}</Label>
                                <Select value={gender} onValueChange={setGender}>
                                    <SelectTrigger className="dark:bg-slate-800">
                                        <SelectValue placeholder={t('diagnosis.modal.fields.sex_placeholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="m">{t('diagnosis.modal.fields.male')}</SelectItem>
                                        <SelectItem value="f">{t('diagnosis.modal.fields.female')}</SelectItem>
                                        <SelectItem value="o">{t('diagnosis.modal.fields.other')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 3. Sinais Vitais */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[#0066CC] dark:text-slate-300 uppercase tracking-wide">{t('diagnosis.modal.sections.vitals')}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">{t('diagnosis.modal.fields.pressure')}</Label>
                                    <Input placeholder="Ex: 120x80 mmHg" className="dark:bg-slate-800" value={pressure} onChange={e => setPressure(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{t('diagnosis.modal.fields.heart_rate')}</Label>
                                    <Input placeholder="Ex: 72" className="dark:bg-slate-800" value={heartRate} onChange={e => setHeartRate(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{t('diagnosis.modal.fields.temp')}</Label>
                                    <Input placeholder="Ex: 36.5" className="dark:bg-slate-800" value={temp} onChange={e => setTemp(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{t('diagnosis.modal.fields.sat_o2')}</Label>
                                    <Input placeholder="Ex: 98" className="dark:bg-slate-800" value={satO2} onChange={e => setSatO2(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* 4. Histórico Médico */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-[#0066CC] dark:text-slate-300 uppercase tracking-wide">{t('diagnosis.modal.sections.medical_history')}</h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">{t('diagnosis.modal.fields.meds')}</Label>
                                    <Textarea placeholder={t('diagnosis.modal.fields.meds_placeholder')} className="dark:bg-slate-800 resize-none" rows={2} value={meds} onChange={e => setMeds(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{t('diagnosis.modal.fields.allergies')}</Label>
                                    <Textarea placeholder={t('diagnosis.modal.fields.allergies_placeholder')} className="dark:bg-slate-800 resize-none" rows={2} value={allergies} onChange={e => setAllergies(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{t('diagnosis.modal.fields.notes')}</Label>
                                    <Textarea placeholder={t('diagnosis.modal.fields.notes_placeholder')} className="dark:bg-slate-800 resize-none" rows={2} value={obs} onChange={e => setObs(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <Button variant="ghost" onClick={() => setIsComplementaryModalOpen(false)} className="dark:text-slate-400 hover:bg-transparent hover:text-slate-600">{t('diagnosis.modal.cancel')}</Button>
                        <Button className="bg-[#0066CC] hover:bg-[#0055AA] dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 w-32" onClick={handleConfirmComplementary}>
                            {t('diagnosis.modal.insert')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
