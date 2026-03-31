import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Group, ShieldAlert, BarChart3, UserCog, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Admin() {
  const { signOut } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Busca Usuários (Profiles) do Firestore
        const usersQuery = collection(db, "profiles");
        const usersSnapshot = await getDocs(usersQuery);
        const userData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Busca Grupos do Firestore
        const groupsQuery = collection(db, "groups");
        const groupsSnapshot = await getDocs(groupsQuery);
        const groupData = groupsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUsers(userData);
        setGroups(groupData);
      } catch (error) {
        console.error("Erro ao buscar dados do Firestore:", error);
        toast.error("Erro ao carregar dados administrativos");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    setUpdating(userId);
    const newRole = currentRole === "admin" ? "user" : "admin";
    
    try {
      const userRef = doc(db, "profiles", userId);
      await updateDoc(userRef, { role: newRole });

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Papel do usuário atualizado para ${newRole}`);
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Erro ao atualizar papel do usuário");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ShieldAlert className="w-8 h-8 text-primary" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
          <div>
            <h1 className="text-3xl font-bold">Painel de Administração</h1>
            <p className="text-muted-foreground">Gerencie usuários e monitore a atividade do sistema.</p>
          </div>
          <Button variant="ghost" className="gap-2 self-start md:self-center text-muted-foreground hover:text-destructive" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            Sair do Painel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos Ativos</CardTitle>
            <Group className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Operacional (Firebase)
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <Group className="w-4 h-4" /> Grupos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>Visualize e gerencie todos os perfis no Firestore.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome de Usuário</TableHead>
                    <TableHead>ID (UID)</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{user.username || "Sem nome"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{user.id}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.role === "admin" ? "default" : "secondary"}
                          className={user.role === "admin" ? "bg-primary shadow-sm" : ""}
                        >
                          {user.role || "user"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.createdAt?.seconds 
                          ? new Date(user.createdAt.seconds * 1000).toLocaleDateString("pt-BR")
                          : user.created_at?.seconds
                          ? new Date(user.created_at.seconds * 1000).toLocaleDateString("pt-BR")
                          : "Data N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={updating === user.id}
                          onClick={() => handleToggleRole(user.id, user.role || 'user')}
                          className="flex items-center gap-2 border-border/50 hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <UserCog className="w-4 h-4" />
                          {user.role === "admin" ? "Remover Admin" : "Tornar Admin"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado na coleção 'profiles'.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Grupos do Sistema</CardTitle>
              <CardDescription>Lista de todos os grupos ativos no Firestore.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Grupo</TableHead>
                    <TableHead>Dono (UID)</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground italic">{group.createdBy || group.owner_id || "N/A"}</TableCell>
                      <TableCell>{group.location || "Remoto"}</TableCell>
                      <TableCell>
                        {group.createdAt?.seconds 
                          ? new Date(group.createdAt.seconds * 1000).toLocaleDateString("pt-BR")
                          : group.created_at?.seconds
                          ? new Date(group.created_at.seconds * 1000).toLocaleDateString("pt-BR")
                          : "Data N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {groups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum grupo encontrado na coleção 'groups'.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
