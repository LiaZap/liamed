import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus, 
  Clock, 
  CheckCircle2,
  ArrowLeft,
  User,
  Shield
} from "lucide-react";
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
  user: { id: string; name: string; email: string };
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

import SupportAdmin from "./admin/SupportAdmin";

export default function Support() {
  const { user } = useAuth();

  if (user?.role === "ADMIN") {
    return <SupportAdmin />;
  }
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetails | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  // Polling for real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedTicket) {
      interval = setInterval(() => {
        loadTicketDetails(selectedTicket.id, true);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedTicket?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadTickets = async (silent = false) => {
    try {
      const response = await api.get("/support/tickets");
      setTickets(response.data);
    } catch (error) {
      if (!silent) toast.error("Erro ao carregar tickets");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId: string, silent = false) => {
    try {
      const response = await api.get(`/support/tickets/${ticketId}`);
      // Only scroll if new message count is different or first load (handled by useEffect deps)
      // But we simply update state here.
      setSelectedTicket(response.data);
      // Refresh ticket list to update unread count silently
      loadTickets(true);
    } catch (error) {
      if (!silent) toast.error("Erro ao carregar mensagens");
    }
  };

  const createTicket = async () => {
    if (!newTicketMessage.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    if (!newTicketSubject) {
      toast.error("Selecione um assunto");
      return;
    }

    setSending(true);
    try {
      const response = await api.post("/support/tickets", {
        subject: newTicketSubject,
        message: newTicketMessage
      });
      
      toast.success("Ticket criado com sucesso!");
      setNewTicketSubject("");
      setNewTicketMessage("");
      setShowNewTicket(false);
      loadTickets();
      loadTicketDetails(response.data.id);
    } catch (error) {
      toast.error("Erro ao criar ticket");
    } finally {
      setSending(false);
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
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Only send message on Enter if not in new ticket form (textarea usually allows newlines)
      // or if it's the message input in chat
      if (!showNewTicket) {
        sendMessage();
      }
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const formatRelativeDate = (date: string) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffMs = now.getTime() - msgDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return format(msgDate, "dd/MM", { locale: ptBR });
  };

  const renderTicketList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Meus Tickets</h2>
        <Button onClick={() => setShowNewTicket(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Headphones className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Nenhum ticket ainda</h3>
            <p className="text-muted-foreground mb-4">
              Precisa de ajuda? Abra um ticket e nossa equipe responderá em breve.
            </p>
            <Button onClick={() => setShowNewTicket(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Abrir Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => loadTicketDetails(ticket.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{ticket.subject}</span>
                      {ticket.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {ticket.unreadCount} nova{ticket.unreadCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    {ticket.messages[0] && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {ticket.messages[0].isFromAdmin && "Suporte: "}
                        {ticket.messages[0].content}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={statusColors[ticket.status]}>
                      {statusLabels[ticket.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(ticket.updatedAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderNewTicketForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowNewTicket(false)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Novo Ticket</h2>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Assunto</label>
            <Select value={newTicketSubject} onValueChange={setNewTicketSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um assunto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dúvida Técnica">Dúvida Técnica</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Sugestão">Sugestão</SelectItem>
                <SelectItem value="Reportar Erro">Reportar Erro</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Mensagem</label>
            <textarea
              className="w-full min-h-[120px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Descreva sua dúvida ou problema..."
              value={newTicketMessage}
              onChange={(e) => setNewTicketMessage(e.target.value)}
              // Removed onKeyDown to allow new lines freely in textarea
            />
          </div>
          <Button 
            className="w-full" 
            onClick={createTicket}
            disabled={!newTicketMessage.trim() || !newTicketSubject || sending}
          >
            {sending ? "Enviando..." : "Enviar Ticket"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderChatView = () => (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center gap-2 pb-4 border-b">
        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold">{selectedTicket?.subject}</h2>
          <Badge className={statusColors[selectedTicket?.status || "OPEN"]}>
            {statusLabels[selectedTicket?.status || "OPEN"]}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {selectedTicket?.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isFromAdmin ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.isFromAdmin
                  ? "bg-muted"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.isFromAdmin ? (
                  <Shield className="h-3 w-3" />
                ) : (
                  <User className="h-3 w-3" />
                )}
                <span className="text-xs font-medium">
                  {message.isFromAdmin ? "Suporte LIAMED" : "Você"}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className={`text-xs mt-1 block ${
                message.isFromAdmin ? "text-muted-foreground" : "text-primary-foreground/70"
              }`}>
                {formatDate(message.createdAt)}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {selectedTicket?.status !== "CLOSED" && (
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={sending}
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim() || sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {selectedTicket?.status === "CLOSED" && (
        <div className="pt-4 text-center text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 mx-auto mb-2" />
          Este ticket foi encerrado
        </div>
      )}
    </div>
  );

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            Suporte LIAMED
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : selectedTicket ? (
            renderChatView()
          ) : showNewTicket ? (
            renderNewTicketForm()
          ) : (
            renderTicketList()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
