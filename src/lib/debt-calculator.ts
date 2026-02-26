import { Expense, Member, Debt } from './types';

/**
 * Minimum settlement algorithm (Splitwise-style).
 * Calculates who owes whom with minimum number of transactions.
 */
export function calculateDebts(
  members: Member[],
  expenses: Expense[]
): Debt[] {
  if (members.length === 0 || expenses.length === 0) return [];

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = total / members.length;

  // Calculate net balance for each person
  // positive = paid more than fair share (is owed money)
  // negative = paid less than fair share (owes money)
  const balances = new Map<string, number>();
  members.forEach((m) => balances.set(m.id, 0));

  expenses.forEach((e) => {
    const current = balances.get(e.payerId) ?? 0;
    balances.set(e.payerId, current + e.amount);
  });

  // Subtract fair share
  members.forEach((m) => {
    const current = balances.get(m.id) ?? 0;
    balances.set(m.id, current - perPerson);
  });

  // Separate into creditors (positive) and debtors (negative)
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  balances.forEach((balance, id) => {
    if (balance > 0.01) {
      creditors.push({ id, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id, amount: -balance });
    }
  });

  // Sort descending for greedy settlement
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const debts: Debt[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].amount, debtors[di].amount);

    if (amount > 0.01) {
      debts.push({
        id: `debt-${ci}-${di}`,
        debtorId: debtors[di].id,
        creditorId: creditors[ci].id,
        amount: Math.round(amount * 100) / 100,
        status: 'pending',
      });
    }

    creditors[ci].amount -= amount;
    debtors[di].amount -= amount;

    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount < 0.01) di++;
  }

  return debts;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
