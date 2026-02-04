import { useState, useEffect } from "react";
import api from "@/services/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Menu } from "lucide-react";
import { SelectPromptModal } from "./SelectPromptModal";
import { useAuth } from "@/contexts/AuthContext";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  onSave?: (userData: any) => void;
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  onSave,
}: EditUserModalProps) {
  const { user: currentUser } = useAuth();
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptText, setPromptText] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("MEDICO");
  const [isActive, setIsActive] = useState(true);
  const [endpointId, setEndpointId] = useState("none");
  const [specialty, setSpecialty] = useState("");
  const [plan, setPlan] = useState("essential");
  const [planStatus, setPlanStatus] = useState("ACTIVE");
  
  const [endpoints, setEndpoints] = useState<any[]>([]);

  useEffect(() => {
    const fetchEndpoints = async () => {
      try {
        const response = await api.get("/endpoints");
        setEndpoints(response.data);
      } catch (error) {
        console.error("Failed to fetch endpoints", error);
      }
    };
    fetchEndpoints();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setName(user.name);
        setEmail(user.email);
        setRole(user.role || "MEDICO");
        setIsActive(user.status === "ATIVO");
        setPromptText(user.customPrompt || "");
        setEndpointId(user.endpointId || "none");
        setSpecialty(user.specialty || "");
        setPlan(user.plan || "essential");
        setPlanStatus(user.planStatus || "ACTIVE");
        setPassword(""); // Limpar senha ao editar para evitar envio acidental de dados antigos
      } else {
        // New User defaults
        setName("");
        setEmail("");
        setPassword("");
        setRole("MEDICO");
        setIsActive(true);
        setEndpointId("none");
        setSpecialty("");
        setPlan("essential");
        setPlanStatus("ACTIVE");
        setPromptText(
          `# Prompt para Geração de Evolução Médica no Formato SOAP...`,
        );
      }
    }
  }, [isOpen, user]);

  const handlePromptSelect = (content: string) => {
    setPromptText(content);
    setIsPromptModalOpen(false);
  };

  const handleSave = () => {
    if (!user && !password) {
      toast.error("A senha é obrigatória para novos usuários.");
      return;
    }

    if (onSave) {
      // @ts-ignore
      onSave({
        name,
        email,
        password,
        role,
        specialty: role === "MEDICO" ? specialty : null,
        status: isActive ? "ATIVO" : "INATIVO",
        customPrompt: promptText,
        endpointId: endpointId === "none" ? null : endpointId,
        plan,
        planStatus
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[700px] w-full p-0 gap-0 bg-white">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-xl font-bold">
              {user ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Name */}
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@medipro.com"
              />
            </div>

            {/* Password - Agora visível sempre, mas opcional para edição */}
            <div className="space-y-2">
              <Label>
                Senha{" "}
                {user && (
                  <span className="text-xs font-normal text-muted-foreground">
                    (Deixe em branco para manter a atual)
                  </span>
                )}
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  user ? "Nova senha (opcional)" : "Senha inicial obrigatória"
                }
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

            {/* Plan Management - Only for Admins editing others */}
            {currentUser?.role === 'ADMIN' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                    <div className="space-y-2">
                        <Label>Plano de Assinatura</Label>
                        <Select value={plan} onValueChange={setPlan}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o plano" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="essential">Essential (Gratuito/Básico)</SelectItem>
                                <SelectItem value="pro">Pro (Otimização Clínica)</SelectItem>
                                <SelectItem value="premium">Premium (Completo + Carreira)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>Status da Assinatura</Label>
                        <Select value={planStatus} onValueChange={setPlanStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">Ativo</SelectItem>
                                <SelectItem value="TRIALING">Em Período de Teste</SelectItem>
                                <SelectItem value="PAST_DUE">Pagamento Pendente</SelectItem>
                                <SelectItem value="CANCELED">Cancelado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Specialty - Only for MEDICO */}
            {role === "MEDICO" && (
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma especialidade..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="Acupuntura">Acupuntura</SelectItem>
                    <SelectItem value="Alergia e Imunologia">
                      Alergia e Imunologia
                    </SelectItem>
                    <SelectItem value="Anestesiologia">
                      Anestesiologia
                    </SelectItem>
                    <SelectItem value="Angiologia">Angiologia</SelectItem>
                    <SelectItem value="Cardiologia">Cardiologia</SelectItem>
                    <SelectItem value="Cirurgia Cardiovascular">
                      Cirurgia Cardiovascular
                    </SelectItem>
                    <SelectItem value="Cirurgia da Mão">
                      Cirurgia da Mão
                    </SelectItem>
                    <SelectItem value="Cirurgia de Cabeça e Pescoço">
                      Cirurgia de Cabeça e Pescoço
                    </SelectItem>
                    <SelectItem value="Cirurgia do Aparelho Digestivo">
                      Cirurgia do Aparelho Digestivo
                    </SelectItem>
                    <SelectItem value="Cirurgia Geral">
                      Cirurgia Geral
                    </SelectItem>
                    <SelectItem value="Cirurgia Oncológica">
                      Cirurgia Oncológica
                    </SelectItem>
                    <SelectItem value="Cirurgia Pediátrica">
                      Cirurgia Pediátrica
                    </SelectItem>
                    <SelectItem value="Cirurgia Plástica">
                      Cirurgia Plástica
                    </SelectItem>
                    <SelectItem value="Cirurgia Torácica">
                      Cirurgia Torácica
                    </SelectItem>
                    <SelectItem value="Cirurgia Vascular">
                      Cirurgia Vascular
                    </SelectItem>
                    <SelectItem value="Clínica Médica">
                      Clínica Médica
                    </SelectItem>
                    <SelectItem value="Coloproctologia">
                      Coloproctologia
                    </SelectItem>
                    <SelectItem value="Dermatologia">Dermatologia</SelectItem>
                    <SelectItem value="Endocrinologia e Metabologia">
                      Endocrinologia e Metabologia
                    </SelectItem>
                    <SelectItem value="Endoscopia">Endoscopia</SelectItem>
                    <SelectItem value="Gastroenterologia">
                      Gastroenterologia
                    </SelectItem>
                    <SelectItem value="Genética Médica">
                      Genética Médica
                    </SelectItem>
                    <SelectItem value="Geriatria">Geriatria</SelectItem>
                    <SelectItem value="Ginecologia e Obstetrícia">
                      Ginecologia e Obstetrícia
                    </SelectItem>
                    <SelectItem value="Hematologia e Hemoterapia">
                      Hematologia e Hemoterapia
                    </SelectItem>
                    <SelectItem value="Homeopatia">Homeopatia</SelectItem>
                    <SelectItem value="Infectologia">Infectologia</SelectItem>
                    <SelectItem value="Mastologia">Mastologia</SelectItem>
                    <SelectItem value="Medicina de Emergência">
                      Medicina de Emergência
                    </SelectItem>
                    <SelectItem value="Medicina de Família e Comunidade">
                      Medicina de Família e Comunidade
                    </SelectItem>
                    <SelectItem value="Medicina do Trabalho">
                      Medicina do Trabalho
                    </SelectItem>
                    <SelectItem value="Medicina do Tráfego">
                      Medicina do Tráfego
                    </SelectItem>
                    <SelectItem value="Medicina Esportiva">
                      Medicina Esportiva
                    </SelectItem>
                    <SelectItem value="Medicina Física e Reabilitação">
                      Medicina Física e Reabilitação
                    </SelectItem>
                    <SelectItem value="Medicina Intensiva">
                      Medicina Intensiva
                    </SelectItem>
                    <SelectItem value="Medicina Legal e Perícia Médica">
                      Medicina Legal e Perícia Médica
                    </SelectItem>
                    <SelectItem value="Medicina Nuclear">
                      Medicina Nuclear
                    </SelectItem>
                    <SelectItem value="Medicina Preventiva e Social">
                      Medicina Preventiva e Social
                    </SelectItem>
                    <SelectItem value="Nefrologia">Nefrologia</SelectItem>
                    <SelectItem value="Neurocirurgia">Neurocirurgia</SelectItem>
                    <SelectItem value="Neurologia">Neurologia</SelectItem>
                    <SelectItem value="Nutrologia">Nutrologia</SelectItem>
                    <SelectItem value="Oftalmologia">Oftalmologia</SelectItem>
                    <SelectItem value="Oncologia Clínica">
                      Oncologia Clínica
                    </SelectItem>
                    <SelectItem value="Ortopedia e Traumatologia">
                      Ortopedia e Traumatologia
                    </SelectItem>
                    <SelectItem value="Otorrinolaringologia">
                      Otorrinolaringologia
                    </SelectItem>
                    <SelectItem value="Patologia">Patologia</SelectItem>
                    <SelectItem value="Patologia Clínica/Medicina Laboratorial">
                      Patologia Clínica/Medicina Laboratorial
                    </SelectItem>
                    <SelectItem value="Pediatria">Pediatria</SelectItem>
                    <SelectItem value="Pneumologia">Pneumologia</SelectItem>
                    <SelectItem value="Psiquiatria">Psiquiatria</SelectItem>
                    <SelectItem value="Radiologia e Diagnóstico por Imagem">
                      Radiologia e Diagnóstico por Imagem
                    </SelectItem>
                    <SelectItem value="Radioterapia">Radioterapia</SelectItem>
                    <SelectItem value="Reumatologia">Reumatologia</SelectItem>
                    <SelectItem value="Urologia">Urologia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Endpoint Selection */}
            <div className="space-y-2">
              <Label>Endpoint de IA (Opcional)</Label>
              <Select value={endpointId} onValueChange={setEndpointId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um endpoint..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Padrão do Sistema (System Key)
                  </SelectItem>
                  {endpoints.map((ep) => (
                    <SelectItem key={ep.id} value={ep.id}>
                      {ep.name} ({ep.model || "OpenAI"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Define qual API de IA este usuário utilizará.
              </p>
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
                <p className="text-xs text-muted-foreground">
                  Desative para bloquear o acesso deste usuário.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <DialogFooter className="p-6 border-t sm:justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="bg-[#0066CC] hover:bg-[#0055AA]"
              onClick={handleSave}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SelectPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onSelect={handlePromptSelect}
      />
    </>
  );
}
