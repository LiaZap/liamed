import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

export default function Showcase() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Design System MEDIPRO</h1>
                <p className="text-muted-foreground mt-2">Visão geral dos componentes e tokens de design.</p>
            </div>

            <Tabs defaultValue="components" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="components">Componentes</TabsTrigger>
                    <TabsTrigger value="typography">Tipografia</TabsTrigger>
                    <TabsTrigger value="colors">Cores</TabsTrigger>
                </TabsList>

                <TabsContent value="components" className="space-y-6">
                    {/* Buttons & Badges */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Botões e Badges</CardTitle>
                            <CardDescription>Elementos interativos principais e indicadores de status.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-4 items-center">
                                <Button>Primary Action</Button>
                                <Button variant="secondary">Secondary Action</Button>
                                <Button variant="destructive">Destructive</Button>
                                <Button variant="outline">Outline</Button>
                                <Button variant="ghost">Ghost</Button>
                                <Button variant="link">Link Button</Button>
                            </div>
                            <div className="flex flex-wrap gap-4 items-center mt-4">
                                <Badge>Default Badge</Badge>
                                <Badge variant="secondary">Secondary</Badge>
                                <Badge variant="destructive">Destructive</Badge>
                                <Badge variant="outline">Outline</Badge>
                                <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200 border-transparent">Success</Badge>
                                <Badge variant="warning" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-transparent">Warning</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inputs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Formulários</CardTitle>
                            <CardDescription>Inputs, selects e switches.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" placeholder="nome@exemplo.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>Especialidade</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma especialidade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Medicina</SelectLabel>
                                            <SelectItem value="cardio">Cardiologia</SelectItem>
                                            <SelectItem value="neuro">Neurologia</SelectItem>
                                            <SelectItem value="orto">Ortopedia</SelectItem>
                                            <SelectItem value="ped">Pediatria</SelectItem>
                                            <SelectItem value="cg">Clínico Geral</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="notifications" />
                                <Label htmlFor="notifications">Receber notificações por email</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Feedback */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Feedback & Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>Informação</AlertTitle>
                                <AlertDescription>Esta é uma mensagem de alerta padrão.</AlertDescription>
                            </Alert>
                            <Alert variant="success">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle>Sucesso</AlertTitle>
                                <AlertDescription>Operação concluída com sucesso.</AlertDescription>
                            </Alert>
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Erro</AlertTitle>
                                <AlertDescription>Ocorreu um erro ao salvar os dados.</AlertDescription>
                            </Alert>

                            <div className="space-y-2 pt-4">
                                <div className="flex justify-between text-sm">
                                    <span>Progresso do atendimento</span>
                                    <span className="text-muted-foreground">45%</span>
                                </div>
                                <Progress value={45} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Data */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Tabulares</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableCaption>Lista de pacientes recentes.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">ID</TableHead>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">PT001</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>JS</AvatarFallback>
                                                </Avatar>
                                                <span>João Silva</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="success" className="bg-green-100 text-green-800 border-none">Confirmado</Badge></TableCell>
                                        <TableCell className="text-right">R$ 450,00</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">PT002</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>MA</AvatarFallback>
                                                </Avatar>
                                                <span>Maria Almeida</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none dark:bg-slate-800 dark:text-slate-300">Pendente</Badge></TableCell>
                                        <TableCell className="text-right">R$ 320,00</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </TabsContent>

                <TabsContent value="typography">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tipografia - Inter</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Heading 1</h1>
                                <p className="text-sm text-muted-foreground">text-4xl font-extrabold</p>
                            </div>
                            <div>
                                <h2 className="text-3xl font-semibold tracking-tight first:mt-0">Heading 2</h2>
                                <p className="text-sm text-muted-foreground">text-3xl font-semibold</p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
                                <p className="text-sm text-muted-foreground">text-2xl font-semibold</p>
                            </div>
                            <div>
                                <p className="leading-7 [&:not(:first-child)]:mt-6">
                                    O design system MEDIPRO utiliza a fonte Inter para garantir legibilidade máxima e um visual moderno e limpo, essencial para ambientes médicos.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="colors">
                    <Card>
                        <CardHeader>
                            <CardTitle>Paleta de Cores</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <div className="h-20 w-full rounded-md bg-primary shadow-sm" />
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm">Primary Blue</p>
                                        <p className="text-xs text-muted-foreground">#0066CC</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-20 w-full rounded-md bg-secondary shadow-sm" />
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm">Secondary Green</p>
                                        <p className="text-xs text-muted-foreground">#10B981</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-20 w-full rounded-md bg-accent shadow-sm" />
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm">Accent Light</p>
                                        <p className="text-xs text-muted-foreground">#E6F2FF</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-20 w-full rounded-md bg-destructive shadow-sm" />
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm">Destructive</p>
                                        <p className="text-xs text-muted-foreground">Red</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
