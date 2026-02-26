import { useState } from 'react';
import { Group } from '@/lib/types';
import { formatCurrency } from '@/lib/debt-calculator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowRight, Receipt, Trash2, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';
import AddExpenseForm from './AddExpenseForm';
import { toast } from 'sonner';

interface Props {
  group: Group;
  onAddExpense: (payerId: string, amount: number, description: string) => void;
  onSettleDebt: (debtId: string, accept: boolean) => void;
  onDelete: () => void;
  onBack: () => void;
}

export default function GroupDetail({ group, onAddExpense, onSettleDebt, onDelete, onBack }: Props) {
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const getMemberName = (id: string) => group.members.find((m) => m.id === id)?.name ?? '?';
  const totalExpenses = group.expenses.reduce((s, e) => s + e.amount, 0);
  const perPerson = group.members.length > 0 ? totalExpenses / group.members.length : 0;

  const handleSettle = (debtId: string, accept: boolean) => {
    onSettleDebt(debtId, accept);
    if (accept) {
      toast.success('Dívida quitada com sucesso! ✅');
    } else {
      toast.error('Quitação recusada. A dívida permanece pendente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2 text-muted-foreground">
            ← Voltar
          </Button>
          <h2 className="text-2xl font-bold">{group.name}</h2>
          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
            {group.location && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{group.location}</span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(group.date).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="text-xl font-bold text-primary mt-1">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Por pessoa</p>
          <p className="text-xl font-bold text-accent mt-1">{formatCurrency(perPerson)}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Membros</p>
          <p className="text-xl font-bold mt-1">{group.members.length}</p>
        </div>
      </div>

      {/* Expenses */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-accent" /> Gastos
          </h3>
          <Button size="sm" onClick={() => setShowExpenseForm(true)} className="gap-1">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </div>

        {showExpenseForm && (
          <div className="mb-4">
            <AddExpenseForm
              members={group.members}
              onSubmit={(payerId, amount, desc) => {
                onAddExpense(payerId, amount, desc);
                setShowExpenseForm(false);
                toast.success(`Gasto de ${formatCurrency(amount)} adicionado!`);
              }}
              onCancel={() => setShowExpenseForm(false)}
            />
          </div>
        )}

        {group.expenses.length === 0 ? (
          <p className="glass-card p-6 text-center text-muted-foreground">
            Nenhum gasto ainda. Adicione o primeiro!
          </p>
        ) : (
          <div className="space-y-2">
            {group.expenses.map((e) => (
              <div key={e.id} className="glass-card p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{e.description}</p>
                  <p className="text-sm text-muted-foreground">
                    Pago por <span className="text-foreground font-medium">{getMemberName(e.payerId)}</span>
                  </p>
                </div>
                <p className="font-mono font-semibold text-primary">{formatCurrency(e.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debts */}
      {group.debts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-danger" /> Quem deve a quem
          </h3>
          <div className="space-y-2">
            {group.debts.map((d) => (
              <div key={d.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium money-negative">{getMemberName(d.debtorId)}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium money-positive">{getMemberName(d.creditorId)}</span>
                  <span className="font-mono font-bold ml-auto mr-4">{formatCurrency(d.amount)}</span>
                </div>
                <div className="flex items-center gap-1">
                  {d.status === 'pending' ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSettle(d.id, true)}
                        className="gap-1 text-success border-success/30 hover:bg-success/10"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Quitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSettle(d.id, false)}
                        className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Recusar
                      </Button>
                    </>
                  ) : (
                    <Badge variant={d.status === 'settled' ? 'default' : 'destructive'}>
                      {d.status === 'settled' ? '✅ Quitada' : '❌ Recusada'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
