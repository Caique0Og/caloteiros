import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Group, Debt, Expense, Profile } from '@/lib/types';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const handleError = (error: any, context: string) => {
    console.error(`${context} error:`, error);
    const errorMessage = error.message || `Ocorreu um erro em: ${context}.`;
    toast.error(errorMessage);
  };

  const fetchGroups = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-groups-for-user');

      if (error) throw error;

      // O Supabase Edge Function retorna os dados dentro de uma propriedade 'data'
      setGroups(data || []);
    } catch (error) {
      handleError(error, 'Fetch groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (name: string, location: string, memberUsernames: string[]): Promise<Group | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para criar um grupo.');
      return null;
    }

    try {
      const { data: newGroup, error } = await supabase.functions.invoke('create-group', {
        body: {
          name,
          location,
          memberUsernames,
        },
      });

      if (error) throw error;

      // A função retorna o novo grupo, que adicionamos ao estado local
      setGroups((prev) => [newGroup, ...prev]);
      return newGroup;
    } catch (error) {
      handleError(error, 'Create group');
      return null;
    }
  };

  const addExpense = async (groupId: string, payerId: string, amount: number, description: string) => {
    try {
      const { error } = await supabase.functions.invoke('add-expense', {
        body: {
          groupId,
          payerId,
          amount,
          description,
        },
      });

      if (error) throw error;

      // Após adicionar a despesa, o ideal é que a função de borda retorne
      // o grupo atualizado, ou simplesmente buscamos os grupos novamente.
      await fetchGroups();
      toast.success('Despesa adicionada!');
    } catch (error) {
      handleError(error, 'Add expense');
    }
  };

  const settleDebt = async (groupId: string, debtId: string, accept: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('settle-debt', {
        body: {
          groupId,
          debtId,
          accept,
        },
      });

      if (error) throw error;

      await fetchGroups();
      toast.success(accept ? 'Dívida marcada como paga!' : 'Pagamento recusado.');
    } catch (error) {
      handleError(error, 'Settle debt');
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase.functions.invoke('delete-group', {
        body: {
          groupId,
        },
      });

      if (error) throw error;

      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (error) {
      handleError(error, 'Delete group');
    }
  };

  return {
    groups,
    loading,
    createGroup,
    addExpense,
    settleDebt,
    deleteGroup,
  };
}

export interface GroupWithDetails extends Group {
  members: Profile[];
  expenses: Expense[];
  debts: Debt[];
}