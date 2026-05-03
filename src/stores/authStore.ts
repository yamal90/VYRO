import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { getAppBaseUrl } from '@/lib/app-url';
import { checkRateLimit, sanitizeEmail, validatePassword } from '@/lib/security';
import { normalizeTierName } from '@/store/mappers';

interface AuthState {
  currentUser: User | null;
  isLoggedIn: boolean;
  authLoading: boolean;
  bootstrapped: boolean;
  authMode: 'login' | 'register';
}

interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (referralCode?: string) => Promise<{ success: boolean; message: string }>;
  register: (payload: { email: string; password: string; confirmPassword: string; referralCode: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  completePasswordReset: (newPassword: string, confirmPassword: string) => Promise<{ success: boolean; message: string }>;
  updateNickname: (nickname: string) => Promise<{ success: boolean; message: string }>;
  updateAvatar: (file: File) => Promise<{ success: boolean; message: string }>;
  setAuthMode: (mode: AuthState['authMode']) => void;
  setCurrentUser: (user: User | null) => void;
  hydrateFromSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const validateReferralCode = async (code: string) => {
  if (!supabase) return { valid: false, message: 'Configura Supabase' };
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, message: 'Codice obbligatorio' };
  
  const { data, error } = await supabase.rpc('validate_referral_code', { p_referral_code: normalized });
  if (error) throw error;
  
  return {
    valid: (data as { valid?: boolean })?.valid ?? false,
    message: (data as { message?: string })?.message ?? 'Codice non valido',
    code: (data as { code?: string })?.code,
    referrerId: (data as { referrer_id?: string })?.referrer_id,
  };
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    immer((set, get) => ({
      // State
      currentUser: null,
      isLoggedIn: false,
      authLoading: false,
      bootstrapped: false,
      authMode: 'login',

      // Actions
      setAuthMode: (mode) => set({ authMode: mode }),
      
      setCurrentUser: (user) => set({ 
        currentUser: user, 
        isLoggedIn: !!user,
        bootstrapped: true,
      }),

      login: async (email, password) => {
        if (!supabase) return { success: false, message: 'Configura Supabase' };
        if (!checkRateLimit('login')) {
          return { success: false, message: 'Troppi tentativi. Riprova tra un minuto.' };
        }
        set({ authLoading: true });
        try {
          const { error } = await supabase.auth.signInWithPassword({ 
            email: sanitizeEmail(email), 
            password 
          });
          if (error) throw error;
          return { success: true, message: 'Accesso completato' };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Accesso non riuscito';
          return { success: false, message };
        } finally {
          set({ authLoading: false });
        }
      },

      loginWithGoogle: async (referralCode) => {
        if (!supabase) return { success: false, message: 'Configura Supabase' };
        set({ authLoading: true });
        try {
          const normalizedReferral = String(referralCode ?? '').trim().toUpperCase();
          if (normalizedReferral) {
            const check = await validateReferralCode(normalizedReferral);
            if (!check.valid) return { success: false, message: check.message };
          }
          
          const appBaseUrl = getAppBaseUrl();
          const redirectUrl = normalizedReferral
            ? `${appBaseUrl}?ref=${encodeURIComponent(normalizedReferral)}`
            : appBaseUrl;
            
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectUrl },
          });
          if (error) throw error;
          return { success: true, message: 'Redirect a Google...' };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Accesso Google non riuscito';
          return { success: false, message };
        } finally {
          set({ authLoading: false });
        }
      },

      register: async (payload) => {
        if (!supabase) return { success: false, message: 'Configura Supabase' };
        const referralCode = payload.referralCode.trim().toUpperCase();
        if (!referralCode) return { success: false, message: 'Codice referral obbligatorio' };
        if (payload.password !== payload.confirmPassword) return { success: false, message: 'Le password non coincidono' };
        const pwCheck = validatePassword(payload.password);
        if (!pwCheck.valid) return { success: false, message: pwCheck.errors[0] };

        set({ authLoading: true });
        try {
          const referralCheck = await validateReferralCode(referralCode);
          if (!referralCheck.valid) return { success: false, message: referralCheck.message };

          const { error } = await supabase.auth.signUp({
            email: payload.email.trim().toLowerCase(),
            password: payload.password,
            options: {
              data: {
                referral_code: referralCode,
                username: payload.email.split('@')[0],
              },
            },
          });
          if (error) throw error;
          return { success: true, message: 'Registrazione completata' };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Registrazione non riuscita';
          return { success: false, message };
        } finally {
          set({ authLoading: false });
        }
      },

      logout: async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }
        set({ 
          currentUser: null, 
          isLoggedIn: false,
          bootstrapped: true,
        });
      },

      requestPasswordReset: async (email) => {
        if (!supabase) return { success: false, message: 'Configura Supabase' };
        set({ authLoading: true });
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(
            email.trim().toLowerCase(),
            { redirectTo: `${getAppBaseUrl()}?mode=reset` }
          );
          if (error) throw error;
          return { success: true, message: 'Email di reset inviata' };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Reset non riuscito';
          return { success: false, message };
        } finally {
          set({ authLoading: false });
        }
      },

      completePasswordReset: async (newPassword, confirmPassword) => {
        if (!supabase) return { success: false, message: 'Configura Supabase' };
        if (newPassword !== confirmPassword) return { success: false, message: 'Le password non coincidono' };
        const pwCheck = validatePassword(newPassword);
        if (!pwCheck.valid) return { success: false, message: pwCheck.errors[0] };

        set({ authLoading: true });
        try {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          window.history.replaceState({}, document.title, window.location.pathname);
          return { success: true, message: 'Password aggiornata' };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Aggiornamento non riuscito';
          return { success: false, message };
        } finally {
          set({ authLoading: false });
        }
      },

      updateNickname: async (nickname) => {
        const { currentUser } = get();
        if (!supabase || !currentUser) return { success: false, message: 'Non autenticato' };
        const trimmed = nickname.trim();
        if (!trimmed || trimmed.length < 2) return { success: false, message: 'Nickname non valido' };

        try {
          const { error } = await supabase
            .from('profiles')
            .update({ username: trimmed, updated_at: new Date().toISOString() })
            .eq('id', currentUser.id);
          if (error) throw error;
          
          set((state) => {
            if (state.currentUser) {
              state.currentUser.username = trimmed;
            }
          });
          return { success: true, message: 'Nickname aggiornato' };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Aggiornamento non riuscito';
          return { success: false, message };
        }
      },

      updateAvatar: async (file) => {
        const { currentUser } = get();
        if (!supabase || !currentUser) return { success: false, message: 'Non autenticato' };

        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
            .eq('id', currentUser.id);
          if (updateError) throw updateError;

          set((state) => {
            if (state.currentUser) {
              state.currentUser.avatar_url = publicUrl;
            }
          });
          return { success: true, message: 'Avatar aggiornato' };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload non riuscito';
          return { success: false, message };
        }
      },

      hydrateFromSession: async () => {
        if (!supabase) {
          set({ bootstrapped: true });
          return;
        }
        set({ authLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch full profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profile) {
              // Calculate computed fields
              const { data: portfolio } = await supabase
                .from('portfolio_entries')
                .select('allocation')
                .eq('owner_id', session.user.id);
              
              const computePower = (portfolio ?? []).reduce((s, e) => s + Number(e.allocation ?? 0), 0);
              
              // Get USDT balance
              const { data: deposits } = await supabase
                .from('deposits')
                .select('amount')
                .eq('owner_id', session.user.id)
                .in('status', ['approved', 'completed']);
              
              const { data: withdrawals } = await supabase
                .from('withdrawals')
                .select('amount')
                .eq('owner_id', session.user.id)
                .neq('status', 'rejected');
              
              const demoUsdtBalance = 
                (deposits ?? []).reduce((s, d) => s + Number(d.amount ?? 0), 0) -
                (withdrawals ?? []).reduce((s, w) => s + Number(w.amount ?? 0), 0);

              set({
                currentUser: {
                  id: profile.id,
                  email: profile.email,
                  username: profile.username,
                  role: profile.role === 'admin' ? 'admin' : 'user',
                  status: profile.account_blocked ? 'blocked' : 'active',
                  claim_eligible: Boolean(profile.claim_eligible),
                  avatar_url: profile.avatar_url,
                  tier: normalizeTierName(profile.tier),
                  vx_balance: Number(profile.balance ?? 0),
                  demo_usdt_balance: demoUsdtBalance,
                  compute_power: computePower,
                  invite_code: profile.referral_code,
                  invited_by: profile.referred_by || null,
                  streak: profile.streak ?? 0,
                  account_blocked: profile.account_blocked ?? false,
                  created_at: profile.created_at ?? profile.joined_at,
                },
                isLoggedIn: true,
                bootstrapped: true,
              });
            }
          } else {
            set({ bootstrapped: true });
          }
        } catch (err) {
          console.error('Hydration error:', err);
          set({ bootstrapped: true });
        } finally {
          set({ authLoading: false });
        }
      },

      refreshSession: async () => {
        await get().hydrateFromSession();
      },
    })),
    {
      name: 'vyro-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        authMode: state.authMode,
      }),
    }
  )
);

// Initialize auth state on load
if (typeof window !== 'undefined' && supabase) {
  useAuthStore.getState().hydrateFromSession();
  
  supabase.auth.onAuthStateChange((_event, _session) => {
    setTimeout(() => {
      useAuthStore.getState().hydrateFromSession();
    }, 0);
  });
}
