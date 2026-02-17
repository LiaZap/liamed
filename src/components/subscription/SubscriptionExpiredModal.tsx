import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, CreditCard } from 'lucide-react';

interface SubscriptionExpiredModalProps {
  isOpen: boolean;
}

export function SubscriptionExpiredModal({ isOpen }: SubscriptionExpiredModalProps) {
  const navigate = useNavigate();

  const handleRenew = () => {
    navigate('/planos');
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto bg-red-100 p-3 rounded-full mb-4">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl">Assinatura Expirada</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Seu período de acesso ao plano terminou. Para continuar utilizando os recursos exclusivos da plataforma, por favor renove sua assinatura.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm text-center text-slate-600 dark:text-slate-400">
            Mantenha o acesso a:
            <ul className="mt-2 space-y-1 font-medium text-slate-800 dark:text-slate-200">
              <li>✓ Assistente IA LIAMED</li>
              <li>✓ Transcrições Ilimitadas</li>
              <li>✓ Protocolos Médicos</li>
            </ul>
          </div>
          
          <Button onClick={handleRenew} className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700">
            <CreditCard className="mr-2 h-4 w-4" />
            Ver Planos Disponíveis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
