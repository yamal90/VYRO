import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GPUDevice, UserDevice } from '@/types';
import { GPU_DEVICES } from '@/store/data';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './authStore';
import type { PortfolioEntryRow } from '@/store/db-types';

interface DevicesState {
  gpuDevices: GPUDevice[];
  userDevices: UserDevice[];
  isLoading: boolean;
  error: string | null;
}

interface DevicesActions {
  loadUserDevices: (userId: string) => Promise<void>;
  activateDevice: (deviceId: string) => Promise<{ success: boolean; message: string }>;
  getLiveProduction: (deviceId: string) => number;
  getTotalProduction: () => number;
  refresh: () => Promise<void>;
}

const CYCLE_DAYS = 7;
const CYCLE_MS = CYCLE_DAYS * 24 * 60 * 60 * 1000;

export const useDevicesStore = create<DevicesState & DevicesActions>()(
  immer((set, get) => ({
    // State
    gpuDevices: GPU_DEVICES,
    userDevices: [],
    isLoading: false,
    error: null,

    // Actions
    loadUserDevices: async (userId) => {
      if (!supabase) return;
      set({ isLoading: true, error: null });
      try {
        const { data, error } = await supabase
          .from('portfolio_entries')
          .select('*')
          .eq('owner_id', userId)
          .order('position', { ascending: true });
        
        if (error) throw error;
        
        const userDevices: UserDevice[] = (data as PortfolioEntryRow[]).map((entry) => {
          const device = GPU_DEVICES.find(d => d.compute_power === Number(entry.allocation));
          return {
            id: entry.id,
            status: 'active',
            start_date: entry.last_cycle_reset_at ?? entry.created_at,
            total_generated: Number(entry.change ?? 0),
            device: device ? {
              id: device.id,
              name: entry.name,
              description: device.description,
              price: Number(entry.value),
              reward_3_days: device.reward_3_days,
              reward_7_days: Number(entry.cycle_reward),
              compute_power: Number(entry.allocation),
              active: true,
              image_url: device.image_url,
            } : null,
          };
        });
        
        set({ userDevices, isLoading: false });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Caricamento dispositivi fallito';
        set({ error: message, isLoading: false });
      }
    },

    activateDevice: async (deviceId) => {
      const { currentUser } = useAuthStore.getState();
      if (!supabase || !currentUser) return { success: false, message: 'Non autenticato' };
      
      const device = get().gpuDevices.find(d => d.id === deviceId);
      if (!device) return { success: false, message: 'Dispositivo non trovato' };
      if (currentUser.vx_balance < device.price) return { success: false, message: 'Saldo insufficiente' };

      set({ isLoading: true });
      try {
        // Deduct balance
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({ 
            balance: currentUser.vx_balance - device.price,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id);
        if (balanceError) throw balanceError;

        // Create portfolio entry
        const { error: portfolioError } = await supabase
          .from('portfolio_entries')
          .insert({
            owner_id: currentUser.id,
            name: device.name,
            allocation: device.compute_power,
            value: device.price,
            change: 0,
            cycle_reward: device.reward_7_days,
            cycle_days: CYCLE_DAYS,
            last_cycle_reset_at: new Date().toISOString(),
            position: get().userDevices.length + 1,
          });
        if (portfolioError) throw portfolioError;

        // Log activity
        await supabase.from('activity_logs').insert({
          owner_id: currentUser.id,
          type: 'device_activation',
          description: `Attivato ${device.name}`,
          amount: device.price,
        });

        // Refresh devices
        await get().loadUserDevices(currentUser.id);
        
        // Update auth store balance
        useAuthStore.getState().refreshSession();

        return { success: true, message: `${device.name} attivato con successo` };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Attivazione fallita';
        set({ error: message, isLoading: false });
        return { success: false, message };
      } finally {
        set({ isLoading: false });
      }
    },

    getLiveProduction: (deviceId) => {
      const ud = get().userDevices.find(d => d.id === deviceId);
      if (!ud || ud.status !== 'active') return 0;
      
      const cycleTarget = Number(ud.device?.reward_7_days ?? 0);
      const startMs = Date.parse(ud.start_date);
      if (cycleTarget <= 0 || !Number.isFinite(startMs) || startMs <= 0) {
        return Number(ud.total_generated ?? 0);
      }
      
      const elapsedMs = Math.max(0, Date.now() - startMs);
      const elapsedInCycleMs = elapsedMs % CYCLE_MS;
      return cycleTarget * (elapsedInCycleMs / CYCLE_MS);
    },

    getTotalProduction: () => {
      return get()
        .userDevices
        .filter(d => d.status === 'active')
        .reduce((sum, ud) => sum + get().getLiveProduction(ud.id), 0);
    },

    refresh: async () => {
      const { currentUser } = useAuthStore.getState();
      if (currentUser) {
        await get().loadUserDevices(currentUser.id);
      }
    },
  }))
);
