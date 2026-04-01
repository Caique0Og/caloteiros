import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
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
import { Users, Group, ShieldAlert, BarChart3, UserCog, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Admin() {
  const { signOut } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Real-time listener for profiles (Removed orderBy to avoid indexing issues)
    const usersCollection = collection(db, "profiles");
    const unsubscribeUsers = onSnapshot(usersCollection, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar usuários (detalhado):", error);
      toast.error(`Erro ao carregar usuários: ${error.message}`);
      setLoading(false);
    });

    // Real-time listener for groups
    const groupsCollection = collection(db, "groups");
    const unsubscribeGroups = onSnapshot(groupsCollection, (snapshot) => {
      const groupData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(groupData);
    }, (error) => {
      console.error("Erro ao buscar grupos (detalhado):", error);
      toast.error(`Erro ao carregar grupos: ${error.message}`);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeGroups();
    };
  }, []);

  const handleToggleRole = async (userId: string, currentRole: string) => {
    setUpdating(userId);
    const newRole = currentRole === "admin" ? "user" : "admin";
    
    try {
      const userRef = doc(db, "profiles", userId);
      await updateDoc(userRef, { role: newRole });
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
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl neon-glow">
          <ShieldAlert className="w-8 h-8 text-primary" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel de Administração</h1>
            <p className="text-muted-foreground">Gerencie usuários e monitore a atividade do sistema em tempo real.</p>
          </div>
          <Button variant="ghost" className="gap-2 self-start md:self-center text-muted-foreground hover:text-destructive transition-colors" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            Sair do Painel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos Ativos</CardTitle>
            <Group className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50 backdrop-blur shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 px-2 py-0.5">
              Operacional (Firestore)
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-background">
            <Users className="w-4 h-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2 data-[state=active]:bg-background">
            <Group className="w-4 h-4" /> Grupos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>Visualize e gerencie todos os perfis no Firestore com atualizações automáticas.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead className="pl-6">Nome de Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>ID (UID)</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead className="text-right pr-6">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium pl-6">{user.username || "Sem nome"}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email || "N/A"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{user.id}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.role === "admin" ? "default" : "secondary"}
                            className={user.role === "admin" ? "bg-primary shadow-sm" : "opacity-80"}
                          >
                            {user.role || "user"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={updating === user.id}
                            onClick={() => handleToggleRole(user.id, user.role || 'user')}
                            className="flex items-center gap-2 border-border/50 hover:bg-primary/10 hover:text-primary transition-all ml-auto"
                          >
                            {updating === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCog className="w-4 h-4" />}
                            {user.role === "admin" ? "Remover Admin" : "Tornar Admin"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          Nenhum usuário encontrado na coleção 'profiles'.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle>Grupos do Sistema</CardTitle>
              <CardDescription>Lista de todos os grupos ativos no Firestore.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead className="pl-6">Nome do Grupo</TableHead>
                      <TableHead>Dono (UID)</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium pl-6">{group.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground italic">{group.createdBy || group.owner_id || "N/A"}</TableCell>
                        <TableCell>{group.location || "Remoto"}</TableCell>
                        <TableCell className="text-muted-foreground">
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
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          Nenhum grupo encontrado na coleção 'groups'.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
