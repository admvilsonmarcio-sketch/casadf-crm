import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => { toast.success("Código enviado (Simulado)"); setStep("reset"); }
  });

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => { toast.success("Senha alterada!"); setLocation("/login"); },
    onError: (err) => toast.error(err.message)
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/login")}><ArrowLeft className="h-4 w-4" /></Button>
            <CardTitle>Recuperar Senha</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <div className="space-y-4">
              <Input placeholder="Seu email" value={email} onChange={e => setEmail(e.target.value)} />
              <Button className="w-full" onClick={() => forgotMutation.mutate({ email })} disabled={forgotMutation.isPending}>Enviar Código</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input placeholder="Código" value={code} onChange={e => setCode(e.target.value)} />
              <Input type="password" placeholder="Nova Senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <Button className="w-full" onClick={() => resetMutation.mutate({ email, code, newPassword })} disabled={resetMutation.isPending}>Alterar</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
