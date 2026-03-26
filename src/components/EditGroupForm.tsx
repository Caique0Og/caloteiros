import { useState, useEffect } from 'react';
import { Group } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Users, Edit } from 'lucide-react';

interface Props {
  group: Group;
  onUpdate: (updates: { name?: string; location?: string; budget?: number; newMemberUsernames?: string[]; memberNameUpdates?: { memberId: string; newName: string }[] }) => void;
  onRemoveMember?: (memberId: string) => void;
  onCancel: () => void;
}

export default function EditGroupForm({ group, onUpdate, onRemoveMember, onCancel }: Props) {
  const [name, setName] = useState(group.name);
  const [location, setLocation] = useState(group.location || '');
  const [budget, setBudget] = useState(group.budget || 0);
  const [memberNames, setMemberNames] = useState(group.members.map(m => ({ id: m.id, name: m.name })));
  const [newMembers, setNewMembers] = useState(['']);

  useEffect(() => {
    setName(group.name);
    setLocation(group.location || '');
    setBudget(group.budget || 0);
    setMemberNames(group.members.map(m => ({ id: m.id, name: m.name })));
  }, [group]);

  const addNewMember = () => setNewMembers([...newMembers, '']);
  const removeNewMember = (i: number) => setNewMembers(newMembers.filter((_, idx) => idx !== i));
  const updateNewMember = (i: number, value: string) => {
    setNewMembers(newMembers.map((m, idx) => (idx === i ? value : m)));
  };

  const updateMemberName = (id: string, newName: string) => {
    setMemberNames(memberNames.map(m => m.id === id ? { ...m, name: newName } : m));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validNewMembers = newMembers.filter(m => m.trim());
    const memberNameUpdates = memberNames
      .filter(m => m.name !== group.members.find(gm => gm.id === m.id)?.name)
      .map(m => ({ memberId: m.id, newName: m.name }));

    const updates: any = {};
    if (name !== group.name) updates.name = name.trim();
    if (location !== (group.location || '')) updates.location = location.trim();
    if (budget !== (group.budget || 0)) updates.budget = budget;
    if (validNewMembers.length > 0) updates.newMemberUsernames = validNewMembers.map(m => m.trim());
    if (memberNameUpdates.length > 0) updates.memberNameUpdates = memberNameUpdates;

    if (Object.keys(updates).length === 0) {
      onCancel();
      return;
    }

    onUpdate(updates);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
          <Edit className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Editar Grupo</h2>
      </div>

      <div className="space-y-2">
        <Label htmlFor="group-name">Nome do grupo</Label>
        <Input id="group-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Local</Label>
        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Orçamento</Label>
        <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} min={0} />
      </div>

      <div className="space-y-3">
        <Label>Membros atuais</Label>
        {memberNames.map((member) => (
          <div key={member.id} className="flex gap-2 items-center">
            <Input
              value={member.name}
              onChange={(e) => updateMemberName(member.id, e.target.value)}
              maxLength={50}
              className="flex-1"
            />
            <Button type="button" variant="destructive" size="icon" onClick={() => {
              setMemberNames(memberNames.filter((m) => m.id !== member.id));
              if (onRemoveMember) onRemoveMember(member.id);
            }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Label>Adicionar novos membros (nome de usuário)</Label>
        <p className="text-xs text-muted-foreground">Digite o nome dos usuários cadastrados para adicionar ao grupo.</p>
        {newMembers.map((m, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="Nome do usuário"
              value={m}
              onChange={(e) => updateNewMember(i, e.target.value)}
              maxLength={50}
              className="flex-1"
            />
            {newMembers.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeNewMember(i)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addNewMember} className="gap-1">
          <Plus className="w-4 h-4" /> Adicionar membro
        </Button>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1">Salvar Alterações</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}