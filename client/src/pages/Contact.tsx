import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const createLeadMutation = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Mensagem enviada! Entraremos em contato em breve.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    },
    onError: () => toast.error("Erro ao enviar mensagem.")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLeadMutation.mutate({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      notes: `Mensagem do site: ${formData.message}`,
      source: "site_contato"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container py-12">
        <h1 className="text-4xl font-serif font-bold text-center mb-8">Entre em Contato</h1>
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div className="space-y-8">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full"><Phone className="text-primary h-6 w-6"/></div>
                  <div><h3 className="font-semibold">Telefone</h3><p>(61) 3254-4464</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full"><Mail className="text-primary h-6 w-6"/></div>
                  <div><h3 className="font-semibold">E-mail</h3><p>ernanisimiao@hotmail.com</p></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full"><MapPin className="text-primary h-6 w-6"/></div>
                  <div><h3 className="font-semibold">Localização</h3><p>Brasília - DF</p></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Envie uma mensagem</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input placeholder="Seu Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                <Input type="email" placeholder="Seu E-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                <Input placeholder="Seu Telefone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                <Textarea placeholder="Como podemos ajudar?" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows={4} required />
                <Button type="submit" className="w-full" disabled={createLeadMutation.isPending}>
                  <Send className="mr-2 h-4 w-4" /> Enviar
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
