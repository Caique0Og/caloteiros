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

// Helper for safe timestamp to ISO conversion
const timestampToISO = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp instanceof Timestamp) return timestamp.toDate().toISOString();
  if (timestamp.seconds) return new Date(timestamp.seconds * 1000).toISOString();
  return new Date().toISOString();
};

export const groupService = {
  async fetchGroupDetails(groupId: string): Promise<Pick<Group, 'members' | 'expenses' | 'debts'>> {
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
        date: timestampToISO(data.date),
      } as Expense;
    });
    const debts: Debt[] = debtsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Debt));

    return { members, expenses, debts };
  },

  async recalcGroupDebts(groupId: string) {
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
        date: timestampToISO(data.date),
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
  },

  async fetchUserGroups(userId: string): Promise<Group[]> {
    const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', userId));
    const querySnapshot = await getDocs(q);

    return await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const groupData = doc.data();
        const details = await this.fetchGroupDetails(doc.id);
        return {
          id: doc.id,
          name: groupData.name,
          adminId: groupData.createdBy,
          date: timestampToISO(groupData.createdAt || groupData.created_at),
          location: groupData.location,
          budget: groupData.budget,
          ...details,
        } as Group;
      })
    );
  },

  async createGroup(userId: string, username: string, name: string, location: string, budget: number, memberUsernames: string[]) {
    const batch = writeBatch(db);
    const allUsernames = [...new Set([username, ...memberUsernames])];

    const profilesQuery = query(collection(db, 'profiles'), where('username', 'in', allUsernames));
    const profilesSnap = await getDocs(profilesQuery);
    const foundMembers = profilesSnap.docs.map(d => ({ id: d.id, name: d.data().username as string }));

    if (foundMembers.length !== allUsernames.length) {
      const notFound = allUsernames.filter(un => !foundMembers.some(fm => fm.name === un));
      throw new Error(`Usuários não encontrados: ${notFound.join(', ')}`);
    }

    const groupDocRef = await addDoc(collection(db, 'groups'), {
      name,
      location,
      budget,
      createdBy: userId,
      createdAt: serverTimestamp(),
      memberIds: foundMembers.map(m => m.id),
    });

    foundMembers.forEach(member => {
      const memberDocRef = doc(db, 'groups', groupDocRef.id, 'members', member.id);
      batch.set(memberDocRef, { name: member.name });
    });

    await batch.commit();
    return { id: groupDocRef.id, name };
  },

  async addExpense(groupId: string, payerId: string, amount: number, description: string) {
    const expenseColRef = collection(db, 'groups', groupId, 'expenses');
    await addDoc(expenseColRef, { 
      payerId, 
      amount, 
      description, 
      date: serverTimestamp(), 
      groupId 
    });
    await this.recalcGroupDebts(groupId);
  },

  async settleDebt(groupId: string, debtId: string, accept: boolean) {
    const debtDocRef = doc(db, 'groups', groupId, 'debts', debtId);
    const batch = writeBatch(db);
    batch.update(debtDocRef, { status: accept ? 'settled' : 'rejected' });
    await batch.commit();
  },

  async deleteGroup(groupId: string) {
    await deleteDoc(doc(db, 'groups', groupId));
  },

  async removeMember(groupId: string, memberId: string) {
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
    await this.recalcGroupDebts(groupId);
  },

  async updateGroup(groupId: string, updates: { 
    name?: string; 
    location?: string; 
    budget?: number; 
    newMemberUsernames?: string[]; 
    memberNameUpdates?: { memberId: string; newName: string }[] 
  }) {
    const batch = writeBatch(db);
    const groupDocRef = doc(db, 'groups', groupId);

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.budget !== undefined) updateData.budget = updates.budget;

    if (Object.keys(updateData).length > 0) {
      batch.update(groupDocRef, updateData);
    }

    if (updates.newMemberUsernames && updates.newMemberUsernames.length > 0) {
      const profilesQuery = query(collection(db, 'profiles'), where('username', 'in', updates.newMemberUsernames));
      const profilesSnap = await getDocs(profilesQuery);
      const newMembers = profilesSnap.docs.map(d => ({ id: d.id, name: d.data().username as string }));

      if (newMembers.length !== updates.newMemberUsernames.length) {
        const notFound = updates.newMemberUsernames.filter(un => !newMembers.some(nm => nm.name === un));
        throw new Error(`Usuários não encontrados: ${notFound.join(', ')}`);
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

    if (updates.memberNameUpdates && updates.memberNameUpdates.length > 0) {
      updates.memberNameUpdates.forEach(update => {
        const memberDocRef = doc(db, 'groups', groupId, 'members', update.memberId);
        batch.update(memberDocRef, { name: update.newName });
      });
    }

    await batch.commit();
    await this.recalcGroupDebts(groupId);
  }
};
