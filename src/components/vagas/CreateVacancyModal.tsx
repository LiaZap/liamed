import { useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { MEDICAL_SPECIALTIES } from "@/constants/specialties";
import { Loader2, Upload, ImageIcon, X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { toast } from "sonner";

interface CreateVacancyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateVacancyModal({ isOpen, onClose, onSuccess }: CreateVacancyModalProps) {
    const [title, setTitle] = useState('');
    const [sector, setSector] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [openSpecialty, setOpenSpecialty] = useState(false);
    const [description, setDescription] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactWhatsapp, setContactWhatsapp] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Imagem muito grande", { description: "O tamanho máximo permitido é 5MB." });
                return;
            }
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim() || !sector.trim() || !description.trim()) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('sector', sector);
            if (specialty) formData.append('specialty', specialty);
            formData.append('description', description);
            if (contactEmail) formData.append('contactEmail', contactEmail);
            if (contactWhatsapp) formData.append('contactWhatsapp', contactWhatsapp);
            if (image) {
                formData.append('image', image);
            }

            await api.post('/vacancies', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success("Vaga publicada com sucesso!");
            
            // Reset form
            setTitle('');
            setSector('');
            setSpecialty('');
            setDescription('');
            setContactEmail('');
            setContactWhatsapp('');
            handleRemoveImage();
            
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating vacancy:', error);
            toast.error("Erro ao publicar vaga");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-xl">Nova Vaga / Comunicado</DialogTitle>
                        <DialogDescription>
                            Preencha os dados abaixo para divulgar a oportunidade aos médicos.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="after:content-['*'] after:ml-0.5 after:text-red-500">Título</Label>
                            <Input
                                id="title"
                                placeholder="Ex: Plantonista UTI Noturno"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="sector" className="after:content-['*'] after:ml-0.5 after:text-red-500">Setor / Local</Label>
                                <Input
                                    id="sector"
                                    placeholder="Ex: UTI Geral, CTI..."
                                    value={sector}
                                    onChange={(e) => setSector(e.target.value)}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Especialidade (Opcional)</Label>
                                <Popover open={openSpecialty} onOpenChange={setOpenSpecialty}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openSpecialty}
                                            className="w-full justify-between font-normal"
                                            disabled={isLoading}
                                        >
                                            {specialty
                                                ? specialty
                                                : "Selecione ou digite..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Buscar especialidade..." />
                                            <CommandList>
                                                <CommandEmpty>Nenhuma especialidade encontrada.</CommandEmpty>
                                                <CommandGroup>
                                                    {MEDICAL_SPECIALTIES.map((spec) => (
                                                        <CommandItem
                                                            key={spec}
                                                            value={spec}
                                                            onSelect={(currentValue: string) => {
                                                                // CommandItem value is always lowercase, so we find the original case
                                                                const originalSpec = MEDICAL_SPECIALTIES.find(s => s.toLowerCase() === currentValue) || currentValue;
                                                                setSpecialty(originalSpec === specialty ? "" : originalSpec);
                                                                setOpenSpecialty(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    specialty === spec ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {spec}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description" className="after:content-['*'] after:ml-0.5 after:text-red-500">Descrição e Requisitos</Label>
                            <Textarea
                                id="description"
                                placeholder="Detalhes sobre a vaga, pré-requisitos, horários, etc..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isLoading}
                                className="min-h-[100px]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="contactWhatsapp">WhatsApp de Contato (Opcional)</Label>
                                <Input
                                    id="contactWhatsapp"
                                    placeholder="Ex: (11) 99999-9999"
                                    value={contactWhatsapp}
                                    onChange={(e) => setContactWhatsapp(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contactEmail">Email de Contato (Opcional)</Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    placeholder="Ex: rh@clinica.com"
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="grid gap-2 pt-2">
                            <Label>Imagem (Opcional)</Label>
                            <div className="flex flex-col items-center justify-center gap-4">
                                {!imagePreview ? (
                                    <div 
                                        className="w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-300 dark:border-slate-700"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                                            <ImageIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Clique para fazer upload
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            PNG, JPG até 5MB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="w-full h-40 object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md"
                                            onClick={handleRemoveImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/jpeg, image/png, image/webp"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} className="gap-2">
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="h-4 w-4" />
                            )}
                            Publicar Vaga
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
