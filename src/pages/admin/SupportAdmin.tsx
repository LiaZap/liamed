import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Headphones, 
  Send, 
  MessageCircle, 
  Clock, 
  CheckCircle2,
  Search,
  X
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getImageUrl } from "@/utils/url";

interface Ticket {
  id: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  user: { id: string; name: string; email: string };
  messages: { content: string; createdAt: string; isFromAdmin: boolean }[];
}

interface Message {
  id: string;
  content: string;
  isFromAdmin: boolean;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

interface TicketDetails {
  id: string;
  subject: string;
  status: string;
  user: { id: string; name: string; email: string; specialty?: string };
  messages: Message[];
}

const statusColors: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800"
};

const statusLabels: Record<string, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em Andamento",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado"
};

export default function SupportAdmin() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetails | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Broadcast State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastImageUrl, setBroadcastImageUrl] = useState(""); // New state
  const [broadcastLink, setBroadcastLink] = useState(""); // Link state
  const [targetRole, setTargetRole] = useState("TODOS");
  const [targetSpecialty, setTargetSpecialty] = useState("TODAS");

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
          const response = await api.post('/upload', formData, {
              headers: {
                  'Content-Type': 'multipart/form-data'
              }
          });
          setBroadcastImageUrl(response.data.url);
          toast.success("Imagem carregada com sucesso!");
      } catch (error) {
          console.error('Upload failed:', error);
          toast.error("Erro ao fazer upload da imagem.");
      }
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error("Preencha título e mensagem");
      return;
    }

    setSending(true);
    try {
      await api.post('/notifications/broadcast', {
        title: broadcastTitle,
        message: broadcastMessage,
        imageUrl: broadcastImageUrl || undefined, // Send image URL
        role: targetRole === "TODOS" ? undefined : targetRole,
        specialty: targetSpecialty === "TODAS" ? undefined : targetSpecialty,
        type: "INFO",
        link: broadcastLink || undefined // Send link
      });

      toast.success("Comunicado enviado com sucesso!");
      setShowBroadcastModal(false);
      setBroadcastTitle("");
      setBroadcastMessage("");
      setBroadcastImageUrl("");
      setBroadcastLink("");
      setTargetRole("TODOS");
      setTargetSpecialty("TODAS");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar comunicado");
    } finally {
      setSending(false);
    }
  };

  // Auto-refresh tickets
  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [statusFilter]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadTickets = async () => {
    try {
      const params: any = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      
      const response = await api.get("/support/tickets", { params });
      setTickets(response.data);
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId: string) => {
    try {
      const response = await api.get(`/support/tickets/${ticketId}`);
      setSelectedTicket(response.data);
      // Update read status in list
      setTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, unreadCount: 0 } : t
      ));
    } catch (error) {
      toast.error("Erro ao carregar conversa");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    setSending(true);
    try {
      await api.post(`/support/tickets/${selectedTicket.id}/messages`, {
        content: newMessage
      });
      
      setNewMessage("");
      loadTicketDetails(selectedTicket.id);
      
      // Update ticket status in list if it was OPEN
      if (selectedTicket.status === "OPEN") {
        setSelectedTicket(prev => prev ? { ...prev, status: "IN_PROGRESS" } : null);
      }
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!selectedTicket) return;

    try {
      await api.patch(`/support/tickets/${selectedTicket.id}`, { status: newStatus });
      setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
      loadTickets();
      toast.success(`Status atualizado para ${statusLabels[newStatus]}`);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM 'às' HH:mm", { locale: ptBR });
  };

  if (user?.role !== "ADMIN" && user?.role !== "GESTOR") {
    return <div className="p-8 text-center">Acesso negado.</div>;
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Headphones className="h-6 w-6 text-primary" />
          Central de Suporte
        </h1>
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowBroadcastModal(true)}>
            <Send className="h-4 w-4 mr-2" />
            Enviar Comunicado
          </Button>
        </div>
      </div>

      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Enviar Comunicado</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowBroadcastModal(false)}>✕</Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input 
                  value={broadcastTitle} 
                  onChange={e => setBroadcastTitle(e.target.value)} 
                  placeholder="Ex: Atualização do Sistema"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 border rounded-md"
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder="Digite sua mensagem para todos..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destinatário</label>
                  <Select value={targetRole} onValueChange={setTargetRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos os Usuários</SelectItem>
                      <SelectItem value="MEDICO">Apenas Médicos</SelectItem>
                      <SelectItem value="GESTOR">Apenas Gestores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Especialidade (Opcional)</label>
                   <Select value={targetSpecialty} onValueChange={setTargetSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="TODAS">Todas</SelectItem>
                      {[
                        "Cardiologia", "Dermatologia", "Ginecologia", "Ortopedia", 
                        "Pediatria", "Psiquiatria", "Neurologia", "Clínica Geral"
                      ].map(spec => (
                        <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBroadcastModal(false)}>Cancelar</Button>
                <Button onClick={handleBroadcast} disabled={sending}>
                  {sending ? "Enviando..." : "Enviar para Todos"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-6 flex-1 h-full min-h-0">
        {/* Sidebar List */}
        <Card className="w-1/3 flex flex-col h-full">
          <div className="p-4 border-b space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar tickets..." className="pl-9" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
                <Badge
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'ALL' ? 'Todos' : statusLabels[status]}
                </Badge>
              ))}
            </div>
          </div>

          <CardContent className="flex-1 overflow-y-auto p-0">
            {loading ? (
              <div className="flex justify-center p-8">
                <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum ticket encontrado
              </div>
            ) : (
              <div className="divide-y">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => loadTicketDetails(ticket.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedTicket?.id === ticket.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold line-clamp-1">{ticket.user?.name}</span>
                      <Badge className={`${statusColors[ticket.status]} text-[10px] px-1 py-0`}>
                        {statusLabels[ticket.status]}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground/90 line-clamp-1">
                      {ticket.subject}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[70%]">
                        {ticket.messages[0]?.content}
                      </p>
                      {ticket.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                          {ticket.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col h-full">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {selectedTicket.user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedTicket.user.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedTicket.user.email} • {selectedTicket.user.specialty || "Sem especialidade"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedTicket.status}
                    onValueChange={updateStatus}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Aberto</SelectItem>
                      <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                      <SelectItem value="RESOLVED">Resolvido</SelectItem>
                      <SelectItem value="CLOSED">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/20">
                <div className="text-center my-4">
                  <span className="text-xs text-muted-foreground bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">
                    Ticket criado: {formatDate(selectedTicket.messages[0]?.createdAt)} • Assunto: {selectedTicket.subject}
                  </span>
                </div>

                {selectedTicket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isFromAdmin ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className={`flex flex-col max-w-[70%] ${message.isFromAdmin ? "items-end" : "items-start"}`}>
                      <div
                        className={`rounded-lg p-3 shadow-sm ${
                          message.isFromAdmin
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white dark:bg-slate-800 border rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {message.isFromAdmin ? "Você" : message.sender.name} • {format(new Date(message.createdAt), "HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t bg-background">
                {selectedTicket.status === "CLOSED" ? (
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Este ticket está encerrado e não aceita novas respostas.
                    <Button variant="link" size="sm" onClick={() => updateStatus("IN_PROGRESS")}>
                      Reabrir ticket
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua resposta..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium">Selecione um ticket</h3>
              <p>Escolha uma conversa na lista para ver os detalhes e responder.</p>
            </div>
          )}
        </Card>
      </div>

      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Enviar Comunicado</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowBroadcastModal(false)}>✕</Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input 
                  value={broadcastTitle} 
                  onChange={e => setBroadcastTitle(e.target.value)} 
                  placeholder="Ex: Atualização do Sistema"
                />
              </div>

               <div className="space-y-2">
                <label className="text-sm font-medium">Imagem do Comunicado (Opcional)</label>
                <div className="flex gap-4 items-start">
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="cursor-pointer"
                    />
                    {broadcastImageUrl && (
                        <div className="relative h-20 w-32 border rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800">
                             <img 
                                src={getImageUrl(broadcastImageUrl)} 
                                alt="Preview" 
                                className="h-full w-full object-cover"
                             />
                             <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                                onClick={() => setBroadcastImageUrl("")}
                             >
                                <X className="h-3 w-3" />
                             </Button>
                        </div>
                    )}
                </div>
                {/* Fallback manual input if needed, or just keep it simple with upload only */}
                <Input 
                  value={broadcastImageUrl} 
                  onChange={e => setBroadcastImageUrl(e.target.value)} 
                  placeholder="Ou cole o URL da imagem aqui..."
                  className="mt-2 text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 border rounded-md"
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder="Digite sua mensagem para todos..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Link do Botão (Opcional)</label>
                <Input 
                  value={broadcastLink} 
                  onChange={e => setBroadcastLink(e.target.value)} 
                  placeholder="https://... ou /pagina-interna"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destinatário</label>
                  <Select value={targetRole} onValueChange={setTargetRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos os Usuários</SelectItem>
                      <SelectItem value="MEDICO">Apenas Médicos</SelectItem>
                      <SelectItem value="GESTOR">Apenas Gestores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Especialidade (Opcional)</label>
                   <Select value={targetSpecialty} onValueChange={setTargetSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      <SelectItem value="TODAS">Todas</SelectItem>
                      <SelectItem value="Cardiologia">Cardiologia</SelectItem>
                      <SelectItem value="Dermatologia">Dermatologia</SelectItem>
                      <SelectItem value="Ginecologia">Ginecologia</SelectItem>
                      <SelectItem value="Ortopedia">Ortopedia</SelectItem>
                      <SelectItem value="Pediatria">Pediatria</SelectItem>
                      <SelectItem value="Psiquiatria">Psiquiatria</SelectItem>
                      <SelectItem value="Neurologia">Neurologia</SelectItem>
                      <SelectItem value="Clínica Geral">Clínica Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBroadcastModal(false)}>Cancelar</Button>
                <Button onClick={handleBroadcast} disabled={sending}>
                  {sending ? "Enviando..." : "Enviar para Todos"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
