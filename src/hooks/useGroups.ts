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

  const recalcGroupDebts = async (groupId: string) => {
    const membersCol = collection(db, 'groups', groupId, 'members');
    const expensesCol = collection(db, 'groups', groupId, 'expenses');
    const debtsCol = collection(db, 'groups', groupId, 'debts');

    const [membersSnap, expensesSnap, oldDebtsSnap] = await Promise.all([
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

    const groupSnap = await getDoc(doc(db, 'groups', groupId));
    const groupBudget = groupSnap.exists() ? (groupSnap.data().budget as number | undefined) : undefined;
    const newDebts = calculateDebts(members, expenses, groupBudget);

    const batch = writeBatch(db);
    oldDebtsSnap.forEach(debtDoc => batch.delete(debtDoc.ref));
    newDebts.forEach(debt => {
      const { id, ...rest } = debt;
      batch.set(doc(debtsCol), rest);
    });
    await batch.commit();
  };

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', user.id));
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
            budget: groupData.budget,
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

  const createGroup = async (name: string, location: string, budget: number, memberUsernames: string[]): Promise<{ id: string; name: string } | null> => {
    if (!user) return null;

    const batch = writeBatch(db);
    const creatorUsername = user.user_metadata?.username || user.email?.split('@')[0];
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
      budget,
      createdBy: user.id,
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

    // 1. Adicionar a nova despesa
    const expenseColRef = collection(db, 'groups', groupId, 'expenses');
    await addDoc(expenseColRef, { payerId, amount, description, date: serverTimestamp(), groupId });

    // 2. Recalcular dívidas usando o orçamento do grupo (se houver)
    await recalcGroupDebts(groupId);

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

  const deleteUserData = async () => {
    if (!user) return;

    // 1. Remove o usuário de todos os grupos em que participa
    const groupsQuery = query(collection(db, 'groups'), where('memberIds', 'array-contains', user.id));
    const groupsSnapshot = await getDocs(groupsQuery);

    for (const groupDoc of groupsSnapshot.docs) {
      const groupId = groupDoc.id;
      const groupData = groupDoc.data();

      if (groupData.createdBy === user.id) {
        // Se o usuário é criador/admin, remove o grupo inteiro
        await deleteGroup(groupId);
      } else {
        const groupDocRef = doc(db, 'groups', groupId);
        const memberDocRef = doc(db, 'groups', groupId, 'members', user.id);
        const currentMemberIds: string[] = groupData.memberIds || [];
        const updatedMemberIds = currentMemberIds.filter((id) => id !== user.id);

        const batch = writeBatch(db);
        batch.update(groupDocRef, { memberIds: updatedMemberIds });
        batch.delete(memberDocRef);
        await batch.commit();

        // Recalcula dívidas do grupo após remoção
        await recalcGroupDebts(groupId);
      }
    }

    // 2. Remove o perfil do usuário
    await deleteDoc(doc(db, 'profiles', user.id));

    // 3. Atualiza estado local
    setGroups([]);
    setLoading(false);
  };

  const removeMember = async (groupId: string, memberId: string) => {
    if (!user) return;

    const batch = writeBatch(db);
    const groupDocRef = doc(db, 'groups', groupId);
    const memberDocRef = doc(db, 'groups', groupId, 'members', memberId);

    const groupSnap = await getDoc(groupDocRef);
    if (!groupSnap.exists()) return;

    const currentMemberIds: string[] = groupSnap.data().memberIds || [];
    const updatedMemberIds = currentMemberIds.filter((id) => id !== memberId);

    batch.update(groupDocRef, { memberIds: updatedMemberIds });
    batch.delete(memberDocRef);

    await batch.commit();

    // Recalcular dívidas depois da remoção
    await recalcGroupDebts(groupId);
    await fetchGroups();
  };

  const updateGroup = async (groupId: string, updates: { name?: string; location?: string; budget?: number; newMemberUsernames?: string[]; memberNameUpdates?: { memberId: string; newName: string }[] }) => {
    if (!user) return;

    try {
      const batch = writeBatch(db);
      const groupDocRef = doc(db, 'groups', groupId);

      // Atualizar campos do grupo
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.budget !== undefined) updateData.budget = updates.budget;

      if (Object.keys(updateData).length > 0) {
        batch.update(groupDocRef, updateData);
      }

      // Adicionar novos membros
      if (updates.newMemberUsernames && updates.newMemberUsernames.length > 0) {
        const profilesQuery = query(collection(db, 'profiles'), where('username', 'in', updates.newMemberUsernames));
        const profilesSnap = await getDocs(profilesQuery);
        const newMembers = profilesSnap.docs.map(d => ({ id: d.id, name: d.data().username as string }));

        if (newMembers.length !== updates.newMemberUsernames.length) {
          const notFound = updates.newMemberUsernames.filter(un => !newMembers.some(nm => nm.name === un));
          toast.error(`Usuários não encontrados: ${notFound.join(', ')}`);
          return;
        }

        const groupSnap = await getDoc(groupDocRef);
        if (groupSnap.exists()) {
          const currentMemberIds = groupSnap.data().memberIds || [];
          const newMemberIds = newMembers.map(m => m.id);
          batch.update(groupDocRef, { memberIds: [...new Set([...currentMemberIds, ...newMemberIds])] });
        }

        newMembers.forEach(member => {
          const memberDocRef = doc(db, 'groups', groupId, 'members', member.id);
          batch.set(memberDocRef, { name: member.name }, { merge: true });
        });
      }

      // Atualizar nomes de membros existentes
      if (updates.memberNameUpdates && updates.memberNameUpdates.length > 0) {
        updates.memberNameUpdates.forEach(update => {
          const memberDocRef = doc(db, 'groups', groupId, 'members', update.memberId);
          batch.update(memberDocRef, { name: update.newName });
        });
      }

      await batch.commit();

      // Sempre recalcular dívidas após qualquer mudança relevante para o grupo
      await recalcGroupDebts(groupId);

      await fetchGroups();
      toast.success('Grupo atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating group:', error);
      toast.error('Erro ao atualizar o grupo.');
    }
  };

  return { groups, loading, createGroup, addExpense, settleDebt, deleteGroup, updateGroup, removeMember, deleteUserData };
}
