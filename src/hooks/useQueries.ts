import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

// Keys
const QUERY_KEYS = {
  profile: ['profile'],
  devices: ['devices'],
  transactions: ['transactions'],
  team: ['team'],
  achievements: ['achievements'],
  stakes: ['stakes'],
  pools: ['staking-pools'],
};

// Profile
export const useProfile = () => {
  const { currentUser } = useAuthStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: async () => {
      if (!currentUser || !supabase) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Devices
export const useUserDevices = () => {
  const { currentUser } = useAuthStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.devices,
    queryFn: async () => {
      if (!currentUser || !supabase) return [];
      const { data, error } = await supabase
        .from('portfolio_entries')
        .select('*')
        .eq('owner_id', currentUser.id)
        .order('position', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Transactions
export const useTransactions = () => {
  const { currentUser } = useAuthStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.transactions,
    queryFn: async () => {
      if (!currentUser || !supabase) return [];
      
      const [deposits, withdrawals, activities] = await Promise.all([
        supabase.from('deposits').select('*').eq('owner_id', currentUser.id),
        supabase.from('withdrawals').select('*').eq('owner_id', currentUser.id),
        supabase.from('activity_logs').select('*').eq('owner_id', currentUser.id),
      ]);
      
      return { deposits, withdrawals, activities };
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 2,
  });
};

// Team
export const useTeamMembers = () => {
  const { currentUser } = useAuthStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.team,
    queryFn: async () => {
      if (!currentUser || !supabase) return [];
      const { data, error } = await supabase.rpc('get_team_tree', {
        p_root_user_id: currentUser.id,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5,
  });
};

// Achievements
export const useAchievements = () => {
  const { currentUser } = useAuthStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.achievements,
    queryFn: async () => {
      if (!currentUser || !supabase) return [];
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', currentUser.id);
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 10,
  });
};

// Staking Pools
export const useStakingPools = () => {
  return useQuery({
    queryKey: QUERY_KEYS.pools,
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('staking_pools')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// User Stakes
export const useUserStakes = () => {
  const { currentUser } = useAuthStore();
  
  return useQuery({
    queryKey: QUERY_KEYS.stakes,
    queryFn: async () => {
      if (!currentUser || !supabase) return [];
      const { data, error } = await supabase
        .from('user_stakes')
        .select('*, pool:staking_pools(*)')
        .eq('user_id', currentUser.id);
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5,
  });
};

// Mutations
export const useActivateDevice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ deviceId }: { deviceId: string }) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase.rpc('purchase_device', {
        p_device_id: deviceId,
      });
      if (error) throw error;
      const result = data as { success: boolean; message: string };
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devices });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
};

export const useStakeTokens = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ poolId, amount }: { poolId: string; amount: number }) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase.rpc('stake_tokens', {
        p_pool_id: poolId,
        p_amount: amount,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stakes });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
};

export const useClaimDaily = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!supabase) throw new Error('Supabase not configured');
      const { data, error } = await supabase.rpc('claim_daily_reward');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
    },
  });
};
