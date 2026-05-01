import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type {
  ActionResult,
  AdminLog,
  AppNotice,
  AuthMode,
  DailyClaim,
  GPUDevice,
  RegisterPayload,
  TeamMember,
  Transaction,
  User,
  UserDevice,
} from '../types';
import type {
  ActivityLogRow,
  DepositRow,
  PlatformSettingsRow,
  PortfolioEntryRow,
  ProfileRow,
  TeamMemberRow,
  WithdrawalRow,
} from './db-types';
import { GPU_DEVICES } from './data';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getAppBaseUrl } from '../lib/app-url';
import {
  makeDailyClaims,
  mapLogsToTransactions,
  mapPortfolioEntryToUserDevice,
  mapProfileToUser,
  mapTeamMember,
  randomInviteCode,
} from './mappers';

/* ────────────────────────────────────────────
   Context shape
   ──────────────────────────────────────────── */

interface AppState {
  currentUser: User | null;
  isLoggedIn: boolean;
  authMode: AuthMode;
  authLoading: boolean;
  bootstrapped: boolean;
  userDevices: UserDevice[];
  transactions: Transaction[];
  teamMembers: TeamMember[];
  dailyClaims: DailyClaim[];
  gpuDevices: GPUDevice[];
  allUsers: User[];
  adminUserDevices: UserDevice[];
  adminTransactions: Transaction[];
  adminLogs: AdminLog[];
  platformSettings: PlatformSettingsRow | null;
  balanceVisible: boolean;
  notice: AppNotice | null;
  login: (email: string, password: string) => Promise<ActionResult>;
  loginWithGoogle: (referralCode?: string) => Promise<ActionResult>;
  requestPasswordReset: (email: string) => Promise<ActionResult>;
  completePasswordReset: (newPassword: string, confirmPassword: string) => Promise<ActionResult>;
  register: (payload: RegisterPayload) => Promise<ActionResult>;
  updateNickname: (nickname: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
  setAuthMode: (mode: AuthMode) => void;
  toggleBalanceVisibility: () => void;
  activateDevice: (deviceId: string) => Promise<ActionResult>;
  claimDailyReward: () => Promise<ActionResult>;
  updateUserBalance: (userId: string, field: 'vx_balance' | 'demo_usdt_balance', amount: number) => Promise<ActionResult>;
  updateDeviceStatus: (userDeviceId: string, status: UserDevice['status']) => Promise<ActionResult>;
  blockUser: (userId: string) => Promise<ActionResult>;
  unblockUser: (userId: string) => Promise<ActionResult>;
  setUserClaimEligibility: (userId: string, enabled: boolean) => Promise<ActionResult>;
  updatePlatformSettings: (patch: Partial<PlatformSettingsRow>) => Promise<ActionResult>;
  refreshAppData: () => Promise<void>;
  pushNotice: (kind: AppNotice['kind'], message: string) => void;
  clearNotice: () => void;
}

const AppContext = createContext<AppState | null>(null);

const emptyResult = (message: string): ActionResult => ({ success: false, message });

/* ────────────────────────────────────────────
   Provider
   ──────────────────────────────────────────── */

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [dailyClaims, setDailyClaims] = useState<DailyClaim[]>([]);
  const [gpuDevices] = useState<GPUDevice[]>(GPU_DEVICES);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminUserDevices, setAdminUserDevices] = useState<UserDevice[]>([]);
  const [adminTransactions, setAdminTransactions] = useState<Transaction[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [notice, setNotice] = useState<AppNotice | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettingsRow | null>(null);

  /* ── Notices ── */

  const pushNotice = useCallback((kind: AppNotice['kind'], message: string) => {
    setNotice({ kind, message });
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  const logOperationalError = useCallback(
    async (type: string, description: string) => {
      if (!supabase || !currentUser) return;
      await supabase.from('activity_logs').insert({
        owner_id: currentUser.id,
        type: `error_${type}`,
        description,
        amount: 0,
      });
    },
    [currentUser],
  );

  /* ── Data reset ── */

  const resetData = useCallback(() => {
    setCurrentUser(null);
    setUserDevices([]);
    setTransactions([]);
    setTeamMembers([]);
    setDailyClaims([]);
    setAllUsers([]);
    setAdminUserDevices([]);
    setAdminTransactions([]);
    setAdminLogs([]);
    setPlatformSettings(null);
  }, []);

  /* ── Fetch all data for a user ── */

  const fetchAppData = useCallback(async (profileId: string, role: User['role']) => {
    if (!supabase) return null;

    const [profileRes, settingsRes, portfolioRes, teamRes, depositsRes, withdrawalsRes, activitiesRes] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single<ProfileRow>(),
        supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle<PlatformSettingsRow>(),
        supabase.from('portfolio_entries').select('*').eq('owner_id', profileId).order('position', { ascending: true }),
        supabase.from('team_members').select('*').eq('owner_id', profileId).order('created_at', { ascending: false }),
        supabase.from('deposits').select('*').eq('owner_id', profileId).order('created_at', { ascending: false }),
        supabase.from('withdrawals').select('*').eq('owner_id', profileId).order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').eq('owner_id', profileId).order('created_at', { ascending: false }),
      ]);

    if (profileRes.error) throw profileRes.error;
    if (settingsRes.error) throw settingsRes.error;
    if (portfolioRes.error) throw portfolioRes.error;
    if (teamRes.error) throw teamRes.error;
    if (depositsRes.error) throw depositsRes.error;
    if (withdrawalsRes.error) throw withdrawalsRes.error;
    if (activitiesRes.error) throw activitiesRes.error;

    const portfolio = (portfolioRes.data ?? []) as PortfolioEntryRow[];
    const deposits = (depositsRes.data ?? []) as DepositRow[];
    const withdrawals = (withdrawalsRes.data ?? []) as WithdrawalRow[];
    const activities = (activitiesRes.data ?? []) as ActivityLogRow[];

    const computePower = portfolio.reduce((sum, e) => sum + Number(e.allocation ?? 0), 0);
    const demoUsdtBalance =
      deposits.reduce((sum, r) => sum + Number(r.amount ?? 0), 0) -
      withdrawals.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
    const profile = mapProfileToUser(profileRes.data as ProfileRow, computePower, demoUsdtBalance);

    setCurrentUser(profile);
    setPlatformSettings((settingsRes.data as PlatformSettingsRow) ?? null);
    setUserDevices(portfolio.map(mapPortfolioEntryToUserDevice));
    setTransactions(mapLogsToTransactions(deposits, withdrawals, activities));
    setTeamMembers(((teamRes.data ?? []) as TeamMemberRow[]).map(mapTeamMember));
    setDailyClaims(makeDailyClaims(profileRes.data as ProfileRow));

    if (role === 'admin') {
      const [profilesAllRes, portfolioAllRes, depositsAllRes, withdrawalsAllRes, activitiesAllRes] =
        await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('portfolio_entries').select('*').order('created_at', { ascending: false }),
          supabase.from('deposits').select('*').order('created_at', { ascending: false }),
          supabase.from('withdrawals').select('*').order('created_at', { ascending: false }),
          supabase.from('activity_logs').select('*').order('created_at', { ascending: false }),
        ]);

      if (profilesAllRes.error) throw profilesAllRes.error;
      if (portfolioAllRes.error) throw portfolioAllRes.error;
      if (depositsAllRes.error) throw depositsAllRes.error;
      if (withdrawalsAllRes.error) throw withdrawalsAllRes.error;
      if (activitiesAllRes.error) throw activitiesAllRes.error;

      const allProfileRows = (profilesAllRes.data ?? []) as ProfileRow[];
      const allPortfolioRows = (portfolioAllRes.data ?? []) as PortfolioEntryRow[];
      const allDepositRows = (depositsAllRes.data ?? []) as DepositRow[];
      const allWithdrawalRows = (withdrawalsAllRes.data ?? []) as WithdrawalRow[];
      const allActivityRows = (activitiesAllRes.data ?? []) as ActivityLogRow[];

      const computeByUser = new Map<string, number>();
      for (const row of allPortfolioRows) {
        computeByUser.set(row.owner_id, (computeByUser.get(row.owner_id) ?? 0) + Number(row.allocation ?? 0));
      }
      const usdtByUser = new Map<string, number>();
      for (const row of allDepositRows) {
        usdtByUser.set(row.owner_id, (usdtByUser.get(row.owner_id) ?? 0) + Number(row.amount ?? 0));
      }
      for (const row of allWithdrawalRows) {
        usdtByUser.set(row.owner_id, (usdtByUser.get(row.owner_id) ?? 0) - Number(row.amount ?? 0));
      }

      setAllUsers(allProfileRows.map((r) => mapProfileToUser(r, computeByUser.get(r.id) ?? 0, usdtByUser.get(r.id) ?? 0)));
      setAdminUserDevices(allPortfolioRows.map(mapPortfolioEntryToUserDevice));
      setAdminTransactions(mapLogsToTransactions(allDepositRows, allWithdrawalRows, allActivityRows));
      setAdminLogs(
        allActivityRows.slice(0, 40).map((row) => ({
          id: row.id,
          admin_id: row.owner_id,
          action: row.type,
          metadata: { description: row.description, amount: row.amount ?? 0 },
          created_at: row.created_at,
        })),
      );
    } else {
      setAllUsers([]);
      setAdminUserDevices([]);
      setAdminTransactions([]);
      setAdminLogs([]);
    }

    return profile;
  }, []);

  /* ── Referral sync ── */

  const syncReferral = useCallback(async (profile: ProfileRow, referralCode: string) => {
    if (!supabase) return;
    const normalized = referralCode.trim().toUpperCase();
    if (
      !normalized ||
      normalized === profile.referral_code ||
      (profile.referred_by && profile.referred_by !== 'SYSTEM')
    ) {
      return;
    }

    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('referral_code', normalized)
      .single<ProfileRow>();

    if (referrerError || !referrer) return;

    await supabase
      .from('profiles')
      .update({ referred_by: normalized, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('owner_id', referrer.id)
      .eq('username', profile.username)
      .maybeSingle();

    if (!existingMember) {
      await supabase.from('team_members').insert({
        owner_id: referrer.id,
        username: profile.username,
        avatar_url: profile.avatar_url || '',
        tier: profile.role === 'admin' ? 'ADMIN' : 'ZYRA',
        joined: profile.joined_at,
        contribution: 0,
        active_balance: Number(profile.balance ?? 0),
        active_sub_count: 0,
        account_blocked: profile.account_blocked,
        claim_eligible: profile.claim_eligible,
        is_test_bot: false,
      });
    }

    await supabase
      .from('profiles')
      .update({ team_size: Number(referrer.team_size ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', referrer.id);
  }, []);

  /* ── Ensure profile exists on first login ── */

  const ensureProfileFromSession = useCallback(async (session: Session) => {
    if (!supabase) return null;
    const usernameFromMeta = String(
      session.user.user_metadata?.username ??
        session.user.user_metadata?.full_name ??
        session.user.email?.split('@')[0] ??
        'user',
    ).trim();
    const referralFromMeta = String(
      session.user.user_metadata?.referred_by ??
        session.user.user_metadata?.referralCode ??
        session.user.user_metadata?.referral_code ??
        '',
    )
      .trim()
      .toUpperCase();
    const referralCode = randomInviteCode();

    const insertPayload = {
      id: session.user.id,
      email: session.user.email ?? '',
      username: usernameFromMeta || 'user',
      role: 'user',
      tier: 'ZYRA',
      avatar_url: '',
      balance: 0,
      referral_code: referralCode,
      referred_by: referralFromMeta || 'SYSTEM',
      streak: 0,
      last_claim: null,
      last_claim_amount: 0,
      joined_at: new Date().toISOString(),
      team_size: 0,
      account_blocked: false,
      claim_eligible: true,
      tier_override: false,
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('profiles').insert(insertPayload);
    if (insertError && !/duplicate key|already exists/i.test(insertError.message)) {
      throw insertError;
    }

    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single<ProfileRow>();
    return data ?? null;
  }, []);

  /* ── Hydrate from session ── */

  const hydrateFromSession = useCallback(
    async (session: Session | null) => {
      if (!supabase) {
        resetData();
        setBootstrapped(true);
        return;
      }

      let effectiveSession: Session | null = session;
      if (!effectiveSession?.user) {
        const retry = await supabase.auth.getSession();
        effectiveSession = retry.data.session ?? null;
      }
      if (!effectiveSession?.user) {
        resetData();
        setBootstrapped(true);
        return;
      }

      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', effectiveSession.user.id)
        .single<ProfileRow>();
      if (error || !data) {
        try {
          data = await ensureProfileFromSession(effectiveSession);
        } catch {
          data = null;
        }
      }
      if (!data) {
        resetData();
        pushNotice('error', 'Profilo utente non disponibile. Riprova tra pochi secondi.');
        setBootstrapped(true);
        return;
      }

      const referralFromMetadata = String(
        effectiveSession.user.user_metadata?.referred_by ??
          effectiveSession.user.user_metadata?.referralCode ??
          effectiveSession.user.user_metadata?.referral_code ??
          '',
      ).trim();
      const referralFromUrl = String(new URLSearchParams(window.location.search).get('ref') ?? '').trim();
      const referralFromProfile = String(data.referred_by ?? '').trim();
      const referralForSync = referralFromMetadata || referralFromUrl || referralFromProfile;
      if (referralForSync) {
        await syncReferral(data, referralForSync);
      }

      await fetchAppData(effectiveSession.user.id, data.role === 'admin' ? 'admin' : 'user');
      setBootstrapped(true);
    },
    [ensureProfileFromSession, fetchAppData, pushNotice, resetData, syncReferral],
  );

  /* ── Bootstrap + auth listener ── */

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured || !supabase) {
      setBootstrapped(true);
      return;
    }

    const sb = supabase;
    const boot = async () => {
      setAuthLoading(true);
      try {
        const { data } = await sb.auth.getSession();
        if (active) {
          await hydrateFromSession(data.session);
        }
      } catch (err) {
        throw err;
      } finally {
        if (active) setAuthLoading(false);
      }
    };
    void boot();

    const { data: subscription } = sb.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        if (!active) return;
        setAuthLoading(true);
        void hydrateFromSession(session).finally(() => {
          if (active) setAuthLoading(false);
        });
      }, 0);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [hydrateFromSession]);

  /* ── Actions ── */

  const refreshAppData = useCallback(async () => {
    if (!supabase || !currentUser) return;
    setAuthLoading(true);
    try {
      await fetchAppData(currentUser.id, currentUser.role);
    } catch (err) {
      pushNotice('error', err instanceof Error ? err.message : 'Aggiornamento dati non riuscito');
    } finally {
      setAuthLoading(false);
    }
  }, [currentUser, fetchAppData, pushNotice]);

  const login = useCallback(
    async (email: string, password: string): Promise<ActionResult> => {
      if (!supabase) return emptyResult('Configura Supabase prima del login.');
      clearNotice();
      setAuthLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        return { success: true, message: 'Accesso completato.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Accesso non riuscito';
        pushNotice('error', message);
        return emptyResult(message);
      } finally {
        setAuthLoading(false);
      }
    },
    [clearNotice, pushNotice],
  );

  const requestPasswordReset = useCallback(
    async (email: string): Promise<ActionResult> => {
      if (!supabase) return emptyResult('Configura Supabase prima del reset password.');
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) return emptyResult('Inserisci una email valida.');
      clearNotice();
      setAuthLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${getAppBaseUrl()}?mode=reset`,
        });
        if (error) throw error;
        return { success: true, message: 'Email di reset inviata. Controlla la posta.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invio reset password non riuscito';
        pushNotice('error', message);
        return emptyResult(message);
      } finally {
        setAuthLoading(false);
      }
    },
    [clearNotice, pushNotice],
  );

  const completePasswordReset = useCallback(
    async (newPassword: string, confirmPassword: string): Promise<ActionResult> => {
      if (!supabase) return emptyResult('Configura Supabase prima del reset password.');
      if (newPassword !== confirmPassword) return emptyResult('Le password non coincidono.');
      if (newPassword.length < 8)
        return emptyResult('La password deve avere almeno 8 caratteri.');
      if (!/[A-Z]/.test(newPassword))
        return emptyResult('La password deve contenere almeno una lettera maiuscola.');
      if (!/[0-9]/.test(newPassword))
        return emptyResult('La password deve contenere almeno un numero.');
      clearNotice();
      setAuthLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        window.history.replaceState({}, document.title, window.location.pathname);
        return { success: true, message: 'Password aggiornata con successo.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Aggiornamento password non riuscito';
        pushNotice('error', message);
        return emptyResult(message);
      } finally {
        setAuthLoading(false);
      }
    },
    [clearNotice, pushNotice],
  );

  const loginWithGoogle = useCallback(
    async (referralCode?: string): Promise<ActionResult> => {
      if (!supabase) return emptyResult('Configura Supabase prima del login.');
      clearNotice();
      setAuthLoading(true);
      try {
        const normalizedReferral = String(referralCode ?? '').trim().toUpperCase();
        if (normalizedReferral) {
          const { data: referrer, error: referrerError } = await supabase
            .from('profiles')
            .select('id, account_blocked')
            .eq('referral_code', normalizedReferral)
            .maybeSingle();
          if (referrerError) throw referrerError;
          if (!referrer || referrer.account_blocked) return emptyResult('Referral code non valido.');
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
        return { success: true, message: 'Redirect a Google in corso...' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Accesso Google non riuscito';
        pushNotice('error', message);
        return emptyResult(message);
      } finally {
        setAuthLoading(false);
      }
    },
    [clearNotice, pushNotice],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<ActionResult> => {
      if (!supabase) return emptyResult('Configura Supabase prima della registrazione.');
      clearNotice();
      const referralCode = payload.referralCode.trim().toUpperCase();
      if (!referralCode) return emptyResult('Il referral code è obbligatorio.');
      if (payload.password !== payload.confirmPassword) return emptyResult('Le password non coincidono.');
      if (payload.password.length < 8) return emptyResult('La password deve avere almeno 8 caratteri.');
      if (!/[A-Z]/.test(payload.password))
        return emptyResult('La password deve contenere almeno una lettera maiuscola.');
      if (!/[0-9]/.test(payload.password))
        return emptyResult('La password deve contenere almeno un numero.');

      setAuthLoading(true);
      try {
        const { data: referrer, error: referrerError } = await supabase
          .from('profiles')
          .select('id, account_blocked')
          .eq('referral_code', referralCode)
          .maybeSingle();

        if (referrerError) throw referrerError;
        if (!referrer || referrer.account_blocked) return emptyResult('Referral code non valido.');

        const { data, error } = await supabase.auth.signUp({
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
          options: {
            emailRedirectTo: getAppBaseUrl(),
            data: {
              username: payload.username.trim(),
              referralCode,
              referral_code: referralCode,
              referred_by: referralCode,
            },
          },
        });
        if (error) throw error;

        if (data.session?.user) {
          const { data: createdProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single<ProfileRow>();
          if (createdProfile) await syncReferral(createdProfile, referralCode);
          return { success: true, message: 'Registrazione completata.' };
        }

        setAuthMode('login');
        pushNotice('success', 'Registrazione completata. Controlla la mail di conferma.');
        return { success: true, message: 'Registrazione completata. Conferma la mail.' };
      } catch (err) {
        const rawMessage = err instanceof Error ? err.message : 'Registrazione non riuscita';
        const message = /invalid referral code|referral code is required/i.test(rawMessage)
          ? 'Referral code non valido.'
          : rawMessage;
        pushNotice('error', message);
        return emptyResult(message);
      } finally {
        setAuthLoading(false);
      }
    },
    [clearNotice, pushNotice, syncReferral],
  );

  const logout = useCallback(async () => {
    if (!supabase) {
      resetData();
      return;
    }
    await supabase.auth.signOut();
    resetData();
    setAuthMode('login');
  }, [resetData]);

  const updateNickname = useCallback(
    async (nickname: string): Promise<ActionResult> => {
      if (!supabase || !currentUser) return emptyResult('Non autenticato');
      const normalized = nickname.trim();
      if (!normalized) return emptyResult('Nickname obbligatorio.');
      if (normalized.length < 3) return emptyResult('Nickname troppo corto (min 3 caratteri).');
      if (normalized.length > 24) return emptyResult('Nickname troppo lungo (max 24 caratteri).');
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ username: normalized, updated_at: new Date().toISOString() })
          .eq('id', currentUser.id);
        if (error) throw error;
        await refreshAppData();
        return { success: true, message: 'Nickname aggiornato.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Aggiornamento nickname non riuscito';
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, pushNotice, refreshAppData],
  );

  const toggleBalanceVisibility = useCallback(() => setBalanceVisible((v) => !v), []);

  const activateDevice = useCallback(
    async (deviceId: string): Promise<ActionResult> => {
      if (!supabase || !currentUser) return emptyResult('Non autenticato');
      const device = gpuDevices.find((e) => e.id === deviceId);
      if (!device) return emptyResult('Dispositivo non trovato');
      if (currentUser.vx_balance < device.price) return emptyResult('Saldo VX insufficiente');

      try {
        const { data, error } = await supabase.rpc('purchase_device', {
          p_device_id: device.id,
        });
        if (error) throw error;
        const result = data as { success: boolean; message: string };
        if (!result.success) return emptyResult(result.message);

        await refreshAppData();
        return { success: true, message: result.message };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Attivazione non riuscita';
        void logOperationalError('activate_device', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, gpuDevices, logOperationalError, pushNotice, refreshAppData],
  );

  const claimDailyReward = useCallback(async (): Promise<ActionResult> => {
    if (!supabase || !currentUser) return emptyResult('Non autenticato');

    try {
      const { data, error } = await supabase.rpc('claim_daily_reward');
      if (error) throw error;
      const result = data as { success: boolean; message: string };
      if (!result.success) return emptyResult(result.message);

      await refreshAppData();
      return { success: true, message: result.message };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Claim non riuscito';
      void logOperationalError('claim_daily', message);
      pushNotice('error', message);
      return emptyResult(message);
    }
  }, [currentUser, logOperationalError, pushNotice, refreshAppData]);

  const updateUserBalance = useCallback(
    async (userId: string, field: 'vx_balance' | 'demo_usdt_balance', amount: number): Promise<ActionResult> => {
      if (!supabase || !currentUser || currentUser.role !== 'admin') return emptyResult('Non autorizzato');
      if (field !== 'vx_balance') {
        pushNotice('info', 'Nel database reale admin modifica solo il saldo principale.');
        return emptyResult('Campo non supportato dal database attuale.');
      }
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ balance: amount, updated_at: new Date().toISOString() })
          .eq('id', userId);
        if (error) throw error;
        await refreshAppData();
        return { success: true, message: 'Saldo aggiornato.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Aggiornamento saldo non riuscito';
        void logOperationalError('admin_update_balance', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, logOperationalError, pushNotice, refreshAppData],
  );

  const updateDeviceStatus = useCallback(
    async (_userDeviceId: string, _status: UserDevice['status']): Promise<ActionResult> => {
      pushNotice('info', 'Lo schema corrente non espone stati separati dei dispositivi.');
      return emptyResult('Operazione non supportata dal database attuale.');
    },
    [pushNotice],
  );

  const blockUser = useCallback(
    async (userId: string): Promise<ActionResult> => {
      if (!supabase || !currentUser || currentUser.role !== 'admin') return emptyResult('Non autorizzato');
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ account_blocked: true, updated_at: new Date().toISOString() })
          .eq('id', userId);
        if (error) throw error;
        await refreshAppData();
        return { success: true, message: 'Utente bloccato.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Blocco utente non riuscito';
        void logOperationalError('admin_block_user', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, logOperationalError, pushNotice, refreshAppData],
  );

  const unblockUser = useCallback(
    async (userId: string): Promise<ActionResult> => {
      if (!supabase || !currentUser || currentUser.role !== 'admin') return emptyResult('Non autorizzato');
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ account_blocked: false, updated_at: new Date().toISOString() })
          .eq('id', userId);
        if (error) throw error;
        await refreshAppData();
        return { success: true, message: 'Utente sbloccato.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sblocco utente non riuscito';
        void logOperationalError('admin_unblock_user', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, logOperationalError, pushNotice, refreshAppData],
  );

  const setUserClaimEligibility = useCallback(
    async (userId: string, enabled: boolean): Promise<ActionResult> => {
      if (!supabase || !currentUser || currentUser.role !== 'admin') return emptyResult('Non autorizzato');
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ claim_eligible: enabled, updated_at: new Date().toISOString() })
          .eq('id', userId);
        if (error) throw error;
        await refreshAppData();
        return { success: true, message: enabled ? 'Claim abilitato.' : 'Claim disabilitato.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Aggiornamento claim non riuscito';
        void logOperationalError('admin_claim_eligibility', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, logOperationalError, pushNotice, refreshAppData],
  );

  const updatePlatformSettings = useCallback(
    async (patch: Partial<PlatformSettingsRow>): Promise<ActionResult> => {
      if (!supabase || !currentUser || currentUser.role !== 'admin') return emptyResult('Non autorizzato');
      if (!platformSettings) return emptyResult('Impostazioni piattaforma non disponibili.');
      try {
        const { error } = await supabase.from('platform_settings').update(patch).eq('id', platformSettings.id);
        if (error) throw error;
        await refreshAppData();
        return { success: true, message: 'Impostazioni piattaforma aggiornate.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Aggiornamento impostazioni non riuscito';
        void logOperationalError('admin_platform_settings', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, logOperationalError, platformSettings, pushNotice, refreshAppData],
  );

  /* ── Provide ── */

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isLoggedIn: Boolean(currentUser),
        authMode,
        authLoading,
        bootstrapped,
        userDevices,
        transactions,
        teamMembers,
        dailyClaims,
        gpuDevices,
        allUsers,
        adminUserDevices,
        adminTransactions,
        adminLogs,
        platformSettings,
        balanceVisible,
        notice,
        login,
        loginWithGoogle,
        requestPasswordReset,
        completePasswordReset,
        register,
        updateNickname,
        logout,
        setAuthMode,
        toggleBalanceVisibility,
        activateDevice,
        claimDailyReward,
        updateUserBalance,
        updateDeviceStatus,
        blockUser,
        unblockUser,
        setUserClaimEligibility,
        updatePlatformSettings,
        refreshAppData,
        pushNotice,
        clearNotice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
