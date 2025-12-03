import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (user) => {
      toast.success(`Bem-vindo, ${user.name}!`);
      localStorage.setItem("casadf-user", JSON.stringify(user));
      if (user.role === 'admin' || user.role === 'corretor') setLocation("/admin");
      else setLocation("/");
    },
    onError: (err) => toast.error(err.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-6">
        <CardHeader><CardTitle className="text-center">Acesso ao Sistema</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
            <div className="text-right"><Button variant="link" onClick={() => setLocation("/forgot-password")}>Esqueci a senha</Button></div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>Entrar</Button>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/register")}>Criar Conta</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
