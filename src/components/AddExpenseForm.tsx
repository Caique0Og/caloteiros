import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt } from 'lucide-react';
import { Member } from '@/lib/types';

interface Props {
  members: Member[];
  onSubmit: (payerId: string, amount: number, description: string) => void;
  onCancel: () => void;
}

export default function AddExpenseForm({ members, onSubmit, onCancel }: Props) {
  const [payerId, setPayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!payerId || isNaN(numAmount) || numAmount <= 0 || !description.trim()) return;
    onSubmit(payerId, numAmount, description.trim());
    setAmount('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
          <Receipt className="w-4 h-4 text-accent" />
        </div>
        <h3 className="text-lg font-semibold">Adicionar Gasto</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Quem pagou?</Label>
          <Select value={payerId} onValueChange={setPayerId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Input
          placeholder="Ex: Comida, Bebida, Uber..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          maxLength={100}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1">Adicionar</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
