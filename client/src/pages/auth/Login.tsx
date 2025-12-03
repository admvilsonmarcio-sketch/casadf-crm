import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Lock, Mail } from "lucide-react";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
          <CardDescription>Acesse sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register" onClick={() => setLocation("/register")}>Criar Conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate({ email, password }); }} className="space-y-4">
                <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
                <div className="text-right"><Button variant="link" onClick={() => setLocation("/forgot-password")}>Esqueci a senha</Button></div>
                <Button type="submit" className="w-full" disabled={loginMutation.isPending}>Entrar</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
