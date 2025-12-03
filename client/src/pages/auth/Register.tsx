import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirm: "", phone: "" });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => { toast.success("Conta criada!"); setLocation("/login"); },
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm) { toast.error("Senhas não conferem"); return; }
    registerMutation.mutate({ name: formData.name, email: formData.email, password: formData.password, phone: formData.phone, role: "cliente" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2"><Button variant="ghost" size="icon" onClick={() => setLocation("/login")}><ArrowLeft className="h-4 w-4" /></Button><CardTitle>Criar Conta</CardTitle></div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            <Input placeholder="Telefone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <Input type="password" placeholder="Senha" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength={6} />
            <Input type="password" placeholder="Confirmar Senha" value={formData.confirm} onChange={e => setFormData({...formData, confirm: e.target.value})} required />
            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>Cadastrar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
