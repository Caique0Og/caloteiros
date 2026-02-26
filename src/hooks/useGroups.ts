import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDebts } from '@/lib/debt-calculator';
import { Group, Member, Expense, Debt } from '@/lib/types';
import { useAuth } from './useAuth';

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) { setGroups([]); setLoading(false); return; }
    
    // Get groups where user is a member
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (!memberships?.length) { setGroups([]); setLoading(false); return; }

    const groupIds = memberships.map(m => m.group_id);
    
    const [groupsRes, membersRes, expensesRes, debtsRes] = await Promise.all([
      supabase.from('groups').select('*').in('id', groupIds),
      supabase.from('group_members').select('*, profiles(id, username)').in('group_id', groupIds),
      supabase.from('expenses').select('*').in('group_id', groupIds),
      supabase.from('debts').select('*').in('group_id', groupIds),
    ]);

    const assembled: Group[] = (groupsRes.data ?? []).map(g => ({
      id: g.id,
      name: g.name,
      adminId: g.owner_id,
      date: g.created_at,
      location: g.location ?? undefined,
      members: (membersRes.data ?? [])
        .filter(m => m.group_id === g.id)
        .map(m => ({ id: m.user_id, name: (m.profiles as any)?.username ?? '?' })),
      expenses: (expensesRes.data ?? [])
        .filter(e => e.group_id === g.id)
        .map(e => ({
          id: e.id, groupId: e.group_id, payerId: e.payer_id,
          amount: Number(e.amount), description: e.description, date: e.created_at,
        })),
      debts: (debtsRes.data ?? [])
        .filter(d => d.group_id === g.id)
        .map(d => ({
          id: d.id, debtorId: d.debtor_id, creditorId: d.creditor_id,
          amount: Number(d.amount), status: d.status as Debt['status'],
        })),
    }));

    setGroups(assembled);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const createGroup = useCallback(
    async (name: string, location: string, memberUsernames: string[]) => {
      if (!user) return null;

      // Generate ID client-side to avoid needing .select() after insert
      const groupId = crypto.randomUUID();

      const { error: groupErr } = await supabase
        .from('groups')
        .insert({ id: groupId, name, location: location || null, owner_id: user.id });

      if (groupErr) { console.error('Group creation error:', groupErr); return null; }

      // Add creator as member first
      const { error: memberErr } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id });

      if (memberErr) { console.error('Member add error:', memberErr); }

      // Find other users by username and add them
      if (memberUsernames.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username');
        
        if (profiles) {
          const membersToAdd = memberUsernames
            .map(name => profiles.find(p => p.username.toLowerCase() === name.toLowerCase()))
            .filter(p => p && p.id !== user.id)
            .map(p => ({ group_id: groupId, user_id: p!.id }));

          if (membersToAdd.length > 0) {
            await supabase.from('group_members').insert(membersToAdd);
          }
        }
      }

      await fetchGroups();
      return { id: groupId, name };
    },
    [user, fetchGroups]
  );

  const addExpense = useCallback(
    async (groupId: string, payerId: string, amount: number, description: string) => {
      if (!user) return;
      
      await supabase.from('expenses').insert({
        group_id: groupId, payer_id: payerId, amount, description,
      });

      // Recalculate debts
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      const newExpenses = [...group.expenses, { id: '', groupId, payerId, amount, description, date: '' }];
      const newDebts = calculateDebts(group.members, newExpenses);

      // Delete old debts and insert new ones
      await supabase.from('debts').delete().eq('group_id', groupId);
      if (newDebts.length > 0) {
        await supabase.from('debts').insert(
          newDebts.map(d => ({
            group_id: groupId, debtor_id: d.debtorId, creditor_id: d.creditorId,
            amount: d.amount, status: 'pending',
          }))
        );
      }

      await fetchGroups();
    },
    [user, groups, fetchGroups]
  );

  const settleDebt = useCallback(
    async (groupId: string, debtId: string, accept: boolean) => {
      await supabase.from('debts').update({ status: accept ? 'settled' : 'rejected' }).eq('id', debtId);
      await fetchGroups();
    },
    [fetchGroups]
  );

  const deleteGroup = useCallback(
    async (groupId: string) => {
      await supabase.from('groups').delete().eq('id', groupId);
      await fetchGroups();
    },
    [fetchGroups]
  );

  return { groups, loading, createGroup, addExpense, settleDebt, deleteGroup };
}
