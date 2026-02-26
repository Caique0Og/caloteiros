import { useState } from 'react';
import { useGroups } from '@/hooks/useGroups';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Plus, Skull, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import GroupList from '@/components/GroupList';
import GroupDetail from '@/components/GroupDetail';
import CreateGroupForm from '@/components/CreateGroupForm';
import { toast } from 'sonner';

const Index = () => {
  const { user, signOut } = useAuth();
  const { groups, loading, createGroup, addExpense, settleDebt, deleteGroup } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Usuário';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando grupos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-10 bg-background/80">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center neon-glow">
              <Skull className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold neon-text">Os Caloteiros</h1>
              <p className="text-xs text-muted-foreground">Olá, <span className="text-foreground font-medium">{username}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!selectedGroup && !showCreateForm && (
              <Button onClick={() => setShowCreateForm(true)} className="gap-1">
                <Plus className="w-4 h-4" /> Novo Grupo
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alternar tema">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {showCreateForm ? (
          <CreateGroupForm
            onSubmit={async (name, location, memberUsernames) => {
              const group = await createGroup(name, location, memberUsernames);
              setShowCreateForm(false);
              if (group) {
                setSelectedGroupId(group.id);
                toast.success(`Grupo "${name}" criado!`);
              }
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        ) : selectedGroup ? (
          <GroupDetail
            group={selectedGroup}
            onAddExpense={(payerId, amount, desc) => addExpense(selectedGroup.id, payerId, amount, desc)}
            onSettleDebt={(debtId, accept) => settleDebt(selectedGroup.id, debtId, accept)}
            onDelete={async () => {
              await deleteGroup(selectedGroup.id);
              setSelectedGroupId(null);
              toast.success('Grupo removido!');
            }}
            onBack={() => setSelectedGroupId(null)}
          />
        ) : (
          <GroupList groups={groups} onSelect={setSelectedGroupId} />
        )}
      </main>
    </div>
  );
};

export default Index;
