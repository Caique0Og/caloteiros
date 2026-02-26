export interface Member {
  id: string;
  name: string;
  email?: string;
}

export interface Expense {
  id: string;
  groupId: string;
  payerId: string;
  amount: number;
  description: string;
  date: string;
}

export interface Debt {
  id: string;
  debtorId: string;
  creditorId: string;
  amount: number;
  status: 'pending' | 'settled' | 'rejected';
}

export interface Group {
  id: string;
  name: string;
  adminId: string;
  date: string;
  location?: string;
  members: Member[];
  expenses: Expense[];
  debts: Debt[];
}
