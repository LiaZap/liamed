import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Headphones, 
  Send, 
  MessageCircle, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  User,
  Shield,
  Filter,
  Search
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
           {/* Status statistics could go here */}
        </div>
      </div>

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
    </div>
  );
}
