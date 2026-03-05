import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateDebts } from '@/lib/debt-calculator';
import type { Group, Member, Expense, Debt } from '@/lib/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar os detalhes de um único grupo (membros, despesas, dívidas)
  const fetchGroupDetails = async (groupId: string): Promise<Omit<Group, 'id' | 'name' | 'adminId' | 'date' | 'location'>> => {
    const membersCol = collection(db, 'groups', groupId, 'members');
    const expensesCol = collection(db, 'groups', groupId, 'expenses');
    const debtsCol = collection(db, 'groups', groupId, 'debts');

    const [membersSnap, expensesSnap, debtsSnap] = await Promise.all([
      getDocs(membersCol),
      getDocs(expensesCol),
      getDocs(debtsCol),
    ]);

    const members: Member[] = membersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
    const expenses: Expense[] = expensesSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        date: (data.date as Timestamp).toDate().toISOString(),
      } as Expense;
    });
    const debts: Debt[] = debtsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Debt));

    return { members, expenses, debts };
  };

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', user.uid));
      const querySnapshot = await getDocs(q);

      const groupsData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const groupData = doc.data();
          const details = await fetchGroupDetails(doc.id);
          return {
            id: doc.id,
            name: groupData.name,
            adminId: groupData.createdBy,
            date: (groupData.createdAt as Timestamp).toDate().toISOString(),
            location: groupData.location,
            ...details,
          };
        })
      );

      setGroups(groupsData as Group[]);
    } catch (error) {
      console.error("Error fetching groups from Firestore:", error);
      toast.error("Erro ao carregar os grupos.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string, location: string, memberUsernames: string[]): Promise<{ id: string; name: string } | null> => {
    if (!user) return null;

    const batch = writeBatch(db);
    const creatorUsername = user.displayName || user.email!.split('@')[0];
    const allUsernames = [...new Set([creatorUsername, ...memberUsernames])];

    // 1. Encontrar UIDs dos usuários a partir dos usernames
    const profilesQuery = query(collection(db, 'profiles'), where('username', 'in', allUsernames));
    const profilesSnap = await getDocs(profilesQuery);
    const foundMembers = profilesSnap.docs.map(d => ({ id: d.id, name: d.data().username as string }));

    if (foundMembers.length !== allUsernames.length) {
      const notFound = allUsernames.filter(un => !foundMembers.some(fm => fm.name === un));
      toast.error(`Usuários não encontrados: ${notFound.join(', ')}`);
      return null;
    }

    // 2. Criar o documento do grupo
    const groupDocRef = await addDoc(collection(db, 'groups'), {
      name,
      location,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      memberIds: foundMembers.map(m => m.id),
    });

    // 3. Adicionar membros na subcoleção 'members'
    foundMembers.forEach(member => {
      const memberDocRef = doc(db, 'groups', groupDocRef.id, 'members', member.id);
      batch.set(memberDocRef, { name: member.name });
    });

    await batch.commit();
    await fetchGroups(); // Recarrega os grupos
    return { id: groupDocRef.id, name };
  };

  const addExpense = async (groupId: string, payerId: string, amount: number, description: string) => {
    if (!user) return;

    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const batch = writeBatch(db);

    // 1. Adicionar a nova despesa
    const expenseColRef = collection(db, 'groups', groupId, 'expenses');
    batch.set(doc(expenseColRef), { payerId, amount, description, date: serverTimestamp(), groupId });

    // 2. Recalcular dívidas
    const tempExpense: Expense = { id: '', groupId, payerId, amount, description, date: new Date().toISOString() };
    const newDebts = calculateDebts(group.members, [...group.expenses, tempExpense]);

    // 3. Deletar dívidas antigas
    const oldDebtsQuery = query(collection(db, 'groups', groupId, 'debts'));
    const oldDebtsSnap = await getDocs(oldDebtsQuery);
    oldDebtsSnap.forEach(debtDoc => batch.delete(debtDoc.ref));

    // 4. Adicionar novas dívidas
    const debtsColRef = collection(db, 'groups', groupId, 'debts');
    newDebts.forEach(debt => {
      batch.set(doc(debtsColRef), { ...debt, id: undefined }); // Firestore gera o ID
    });

    await batch.commit();
    await fetchGroups();
  };

  const settleDebt = async (groupId: string, debtId: string, accept: boolean) => {
    const debtDocRef = doc(db, 'groups', groupId, 'debts', debtId);
    const batch = writeBatch(db);
    batch.update(debtDocRef, { status: accept ? 'settled' : 'rejected' });
    await batch.commit();
    await fetchGroups();
  };

  const deleteGroup = async (groupId: string) => {
    // No Firestore, deletar subcoleções é mais complexo e geralmente
    // requer uma Cloud Function para ser feito de forma segura e completa.
    // Por simplicidade, vamos deletar apenas o documento do grupo.
    await deleteDoc(doc(db, 'groups', groupId));
    await fetchGroups();
  };

  return { groups, loading, createGroup, addExpense, settleDebt, deleteGroup };
}
