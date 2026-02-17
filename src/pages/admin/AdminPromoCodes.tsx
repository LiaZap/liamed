import { useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next'; // t unused
import api from '@/services/api'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
// import { format } from 'date-fns'; // format unused

export default function AdminPromoCodes() {
    // const { t } = useTranslation(); // t unused
    const [promos, setPromos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCode, setNewCode] = useState('');
    const [days, setDays] = useState('30');
    const [maxUses, setMaxUses] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchPromos();
    }, []);

    const fetchPromos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/promos');
            setPromos(response.data);
        } catch (error) {
            toast.error('Erro ao carregar códigos promocionais');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode || !days) return;

        try {
            setCreating(true);
            await api.post('/promos', {
                code: newCode.toUpperCase(),
                value: parseInt(days),
                type: 'TRIAL_EXTENSION',
                maxUses: maxUses ? parseInt(maxUses) : null
            });
            
            toast.success('Código criado com sucesso!');
            setNewCode('');
            setMaxUses('');
            fetchPromos();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao criar código');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este código?')) return;

        try {
            await api.delete(`/promos/${id}`);
            toast.success('Código removido');
            setPromos(promos.filter(p => p.id !== id));
        } catch (error) {
            toast.error('Erro ao remover código');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Código copiado!');
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Códigos Promocionais</h1>
                <p className="text-muted-foreground">Gerencie cupons para liberar dias de teste do Plano Pro.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Create Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Novo Código</CardTitle>
                        <CardDescription>Crie um cupom para dar dias grátis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Código (ex: PRO30)</label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={newCode} 
                                        onChange={e => setNewCode(e.target.value.toUpperCase())}
                                        placeholder="PRO30" 
                                        required 
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={() => setNewCode('PRO' + Math.floor(Math.random() * 10000))}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Dias de Teste (Pro)</label>
                                <Input 
                                    type="number" 
                                    value={days} 
                                    onChange={e => setDays(e.target.value)}
                                    min="1"
                                    required 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Limite de Usos (Opcional)</label>
                                <Input 
                                    type="number" 
                                    value={maxUses} 
                                    onChange={e => setMaxUses(e.target.value)}
                                    placeholder="Ilimitado"
                                    min="1"
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={creating}>
                                {creating ? 'Criando...' : 'Criar Código'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Códigos Ativos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Benefício</TableHead>
                                    <TableHead>Usos</TableHead>
                                    <TableHead>Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell>
                                    </TableRow>
                                ) : promos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum código criado.</TableCell>
                                    </TableRow>
                                ) : (
                                    promos.map((promo) => (
                                        <TableRow key={promo.id}>
                                            <TableCell className="font-mono font-medium">
                                                <div className="flex items-center gap-2">
                                                    {promo.code}
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(promo.code)}>
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    {promo.value} Dias Pro
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {promo.currentUses} 
                                                <span className="text-muted-foreground"> / {promo.maxUses || '∞'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(promo.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
