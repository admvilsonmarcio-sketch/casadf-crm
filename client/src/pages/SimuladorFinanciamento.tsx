import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calculator, DollarSign, Home, Clock, Send, Download } from "lucide-react";
import { toast } from "sonner";

// Helper para formatar moeda
const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
};

// Componente principal do simulador
export default function SimuladorFinanciamento() {
    const [formData, setFormData] = useState({
        propertyValue: 500000,
        downPayment: 100000,
        years: 30,
        clientName: "",
        clientEmail: "",
        clientPhone: "",
    });
    const [results, setResults] = useState<any[] | null>(null);

    const simulateMutation = trpc.financial.simulate.useMutation({
        onSuccess: (data) => {
            setResults(data.results);
            toast.success("Simulação concluída!");
        },
        onError: (error) => {
            toast.error(`Erro na simulação: ${error.message}`);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Converte para centavos antes de enviar para o backend
        const dataToSend = {
            ...formData,
            propertyValue: Math.round(formData.propertyValue * 100),
            downPayment: Math.round(formData.downPayment * 100),
        };

        simulateMutation.mutate(dataToSend);
    };

    const handleDownload = () => {
        toast.info("Geração de relatório PDF/Excel será implementada aqui.");
    };

    return (
        <div className="min-h-screen flex flex-col bg-muted/30">
            <Header />
            <main className="flex-1 container py-12">
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Coluna 1: Formulário de Entrada */}
                    <Card className="md:col-span-1 shadow-lg h-fit sticky top-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-6 w-6" />
                                Simular Financiamento
                            </CardTitle>
                            <CardDescription>
                                Compare taxas SAQUE e PRICE nos principais bancos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <h3 className="font-semibold text-sm pt-4 border-t">Dados do Imóvel</h3>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="value">Valor do Imóvel (R$)</Label>
                                    <Input 
                                        id="value" 
                                        type="number" 
                                        value={formData.propertyValue} 
                                        onChange={e => setFormData({...formData, propertyValue: parseFloat(e.target.value)})}
                                        required 
                                        min={1000}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="down">Valor da Entrada (R$)</Label>
                                    <Input 
                                        id="down" 
                                        type="number" 
                                        value={formData.downPayment} 
                                        onChange={e => setFormData({...formData, downPayment: parseFloat(e.target.value)})}
                                        required 
                                        min={0}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="years">Prazo (Anos)</Label>
                                    <Select
                                        value={formData.years.toString()}
                                        onValueChange={(value) => setFormData({...formData, years: parseInt(value)})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o prazo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">15 Anos</SelectItem>
                                            <SelectItem value="20">20 Anos</SelectItem>
                                            <SelectItem value="30">30 Anos</SelectItem>
                                            <SelectItem value="35">35 Anos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <h3 className="font-semibold text-sm pt-4 border-t">Seus Dados</h3>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome</Label>
                                    <Input id="name" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input id="email" type="email" value={formData.clientEmail} onChange={e => setFormData({...formData, clientEmail: e.target.value})} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input id="phone" value={formData.clientPhone} onChange={e => setFormData({...formData, clientPhone: e.target.value})} required />
                                </div>

                                <Button type="submit" className="w-full" disabled={simulateMutation.isPending}>
                                    {simulateMutation.isPending ? "Calculando..." : "Simular Agora"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Coluna 2: Resultados */}
                    <div className="md:col-span-2 space-y-6">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle>Resumo da Simulação</CardTitle>
                                <CardDescription>
                                    {results ? `${results.length} simulações de financiamento geradas.` : 'Preencha o formulário para calcular.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {simulateMutation.isPending && (
                                    <div className="flex items-center justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                                        Calculando as propostas em todos os bancos...
                                    </div>
                                )}

                                {results ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Card className="bg-primary text-primary-foreground text-center">
                                                <CardContent className="p-4">
                                                    <div className="text-sm">Valor Financiado</div>
                                                    <div className="text-2xl font-bold">{formatCurrency(formData.propertyValue * 100 - formData.downPayment * 100)}</div>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-primary/10 text-foreground text-center">
                                                <CardContent className="p-4">
                                                    <div className="text-sm">Prazo Total</div>
                                                    <div className="text-2xl font-bold">{formData.years} anos</div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Button onClick={handleDownload} variant="secondary" className="w-full">
                                            <Download className="h-4 w-4 mr-2" /> Baixar Relatório Completo
                                        </Button>
                                    
                                        <h3 className="font-semibold text-lg pt-4 border-t">Propostas por Banco</h3>
                                        <div className="space-y-4">
                                            {results.map((prop: any, index: number) => (
                                                <Card key={index} className="border-l-4 border-l-blue-500">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xl">{prop.bankName}</CardTitle>
                                                        <CardDescription>Taxa Anual: {prop.rate.toFixed(2)}% | Prazo: {prop.maxYears} anos</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="grid md:grid-cols-2 gap-4">
                                                        {/* SAQUE */}
                                                        <div className="p-4 border rounded-lg bg-gray-50">
                                                            <h4 className="font-bold mb-2">SAQUE</h4>
                                                            <p className="text-sm">1ª Parcela: <span className="font-medium">{formatCurrency(prop.result.sac.firstInstallment)}</span></p>
                                                            <p className="text-sm">Última Parcela: <span className="font-medium">{formatCurrency(prop.result.sac.lastInstallment)}</span></p>
                                                        </div>
                                                        {/* PRICE */}
                                                        <div className="p-4 border rounded-lg bg-gray-50">
                                                            <h4 className="font-bold mb-2">PRICE</h4>
                                                            <p className="text-sm">Parcela Fixa: <span className="font-medium">{formatCurrency(prop.result.price.installment)}</span></p>
                                                            <p className="text-sm">Total Pago: <span className="font-medium">{formatCurrency(prop.result.price.totalPaid)}</span></p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-12 text-muted-foreground">
                                        <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Seu relatório de simulação aparecerá aqui.</p>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <p className="text-xs text-muted-foreground">
                                    Os resultados são apenas simulações. Taxas podem mudar.
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
