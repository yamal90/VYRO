import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Transaction, TeamMember, DailyClaim } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './authStore';
import type { DepositRow, WithdrawalRow, ActivityLogRow, TeamMemberRow } from '@/store/db-types';

interface TransactionsState {
  transactions: Transaction[];
  teamMembers: TeamMember[];
  dailyClaims: DailyClaim[];
  isLoading: boolean;
  error: string | null;
}

interface TransactionsActions {
  loadTransactions: (userId: string) => Promise<void>;
  loadTeamMembers: (userId: string) => Promise<void>;
  requestDeposit: (amount: number, txHash?: string) => Promise<{ success: boolean; message: string }>;
  requestWithdrawal: (amount: number, walletAddress: string) => Promise<{ success: boolean; message: string }>;
  claimDailyReward: () => Promise<{ success: boolean; message: string }>;
  refresh: () => Promise<void>;
}

export const useTransactionsStore = create<TransactionsState & TransactionsActions>()(
  immer((set, get) => ({
    // State
    transactions: [],
    teamMembers: [],
    dailyClaims: [],
    isLoading: false,
    error: null,

    // Actions
    loadTransactions: async (userId) => {
      if (!supabase) return;
      set({ isLoading: true, error: null });
      try {
        const [depositsRes, withdrawalsRes, activitiesRes] = await Promise.all([
          supabase.from('deposits').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
          supabase.from('withdrawals').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
          supabase.from('activity_logs').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
        ]);

        if (depositsRes.error) throw depositsRes.error;
        if (withdrawalsRes.error) throw withdrawalsRes.error;
        if (activitiesRes.error) throw activitiesRes.error;

        // Map to transactions
        const transactions: Transaction[] = [
          ...(depositsRes.data as DepositRow[]).map(d => ({
            id: d.id,
            amount: Number(d.amount),
            currency: d.asset,
            description: `Deposit ${d.asset}`,
            status: d.status,
            type: 'deposit' as const,
            created_at: d.created_at,
            tx_hash: d.tx_hash,
          })),
          ...(withdrawalsRes.data as WithdrawalRow[]).map(w => ({
            id: w.id,
            amount: -Number(w.amount),
            currency: 'USDT',
            description: 'Withdrawal',
            status: w.status,
            type: 'withdrawal' as const,
            created_at: w.created_at,
            tx_hash: w.tx_hash,
          })),
          ...(activitiesRes.data as ActivityLogRow[]).map(a => ({
            id: a.id,
            amount: Number(a.amount ?? 0),
            currency: '$',
            description: a.description,
            status: 'completed',
            type: 'activity' as const,
            created_at: a.created_at,
          })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        set({ transactions, isLoading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Caricamento transazioni fallito';
        set({ error: message, isLoading: false });
      }
    },

    loadTeamMembers: async (userId) => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.rpc('get_team_tree', { p_root_user_id: userId });
        if (error) throw error;
        
        const teamMembers: TeamMember[] = (data as TeamMemberRow[]).map(row => ({
          id: row.id,
          username: row.username,
          avatar_url: row.avatar_url,
          tier: row.tier,
          status: row.account_blocked ? 'blocked' : 'active',
          device_active: row.active_sub_count > 0,
          production: Number(row.contribution ?? 0),
          level: row.level ?? 1,
          created_at: row.joined ?? row.created_at,
        }));
        
        set({ teamMembers });
      } catch {
        // silently ignore team load errors
      }
    },

    requestDeposit: async (amount, txHash) => {
      const { currentUser } = useAuthStore.getState();
      if (!supabase || !currentUser) return { success: false, message: 'Non autenticato' };
      if (amount <= 0) return { success: false, message: 'Importo non valido' };

      try {
        const { data, error } = await supabase.rpc('request_deposit', {
          p_amount: amount,
          p_tx_hash: txHash?.trim() || null,
        });
        if (error) throw error;
        
        const result = data as { success: boolean; message: string };
        if (result.success) {
          await get().loadTransactions(currentUser.id);
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Richiesta deposito fallita';
        return { success: false, message };
      }
    },

    requestWithdrawal: async (amount, walletAddress) => {
      const { currentUser } = useAuthStore.getState();
      if (!supabase || !currentUser) return { success: false, message: 'Non autenticato' };
      if (amount <= 0) return { success: false, message: 'Importo non valido' };
      if (!walletAddress.trim()) return { success: false, message: 'Wallet obbligatorio' };
      if (currentUser.demo_usdt_balance < amount) return { success: false, message: 'Saldo insufficiente' };

      try {
        const { data, error } = await supabase.rpc('request_withdrawal', {
          p_amount: amount,
          p_wallet_address: walletAddress.trim(),
        });
        if (error) throw error;
        
        const result = data as { success: boolean; message: string };
        if (result.success) {
          await get().loadTransactions(currentUser.id);
          await useAuthStore.getState().refreshSession();
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Richiesta prelievo fallita';
        return { success: false, message };
      }
    },

    claimDailyReward: async () => {
      const { currentUser } = useAuthStore.getState();
      if (!supabase || !currentUser) return { success: false, message: 'Non autenticato' };
      
      try {
        const { data, error } = await supabase.rpc('claim_daily_reward');
        if (error) throw error;
        
        const result = data as { success: boolean; message: string; amount?: number };
        if (result.success) {
          await useAuthStore.getState().refreshSession();
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Claim fallito';
        return { success: false, message };
      }
    },

    refresh: async () => {
      const { currentUser } = useAuthStore.getState();
      if (currentUser) {
        await Promise.all([
          get().loadTransactions(currentUser.id),
          get().loadTeamMembers(currentUser.id),
        ]);
      }
    },
  }))
);
