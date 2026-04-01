import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Group } from '@/lib/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { groupService } from '@/services/groupService';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user?.id) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const groupsData = await groupService.fetchUserGroups(user.id);
      setGroups(groupsData);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Erro ao carregar os grupos.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string, location: string, budget: number, memberUsernames: string[]) => {
    if (!user?.id) return null;
    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Usuário';

    try {
      const result = await groupService.createGroup(user.id, username, name, location, budget, memberUsernames);
      await fetchGroups();
      return result;
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar grupo.");
      return null;
    }
  };

  const addExpense = async (groupId: string, payerId: string, amount: number, description: string) => {
    try {
      await groupService.addExpense(groupId, payerId, amount, description);
      await fetchGroups();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Erro ao adicionar despesa.");
    }
  };

  const settleDebt = async (groupId: string, debtId: string, accept: boolean) => {
    try {
      await groupService.settleDebt(groupId, debtId, accept);
      await fetchGroups();
    } catch (error) {
      console.error("Error settling debt:", error);
      toast.error("Erro ao atualizar dívida.");
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await groupService.deleteGroup(groupId);
      await fetchGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      toast.error("Erro ao deletar grupo.");
    }
  };

  const removeMember = async (groupId: string, memberId: string) => {
    try {
      await groupService.removeMember(groupId, memberId);
      await fetchGroups();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Erro ao remover membro.");
    }
  };

  const updateGroup = async (groupId: string, updates: any) => {
    try {
      await groupService.updateGroup(groupId, updates);
      await fetchGroups();
      toast.success('Grupo atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating group:', error);
      toast.error(error.message || 'Erro ao atualizar o grupo.');
    }
  };

  const deleteUserData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const groupsQuery = query(collection(db, 'groups'), where('memberIds', 'array-contains', user.id));
      const groupsSnapshot = await getDocs(groupsQuery);

      for (const groupDoc of groupsSnapshot.docs) {
        const groupId = groupDoc.id;
        const groupData = groupDoc.data();

        if (groupData.createdBy === user.id) {
          await groupService.deleteGroup(groupId);
        } else {
          await groupService.removeMember(groupId, user.id);
        }
      }

      await deleteDoc(doc(db, 'profiles', user.id));
      setGroups([]);
    } catch (error) {
      console.error("Error deleting user data:", error);
      toast.error("Erro ao excluir dados do usuário.");
    } finally {
      setLoading(false);
    }
  };

  return { 
    groups, 
    loading, 
    createGroup, 
    addExpense, 
    settleDebt, 
    deleteGroup, 
    updateGroup, 
    removeMember, 
    deleteUserData 
  };
}
