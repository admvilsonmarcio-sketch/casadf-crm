import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";

export default function UsersAdmin() {
  const { data: users, refetch } = trpc.users.list.useQuery();
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "agent" });

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário adicionado!");
      setNewUser({ name: "", email: "", role: "agent" });
      refetch();
    },
    onError: () => toast.error("Erro ao adicionar usuário.")
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário removido.");
      refetch();
    }
  });

  const handleAdd = () => {
    if(!newUser.name || !newUser.email) return;
    createMutation.mutate(newUser);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8" /> Gestão de Equipe
        </h1>

        <Card>
          <CardHeader><CardTitle>Adicionar Membro</CardTitle></CardHeader>
          <CardContent className="flex gap-4">
            <Input placeholder="Nome" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
            <Input placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
            <Button onClick={handleAdd} disabled={createMutation.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Membros Ativos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: user.id })} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">Nenhum usuário encontrado.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
