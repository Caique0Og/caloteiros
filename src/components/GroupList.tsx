import { Group } from '@/lib/types';
import { formatCurrency } from '@/lib/debt-calculator';
import { Users, ChevronRight, MapPin } from 'lucide-react';

interface Props {
  groups: Group[];
  onSelect: (id: string) => void;
}

export default function GroupList({ groups, onSelect }: Props) {
  if (groups.length === 0) {
    return (
      <div className="glass-card p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Nenhum grupo ainda</h3>
        <p className="text-muted-foreground text-sm">Crie seu primeiro grupo para começar a dividir as contas!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const total = g.expenses.reduce((s, e) => s + e.amount, 0);
        const pendingDebts = g.debts.filter((d) => d.status === 'pending').length;
        return (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            className="glass-card p-4 w-full text-left flex items-center justify-between hover:border-primary/30 transition-colors group"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{g.name}</h3>
              <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                <span>{g.members.length} membros</span>
                {g.location && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{g.location}</span>
                )}
                {total > 0 && <span className="text-primary font-medium">{formatCurrency(total)}</span>}
              </div>
              {pendingDebts > 0 && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                  {pendingDebts} dívida{pendingDebts > 1 ? 's' : ''} pendente{pendingDebts > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        );
      })}
    </div>
  );
}
