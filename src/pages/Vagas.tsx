import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Briefcase, Bell, Mail, MessageCircle, Save, Loader2, Plus, Building2, Calendar, Filter, Trash2 } from "lucide-react"
import { PlanGate } from "@/components/PlanGate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import api from "@/services/api"
import { CreateVacancyModal } from "@/components/vagas/CreateVacancyModal"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Vacancy {
    id: string;
    title: string;
    description: string;
    sector: string;
    specialty?: string;
    imageUrl?: string;
    contactEmail?: string;
    contactWhatsapp?: string;
    createdAt: string;
    creatorId: string;
    clinic?: {
        name: string;
        logo: string;
    };
}

export default function Vagas() {
    const { user } = useAuth()
    
    // Notification preferences state
    const [notifyWhatsApp, setNotifyWhatsApp] = useState(false)
    const [notifyEmail, setNotifyEmail] = useState(false)
    const [whatsappNumber, setWhatsappNumber] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    
    // Vacancies state
    const [isLoading, setIsLoading] = useState(true)
    const [vacancies, setVacancies] = useState<Vacancy[]>([])
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Filter state
    const [selectedSector, setSelectedSector] = useState<string>("todos")
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>("todos")

    const canCreateVacancy = user?.role === 'ADMIN' || user?.role === 'GESTOR';

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [profileRes, vacanciesRes] = await Promise.all([
                api.get('/users/profile'),
                api.get('/vacancies')
            ]);
            
            const userData = profileRes.data;
            setNotifyWhatsApp(userData.notifyVagasWhatsApp || false);
            setNotifyEmail(userData.notifyVagasEmail || false);
            setWhatsappNumber(userData.phone || "");
            
            // Set initial specialty filter if user is doctor and has a specialty
            if (user?.role === 'MEDICO' && userData.specialty) {
                setSelectedSpecialty(userData.specialty);
            }

            setVacancies(vacanciesRes.data);
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error("Erro ao carregar dados", { id: "vagas-error" });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSavePreferences = async () => {
        setIsSaving(true)
        try {
            await api.put('/users/profile', {
                notifyVagasWhatsApp: notifyWhatsApp,
                notifyVagasEmail: notifyEmail,
                phone: whatsappNumber
            })
            toast.success("Preferências salvas!", {
                description: "Você receberá notificações de vagas conforme configurado."
            })
        } catch (error) {
            console.error("Failed to save preferences", error)
            toast.error("Erro ao salvar preferências")
        } finally {
            setIsSaving(false)
        }
    }

    // Extracted Unique Sectors for Filter
    const uniqueSectors = useMemo(() => {
        const sectors = vacancies.map(v => v.sector).filter(Boolean);
        return Array.from(new Set(sectors)).sort();
    }, [vacancies]);

    // Extracted Unique Specialties for Filter
    const uniqueSpecialties = useMemo(() => {
        const specialties = vacancies.map(v => v.specialty).filter(Boolean);
        // Include the user's specialty in the dropdown if it's not there yet
        if (user?.role === 'MEDICO' && user?.specialty && !specialties.includes(user.specialty)) {
            specialties.push(user.specialty);
        }
        return Array.from(new Set(specialties as string[])).sort();
    }, [vacancies, user]);

    // Filtered Vacancies
    const filteredVacancies = useMemo(() => {
        let result = vacancies;
        if (selectedSector !== "todos") {
            result = result.filter(v => v.sector === selectedSector);
        }
        if (selectedSpecialty !== "todos") {
            result = result.filter(v => v.specialty === selectedSpecialty);
        }
        return result;
    }, [vacancies, selectedSector, selectedSpecialty]);

    const handleInterestClick = (vacancy: Vacancy) => {
        if (vacancy.contactWhatsapp) {
            // Clean number for wa.me
            const cleanNumber = vacancy.contactWhatsapp.replace(/\D/g, '');
            const url = `https://wa.me/55${cleanNumber}?text=Olá,%20tenho%20interesse%20na%20vaga%20${encodeURIComponent(vacancy.title)}%20anunciada%20na%20LIAMED.`;
            window.open(url, '_blank');
            return;
        }

        if (vacancy.contactEmail) {
            const subject = `Interesse na Vaga: ${vacancy.title}`;
            const body = `Olá,\n\nTenho interesse na vaga "${vacancy.title}" anunciada na plataforma LIAMED.\n\nAguardo retorno.\n\nAtt,\nDr(a). ${user?.name || ''}`;
            const url = `mailto:${vacancy.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(url, '_blank');
            return;
        }

        toast.info("Esta vaga não possui contato direto cadastrado. Em breve teremos mais opções.");
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Tem certeza que deseja excluir esta vaga?")) return;
        
        try {
            await api.delete(`/vacancies/${id}`);
            toast.success("Vaga excluída com sucesso");
            loadData();
        } catch (error) {
            console.error("Error deleting vacancy:", error);
            toast.error("Erro ao excluir vaga");
        }
    };

    return (
        <PlanGate requiredPlan="PREMIUM" featureName="Mural de Vagas Médicas">
        <div className="flex flex-col min-h-[70vh] px-2 md:px-6 pb-12">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                            Mural de Vagas
                        </h1>
                        <p className="text-muted-foreground">
                            Encontre e publique oportunidades na área médica
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {uniqueSpecialties.length > 0 && !isLoading && (
                        <div className="flex items-center gap-2">
                            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                                <SelectTrigger className="w-full sm:w-[200px] h-10">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-slate-500" />
                                        <SelectValue placeholder="Especialidade" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Qualquer Especialidade</SelectItem>
                                    {uniqueSpecialties.map(spec => (
                                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    {uniqueSectors.length > 0 && !isLoading && (
                        <div className="flex items-center gap-2">
                            <Select value={selectedSector} onValueChange={setSelectedSector}>
                                <SelectTrigger className="w-full sm:w-[200px] h-10">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-slate-500" />
                                        <SelectValue placeholder="Setor" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Qualquer setor</SelectItem>
                                    {uniqueSectors.map(sector => (
                                        <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    {canCreateVacancy && (
                        <Button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 h-10"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Vaga
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* Main Content - Vacancies List */}
                <div className="xl:col-span-3 space-y-6">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <Card key={i} className="animate-pulse dark:bg-[#222428] dark:border-slate-800">
                                    <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-t-xl" />
                                    <CardContent className="p-4 space-y-3">
                                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : filteredVacancies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <Briefcase className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                                {selectedSector !== "todos" || selectedSpecialty !== "todos" ? `Nenhuma vaga atende aos filtros atuais.` : "Nenhuma vaga encontrada"}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-2">
                                {selectedSector !== "todos" || selectedSpecialty !== "todos" 
                                    ? "Tente alterar ou limpar os filtros para ver outras oportunidades." 
                                    : "No momento não há comunicados de vagas ativos no mural. Volte mais tarde!"}
                            </p>
                            {canCreateVacancy && selectedSector === "todos" && selectedSpecialty === "todos" && (
                                <Button 
                                    className="mt-6" 
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Ser o primeiro a publicar
                                </Button>
                            )}
                            {(selectedSector !== "todos" || selectedSpecialty !== "todos") && (
                                <Button 
                                    className="mt-6" 
                                    variant="outline"
                                    onClick={() => { setSelectedSector("todos"); setSelectedSpecialty("todos"); }}
                                >
                                    Limpar filtros
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            {filteredVacancies.map(vacancy => (
                                <Card key={vacancy.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 dark:bg-[#222428] dark:border-slate-800 flex flex-col group">
                                    {/* Image Header */}
                                    <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                        {vacancy.imageUrl ? (
                                            <img 
                                                src={`${import.meta.env.VITE_API_URL}${vacancy.imageUrl}`} 
                                                alt={vacancy.title} 
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                onError={(e) => {
                                                    // Fallback if image fails to load
                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50">
                                                <Briefcase className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                                            </div>
                                        )}
                                        {/* Sector/Specialty Badge Over Image */}
                                        <div className="absolute top-4 left-4 items-center flex gap-2">
                                            <span className="px-3 py-1 text-xs font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-full shadow-sm backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50">
                                                {vacancy.sector}
                                            </span>
                                            {vacancy.specialty && (
                                                <span className="px-3 py-1 text-xs font-semibold bg-blue-100/90 dark:bg-blue-900/90 text-blue-800 dark:text-blue-200 rounded-full shadow-sm backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50">
                                                    {vacancy.specialty}
                                                </span>
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        {(user?.role === 'ADMIN' || user?.id === vacancy.creatorId) && (
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-4 right-4 h-8 w-8 rounded-full shadow-md bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => handleDelete(e, vacancy.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-white" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <CardContent className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-3.5 w-3.5" />
                                                <span>{vacancy.clinic?.name || 'Vaga Independente'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{formatDistanceToNow(new Date(vacancy.createdAt), { addSuffix: true, locale: ptBR })}</span>
                                            </div>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3 line-clamp-2">
                                            {vacancy.title}
                                        </h3>
                                        
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 flex-1 whitespace-pre-line">
                                            {vacancy.description}
                                        </p>
                                    </CardContent>

                                    {/* Footer */}
                                    <CardFooter className="p-6 pt-0 mt-auto border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20">
                                        <Button 
                                            className="w-full gap-2 bg-[#0066CC] hover:bg-[#0052a3] text-white"
                                            onClick={() => handleInterestClick(vacancy)}
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            Tenho Interesse
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar - Notifications */}
                <div className="xl:col-span-1">
                    <Card className="sticky top-6 dark:bg-[#222428] dark:border-slate-800">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg dark:text-slate-50">
                                <Bell className="h-5 w-5 text-primary" />
                                Alertas de Vagas
                            </CardTitle>
                            <CardDescription>
                                Receba novas oportunidades no seu celular
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isLoading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <>
                                    {/* Email Toggle */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="text-left">
                                                <Label htmlFor="notify-email" className="font-medium dark:text-slate-200">
                                                    Email
                                                </Label>
                                            </div>
                                        </div>
                                        <Switch
                                            id="notify-email"
                                            checked={notifyEmail}
                                            onCheckedChange={setNotifyEmail}
                                        />
                                    </div>

                                    {/* WhatsApp Toggle */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                    <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div className="text-left">
                                                    <Label htmlFor="notify-whatsapp" className="font-medium dark:text-slate-200">
                                                        WhatsApp
                                                    </Label>
                                                </div>
                                            </div>
                                            <Switch
                                                id="notify-whatsapp"
                                                checked={notifyWhatsApp}
                                                onCheckedChange={setNotifyWhatsApp}
                                            />
                                        </div>
                                        
                                        {/* WhatsApp Number Input */}
                                        {notifyWhatsApp && (
                                            <div className="pl-13 animate-in slide-in-from-top-2 fade-in duration-300">
                                                <Input
                                                    placeholder="(11) 99999-9999"
                                                    value={whatsappNumber}
                                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                                    className="dark:bg-[#1a1c1e] dark:border-slate-700 h-9 text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Save Button */}
                                    <Button 
                                        className="w-full gap-2 mt-2"
                                        size="sm"
                                        onClick={handleSavePreferences}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        Salvar
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>

        {/* Modal for Creating Vacancies */}
        <CreateVacancyModal 
            isOpen={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)} 
            onSuccess={loadData}
        />

        </PlanGate>
    )
}

