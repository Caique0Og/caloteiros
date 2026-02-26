import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Users } from 'lucide-react';

interface Props {
  onSubmit: (name: string, location: string, memberUsernames: string[]) => void;
  onCancel: () => void;
}

export default function CreateGroupForm({ onSubmit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [members, setMembers] = useState(['', '']);

  const addMember = () => setMembers([...members, '']);
  const removeMember = (i: number) => setMembers(members.filter((_, idx) => idx !== i));
  const updateMember = (i: number, value: string) => {
    setMembers(members.map((m, idx) => (idx === i ? value : m)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validMembers = members.filter((m) => m.trim());
    if (!name.trim() || validMembers.length < 1) return;
    onSubmit(name.trim(), location.trim(), validMembers.map(m => m.trim()));
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Criar Grupo</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="group-name">Nome do grupo</Label>
        <Input id="group-name" placeholder='Ex: "Noite do dia 09/02"' value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Local (opcional)</Label>
        <Input id="location" placeholder="Ex: Bar do Zé" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} />
      </div>

      <div className="space-y-3">
        <Label>Adicionar membros (nome de usuário)</Label>
        <p className="text-xs text-muted-foreground">Digite o nome dos usuários cadastrados (ex: Vini, João, Ca). Você já será incluído automaticamente.</p>
        {members.map((m, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="Nome do usuário"
              value={m}
              onChange={(e) => updateMember(i, e.target.value)}
              maxLength={50}
              className="flex-1"
            />
            {members.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeMember(i)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addMember} className="gap-1">
          <Plus className="w-4 h-4" /> Adicionar membro
        </Button>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1">Criar Grupo</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
