import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, AlertTriangle } from "lucide-react";
import api from "@/services/api";
import { toast } from "sonner";

interface TermsModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export function TermsModal({ isOpen, onAccept }: TermsModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      toast.error("Você precisa aceitar os termos para continuar");
      return;
    }

    try {
      setIsLoading(true);
      await api.post("/users/accept-terms");
      toast.success("Termos aceitos com sucesso!");
      onAccept();
    } catch (error) {
      console.error("Error accepting terms:", error);
      toast.error("Erro ao aceitar termos. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Termos de Uso e Responsabilidade</DialogTitle>
              <DialogDescription>
                Por favor, leia atentamente antes de utilizar a plataforma
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-4 -mr-4">
          <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
            {/* Section 1 */}
            <section>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                1. Aceitação dos Termos
              </h3>
              <p>
                Ao acessar e utilizar a plataforma LIAMED, você concorda integralmente com estes 
                Termos de Uso e Responsabilidade. Caso não concorde com qualquer disposição, 
                não utilize os serviços oferecidos.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4" />
                2. Natureza do Serviço - Ferramenta de Apoio
              </h3>
              <p className="mb-2">
                A plataforma LIAMED é uma <strong>ferramenta de apoio à decisão clínica</strong> destinada 
                exclusivamente a profissionais de saúde devidamente habilitados. Os recursos disponibilizados, 
                incluindo mas não limitado a:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Calculadoras médicas</li>
                <li>Protocolos clínicos</li>
                <li>Análise de gasometria</li>
                <li>Apoio diagnóstico por Inteligência Artificial</li>
                <li>Transcrições de consultas</li>
              </ul>
              <p className="mt-2 font-medium text-amber-700 dark:text-amber-400">
                NÃO SUBSTITUEM o julgamento clínico, a avaliação presencial do paciente, 
                a anamnese completa, o exame físico ou qualquer outro procedimento médico padrão.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">
                3. Responsabilidade Profissional
              </h3>
              <p>
                O profissional de saúde é o <strong>único responsável</strong> pelas decisões clínicas 
                tomadas com base nas informações fornecidas pela plataforma. A LIAMED não assume 
                responsabilidade por diagnósticos, prescrições, tratamentos ou quaisquer condutas 
                médicas derivadas do uso de suas ferramentas.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">
                4. Limitações das Calculadoras e Protocolos
              </h3>
              <p>
                As fórmulas, scores e protocolos disponibilizados são baseados em literatura 
                científica reconhecida. No entanto, a medicina está em constante evolução. 
                O profissional deve sempre verificar a atualização das informações e considerar 
                as particularidades de cada paciente.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">
                5. Inteligência Artificial
              </h3>
              <p>
                Os recursos de IA disponíveis na plataforma são ferramentas auxiliares que podem 
                apresentar limitações, imprecisões ou erros. <strong>Toda sugestão gerada por IA 
                deve ser criticamente avaliada</strong> pelo profissional antes de qualquer aplicação clínica.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">
                6. Privacidade e Dados
              </h3>
              <p>
                O usuário é responsável por garantir que toda informação de pacientes inserida 
                na plataforma esteja em conformidade com a Lei Geral de Proteção de Dados (LGPD) 
                e demais regulamentações aplicáveis. A LIAMED implementa medidas de segurança, 
                mas o profissional deve assegurar o consentimento adequado de seus pacientes.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">
                7. Isenção de Responsabilidade
              </h3>
              <p>
                A LIAMED e seus desenvolvedores ficam isentos de qualquer responsabilidade por 
                danos diretos, indiretos, incidentais, consequenciais ou punitivos decorrentes 
                do uso ou impossibilidade de uso da plataforma, incluindo, mas não se limitando a, 
                erros de diagnóstico, tratamento inadequado ou qualquer prejuízo à saúde de pacientes.
              </p>
            </section>

            {/* Section 8 */}
            <section>
              <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">
                8. Atualizações dos Termos
              </h3>
              <p>
                A LIAMED reserva-se o direito de modificar estes termos a qualquer momento. 
                As alterações serão comunicadas através da plataforma e entrarão em vigor 
                imediatamente após sua publicação.
              </p>
            </section>
          </div>
        </ScrollArea>

        <div className="border-t pt-4 mt-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 mb-4">
            <Checkbox
              id="accept-terms"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
              className="mt-0.5"
            />
            <label htmlFor="accept-terms" className="text-sm cursor-pointer select-none">
              <span className="font-medium">Li, compreendi e aceito</span> os Termos de Uso e Responsabilidade. 
              Declaro ser profissional de saúde devidamente habilitado e assumo total responsabilidade 
              pelas decisões clínicas tomadas com base nas informações fornecidas por esta plataforma.
            </label>
          </div>

          <DialogFooter>
            <Button
              onClick={handleAccept}
              disabled={!accepted || isLoading}
              className="w-full"
            >
              {isLoading ? "Processando..." : "Aceitar e Continuar"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
