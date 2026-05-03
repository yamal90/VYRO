import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type {
  ActionResult,
  AdminDepositRequest,
  AdminLog,
  AdminWithdrawalRequest,
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
import { checkRateLimit, sanitizeEmail, validatePassword } from '../lib/security';
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
  adminDepositRequests: AdminDepositRequest[];
  adminWithdrawalRequests: AdminWithdrawalRequest[];
  platformSettings: PlatformSettingsRow | null;
  balanceVisible: boolean;
  notice: AppNotice | null;
  login: (email: string, password: string) => Promise<ActionResult>;
  loginWithGoogle: (referralCode?: string) => Promise<ActionResult>;
  requestPasswordReset: (email: string) => Promise<ActionResult>;
  completePasswordReset: (newPassword: string, confirmPassword: string) => Promise<ActionResult>;
  register: (payload: RegisterPayload) => Promise<ActionResult>;
  updateNickname: (nickname: string) => Promise<ActionResult>;
  updateAvatar: (file: File) => Promise<ActionResult>;
  logout: () => Promise<void>;
  setAuthMode: (mode: AuthMode) => void;
  toggleBalanceVisibility: () => void;
  activateDevice: (deviceId: string) => Promise<ActionResult>;
  claimDailyReward: () => Promise<ActionResult>;
  requestDeposit: (amount: number, txHash?: string) => Promise<ActionResult>;
  requestWithdrawal: (amount: number, walletAddress: string) => Promise<ActionResult>;
  updateDepositRequestStatus: (
    depositId: string,
    status: 'pending' | 'approved' | 'completed' | 'rejected',
    txHash?: string,
  ) => Promise<ActionResult>;
  updateWithdrawalRequestStatus: (
    withdrawalId: string,
    status: 'pending' | 'approved' | 'completed' | 'rejected',
    txHash?: string,
  ) => Promise<ActionResult>;
  updateUserBalance: (userId: string, field: 'vx_balance' | 'demo_usdt_balance', amount: number) => Promise<ActionResult>;
  updateDeviceStatus: (userDeviceId: string, status: UserDevice['status']) => Promise<ActionResult>;
  assignDeviceToUser: (userId: string, deviceId: string, chargeBalance?: boolean) => Promise<ActionResult>;
  removeDeviceFromUser: (userDeviceId: string, refund?: boolean) => Promise<ActionResult>;
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
const isCompletedDeposit = (status: string | null | undefined) => status === 'approved' || status === 'completed';
const isCountedWithdrawal = (status: string | null | undefined) => status !== 'rejected';
const normalizeReferralCode = (value: unknown) => String(value ?? '').trim().toUpperCase();
const isReferralSentinel = (code: string) =>
  code === '' || code === 'SYSTEM' || code === 'NULL' || code === 'UNDEFINED';

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
  const [adminDepositRequests, setAdminDepositRequests] = useState<AdminDepositRequest[]>([]);
  const [adminWithdrawalRequests, setAdminWithdrawalRequests] = useState<AdminWithdrawalRequest[]>([]);
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
    setAdminDepositRequests([]);
    setAdminWithdrawalRequests([]);
    setPlatformSettings(null);
  }, []);

  const loadTeamMembers = useCallback(
    async (profileId: string) => {
      if (!supabase) return [] as TeamMemberRow[];

      const teamTreeRes = await supabase.rpc('get_team_tree', { p_root_user_id: profileId });
      if (!teamTreeRes.error && Array.isArray(teamTreeRes.data)) {
        return teamTreeRes.data as TeamMemberRow[];
      }

      const fallbackRes = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_id', profileId)
        .order('created_at', { ascending: false });

      if (fallbackRes.error) throw fallbackRes.error;
      return (fallbackRes.data ?? []) as TeamMemberRow[];
    },
    [],
  );

  const validateReferralCode = useCallback(
    async (rawCode: string): Promise<{ valid: boolean; normalized: string; message: string }> => {
      if (!supabase) return { valid: false, normalized: '', message: 'Configura Supabase prima della registrazione.' };
      const normalized = rawCode.trim().toUpperCase();
      if (!normalized) return { valid: false, normalized: '', message: 'Il referral code è obbligatorio.' };

      const { data, error } = await supabase.rpc('validate_referral_code', { p_referral_code: normalized });
      if (error) throw error;

      const payload = (data ?? null) as { valid?: boolean; message?: string } | null;
      if (!payload?.valid) {
        return {
          valid: false,
          normalized,
          message: payload?.message ?? 'Referral code non valido.',
        };
      }

      return { valid: true, normalized, message: 'ok' };
    },
    [],
  );

  /* ── Fetch all data for a user ── */

  const fetchAppData = useCallback(async (
    profileId: string,
    role: User['role'],
    options?: { includeAdminData?: boolean },
  ) => {
    if (!supabase) return null;

    const [profileRes, settingsRes, portfolioRes, depositsRes, withdrawalsRes, activitiesRes] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single<ProfileRow>(),
        supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle<PlatformSettingsRow>(),
        supabase.from('portfolio_entries').select('*').eq('owner_id', profileId).order('position', { ascending: true }),
        supabase.from('deposits').select('*').eq('owner_id', profileId).order('created_at', { ascending: false }),
        supabase.from('withdrawals').select('*').eq('owner_id', profileId).order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').eq('owner_id', profileId).order('created_at', { ascending: false }),
      ]);

    if (profileRes.error) throw profileRes.error;
    if (settingsRes.error) throw settingsRes.error;
    if (portfolioRes.error) throw portfolioRes.error;
    if (depositsRes.error) throw depositsRes.error;
    if (withdrawalsRes.error) throw withdrawalsRes.error;
    if (activitiesRes.error) throw activitiesRes.error;

    const portfolio = (portfolioRes.data ?? []) as PortfolioEntryRow[];
    const deposits = (depositsRes.data ?? []) as DepositRow[];
    const withdrawals = (withdrawalsRes.data ?? []) as WithdrawalRow[];
    const activities = (activitiesRes.data ?? []) as ActivityLogRow[];
    const teamRows = await loadTeamMembers(profileId);

    const computePower = portfolio.reduce((sum, e) => sum + Number(e.allocation ?? 0), 0);
    const demoUsdtBalance =
      deposits.reduce((sum, r) => (isCompletedDeposit(r.status) ? sum + Number(r.amount ?? 0) : sum), 0) -
      withdrawals.reduce((sum, r) => (isCountedWithdrawal(r.status) ? sum + Number(r.amount ?? 0) : sum), 0);
    const profile = mapProfileToUser(profileRes.data as ProfileRow, computePower, demoUsdtBalance);

    setCurrentUser(profile);
    setPlatformSettings((settingsRes.data as PlatformSettingsRow) ?? null);
    setUserDevices(portfolio.map(mapPortfolioEntryToUserDevice));
    setTransactions(mapLogsToTransactions(deposits, withdrawals, activities));
    setTeamMembers(teamRows.map(mapTeamMember));
    setDailyClaims(makeDailyClaims(profileRes.data as ProfileRow));

    const includeAdminData = Boolean(options?.includeAdminData);
    if (role === 'admin' && includeAdminData) {
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
        if (!isCompletedDeposit(row.status)) continue;
        usdtByUser.set(row.owner_id, (usdtByUser.get(row.owner_id) ?? 0) + Number(row.amount ?? 0));
      }
      for (const row of allWithdrawalRows) {
        if (!isCountedWithdrawal(row.status)) continue;
        usdtByUser.set(row.owner_id, (usdtByUser.get(row.owner_id) ?? 0) - Number(row.amount ?? 0));
      }

      setAllUsers(allProfileRows.map((r) => mapProfileToUser(r, computeByUser.get(r.id) ?? 0, usdtByUser.get(r.id) ?? 0)));
      setAdminUserDevices(allPortfolioRows.map(mapPortfolioEntryToUserDevice));
      setAdminTransactions(mapLogsToTransactions(allDepositRows, allWithdrawalRows, allActivityRows));
      const profileById = new Map(allProfileRows.map((row) => [row.id, row]));
      setAdminDepositRequests(
        allDepositRows.map((row) => ({
          id: row.id,
          owner_id: row.owner_id,
          username: profileById.get(row.owner_id)?.username ?? 'unknown',
          email: profileById.get(row.owner_id)?.email ?? '',
          amount: Number(row.amount ?? 0),
          asset: row.asset,
          network: row.network,
          tx_hash: row.tx_hash,
          status: row.status as AdminDepositRequest['status'],
          created_at: row.created_at,
        })),
      );
      setAdminWithdrawalRequests(
        allWithdrawalRows.map((row) => ({
          id: row.id,
          owner_id: row.owner_id,
          username: profileById.get(row.owner_id)?.username ?? 'unknown',
          email: profileById.get(row.owner_id)?.email ?? '',
          amount: Number(row.amount ?? 0),
          wallet_address: row.wallet_address,
          tx_hash: row.tx_hash,
          status: row.status as AdminWithdrawalRequest['status'],
          created_at: row.created_at,
        })),
      );
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
      setAdminDepositRequests([]);
      setAdminWithdrawalRequests([]);
    }

    return profile;
  }, [loadTeamMembers]);

  /* ── Referral sync ── */

  const syncReferral = useCallback(async (profile: ProfileRow, referralCode: string) => {
    if (!supabase) return;
    const normalized = normalizeReferralCode(referralCode);
    const referredBy = normalizeReferralCode(profile.referred_by);
    if (
      isReferralSentinel(normalized) ||
      normalized === profile.referral_code ||
      normalized === referredBy ||
      (!isReferralSentinel(referredBy) && referredBy !== normalized)
    ) {
      return;
    }
    const { data, error } = await supabase.rpc('apply_referral_link', {
      p_referral_code: normalized,
      p_target_user_id: profile.id,
    });
    if (error) throw error;
    const result = data as { success?: boolean; message?: string } | null;
    if (result?.success === false) {
      throw new Error(result.message ?? 'Sync referral non riuscito.');
    }
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
      try {
        if (!supabase) {
          resetData();
          return;
        }

        let effectiveSession: Session | null = session;
        if (!effectiveSession?.user) {
          const retry = await supabase.auth.getSession();
          effectiveSession = retry.data.session ?? null;
        }
        if (!effectiveSession?.user) {
          resetData();
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', effectiveSession.user.id)
          .single<ProfileRow>();
        let data = profileData;
        if (profileError || !data) {
          try {
            data = await ensureProfileFromSession(effectiveSession);
          } catch {
            data = null;
          }
        }
        if (!data) {
          resetData();
          pushNotice('error', 'Profilo utente non disponibile. Riprova tra pochi secondi.');
          return;
        }

        const referralFromMetadata = normalizeReferralCode(
          effectiveSession.user.user_metadata?.referred_by ??
            effectiveSession.user.user_metadata?.referralCode ??
            effectiveSession.user.user_metadata?.referral_code ??
            '',
        );
        const referralFromUrl = normalizeReferralCode(new URLSearchParams(window.location.search).get('ref') ?? '');
        const referralFromProfile = normalizeReferralCode(data.referred_by ?? '');
        const referralForSync = referralFromMetadata || referralFromUrl || referralFromProfile;
        if (!isReferralSentinel(referralForSync)) {
          await syncReferral(data, referralForSync);
        }

        await fetchAppData(effectiveSession.user.id, data.role === 'admin' ? 'admin' : 'user', {
          includeAdminData: window.location.pathname.startsWith('/admin'),
        });
      } catch (err) {
        resetData();
        pushNotice(
          'error',
          err instanceof Error ? `Errore connessione account: ${err.message}` : 'Errore connessione account.',
        );
      } finally {
        setBootstrapped(true);
      }
    },
    [ensureProfileFromSession, fetchAppData, pushNotice, resetData, syncReferral],
  );

  /* ── Bootstrap + auth listener ── */

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured || !supabase) {
      setBootstrapped(true); // eslint-disable-line react-hooks/set-state-in-effect -- bootstrap init
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
        if (active) {
          resetData();
          setBootstrapped(true);
          pushNotice(
            'error',
            err instanceof Error ? `Errore iniziale connessione: ${err.message}` : 'Errore iniziale connessione.',
          );
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrateFromSession]);

  /* ── Actions ── */

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const refreshAppData = useCallback(async () => {
    if (!supabase || !currentUser?.id || !currentUser?.role) return;
    const currentUserId = currentUser.id;
    const currentUserRole = currentUser.role;
    setAuthLoading(true);
    try {
      await fetchAppData(currentUserId, currentUserRole, {
        includeAdminData: window.location.pathname.startsWith('/admin'),
      });
    } catch (err) {
      pushNotice('error', err instanceof Error ? err.message : 'Aggiornamento dati non riuscito');
    } finally {
      setAuthLoading(false);
    }
  }, [currentUser?.id, currentUser?.role, fetchAppData, pushNotice]);

  const login = useCallback(
    async (email: string, password: string): Promise<ActionResult> => {
      if (!supabase) return emptyResult('Configura Supabase prima del login.');
      if (!checkRateLimit('login')) {
        return emptyResult('Troppi tentativi di accesso. Riprova tra un minuto.');
      }
      clearNotice();
      setAuthLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: sanitizeEmail(email), password });
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
      if (!checkRateLimit('password_reset')) {
        return emptyResult('Troppi tentativi. Riprova tra un minuto.');
      }
      const normalizedEmail = sanitizeEmail(email);
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
      const pwCheck = validatePassword(newPassword);
      if (!pwCheck.valid) return emptyResult(pwCheck.errors[0]);
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
          const referralCheck = await validateReferralCode(normalizedReferral);
          if (!referralCheck.valid) return emptyResult(referralCheck.message);
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
    [clearNotice, pushNotice, validateReferralCode],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<ActionResult> => {
      if (!supabase) return emptyResult('Configura Supabase prima della registrazione.');
      clearNotice();

      // Block disposable / temporary email providers
      const emailDomain = payload.email.trim().toLowerCase().split('@')[1] ?? '';
      const blockedDomains = [
        'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
        'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
        'dispostable.com', 'trashmail.com', 'mailnesia.com', 'maildrop.cc',
        'fakeinbox.com', 'tempail.com', 'temp-mail.org', 'emailondeck.com',
        'getnada.com', 'mohmal.com', 'burnermail.io', 'inboxkitten.com',
        'minutemail.com', '10minutemail.com', 'tempr.email', 'discard.email',
        'mailsac.com', 'harakirimail.com', 'tmail.ws', 'tmpmail.net',
        'tmpmail.org', 'bupmail.com', 'mailcatch.com', 'trashmail.net',
      ];
      if (blockedDomains.includes(emailDomain)) {
        return emptyResult('Email temporanee non sono consentite. Usa un indirizzo email reale.');
      }

      const referralCode = payload.referralCode.trim().toUpperCase();
      if (!referralCode) return emptyResult('Il referral code è obbligatorio.');
      if (payload.password !== payload.confirmPassword) return emptyResult('Le password non coincidono.');
      const pwValidation = validatePassword(payload.password);
      if (!pwValidation.valid) return emptyResult(pwValidation.errors[0]);

      setAuthLoading(true);
      try {
        const referralCheck = await validateReferralCode(referralCode);
        if (!referralCheck.valid) return emptyResult(referralCheck.message);

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
    [clearNotice, pushNotice, syncReferral, validateReferralCode],
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

  const updateAvatar = useCallback(
    async (file: File): Promise<ActionResult> => {
      if (!supabase || !currentUser) return emptyResult('Non autenticato');
      if (!file) return emptyResult('Seleziona un file immagine.');
      if (!file.type.startsWith('image/')) return emptyResult('Formato non valido. Usa un file immagine.');
      const maxBytes = 5 * 1024 * 1024;
      if (file.size > maxBytes) return emptyResult('Immagine troppo grande (max 5MB).');

      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
      const objectPath = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${safeExt}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(objectPath, file, { upsert: true, cacheControl: '3600' });
        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(objectPath);
        const avatarUrl = publicData.publicUrl;
        if (!avatarUrl) return emptyResult('Upload completato ma URL avatar non disponibile.');

        const { error: profileError } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
          .eq('id', currentUser.id);
        if (profileError) throw profileError;

        await refreshAppData();
        return { success: true, message: 'Avatar aggiornato.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Aggiornamento avatar non riuscito';
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
      if (currentUser.vx_balance < device.price) return emptyResult('Saldo Dollaro insufficiente');

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

  const requestDeposit = useCallback(
    async (amount: number, txHash?: string): Promise<ActionResult> => {
      if (!supabase || !currentUser) return emptyResult('Non autenticato');
      const normalizedAmount = Number(amount);
      const normalizedTxHash = String(txHash ?? '').trim();
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return emptyResult('Importo deposito non valido.');
      }
      if (platformSettings?.deposits_enabled === false) {
        return emptyResult('Depositi disabilitati.');
      }
      if (Number(platformSettings?.min_deposit ?? 0) > 0 && normalizedAmount < Number(platformSettings?.min_deposit ?? 0)) {
        return emptyResult(`Importo minimo deposito: ${Number(platformSettings?.min_deposit ?? 0).toFixed(2)}.`);
      }

      try {
        const { data, error } = await supabase.rpc('request_deposit', {
          p_amount: normalizedAmount,
          p_tx_hash: normalizedTxHash || null,
        });
        if (error) throw error;
        const result = data as { success: boolean; message: string };
        if (!result.success) return emptyResult(result.message);
        await refreshAppData();
        return { success: true, message: result.message };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Richiesta deposito non riuscita';
        void logOperationalError('request_deposit', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, logOperationalError, platformSettings, pushNotice, refreshAppData],
  );

  const requestWithdrawal = useCallback(
    async (amount: number, walletAddress: string): Promise<ActionResult> => {
      if (!supabase || !currentUser) return emptyResult('Non autenticato');
      const normalizedAmount = Number(amount);
      const normalizedWallet = String(walletAddress ?? '').trim();
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return emptyResult('Importo prelievo non valido.');
      }
      if (!normalizedWallet) {
        return emptyResult('Indirizzo wallet obbligatorio.');
      }
      if (normalizedWallet.length < 20) {
        return emptyResult('Indirizzo wallet non valido.');
      }
      if (platformSettings?.withdrawals_enabled === false) {
        return emptyResult('Prelievi disabilitati.');
      }
      if (Number(platformSettings?.min_withdraw ?? 0) > 0 && normalizedAmount < Number(platformSettings?.min_withdraw ?? 0)) {
        return emptyResult(`Importo minimo prelievo: ${Number(platformSettings?.min_withdraw ?? 0).toFixed(2)}.`);
      }
      if (currentUser.demo_usdt_balance < normalizedAmount) {
        return emptyResult('Saldo USDT insufficiente.');
      }

      try {
        const { data, error } = await supabase.rpc('request_withdrawal', {
          p_amount: normalizedAmount,
          p_wallet_address: normalizedWallet,
        });
        if (error) throw error;
        const result = data as { success: boolean; message: string };
        if (!result.success) return emptyResult(result.message);
        await refreshAppData();
        return { success: true, message: result.message };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Richiesta prelievo non riuscita';
        void logOperationalError('request_withdrawal', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, logOperationalError, platformSettings, pushNotice, refreshAppData],
  );

  const updateDepositRequestStatus = useCallback(
    async (
      depositId: string,
      status: 'pending' | 'approved' | 'completed' | 'rejected',
      txHash?: string,
    ): Promise<ActionResult> => {
      if (!supabase || !currentUser || currentUser.role !== 'admin') return emptyResult('Non autorizzato');
      const normalizedStatus = String(status).trim().toLowerCase();
      if (!['pending', 'approved', 'completed', 'rejected'].includes(normalizedStatus)) {
        return emptyResult('Stato deposito non valido.');
      }
      try {
        const { data, error } = await supabase.rpc('admin_manage_deposit', {
          p_deposit_id: depositId,
          p_status: normalizedStatus,
          p_tx_hash: String(txHash ?? '').trim() || null,
        });
        if (error) throw error;
        const result = data as { success?: boolean; message?: string } | null;
        if (!result?.success) return emptyResult(result?.message ?? 'Aggiornamento deposito non riuscito.');
        await refreshAppData();
        return { success: true, message: result.message ?? 'Deposito aggiornato.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Aggiornamento deposito non riuscito';
        void logOperationalError('admin_manage_deposit', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, logOperationalError, pushNotice, refreshAppData],
  );

  const updateWithdrawalRequestStatus = useCallback(
    async (
      withdrawalId: string,
      status: 'pending' | 'approved' | 'completed' | 'rejected',
      txHash?: string,
    ): Promise<ActionResult> => {
      if (!supabase || !currentUser || currentUser.role !== 'admin') return emptyResult('Non autorizzato');
      const normalizedStatus = String(status).trim().toLowerCase();
      if (!['pending', 'approved', 'completed', 'rejected'].includes(normalizedStatus)) {
        return emptyResult('Stato prelievo non valido.');
      }
      try {
        const { data, error } = await supabase.rpc('admin_manage_withdrawal', {
          p_withdrawal_id: withdrawalId,
          p_status: normalizedStatus,
          p_tx_hash: String(txHash ?? '').trim() || null,
        });
        if (error) throw error;
        const result = data as { success?: boolean; message?: string } | null;
        if (!result?.success) return emptyResult(result?.message ?? 'Aggiornamento prelievo non riuscito.');
        await refreshAppData();
        return { success: true, message: result.message ?? 'Prelievo aggiornato.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Aggiornamento prelievo non riuscito';
        void logOperationalError('admin_manage_withdrawal', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, logOperationalError, pushNotice, refreshAppData],
  );

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

  const assignDeviceToUser = useCallback(
    async (userId: string, deviceId: string, chargeBalance = false): Promise<ActionResult> => {
      if (!supabase || !currentUser || currentUser.role !== 'admin') return emptyResult('Non autorizzato');
      const normalizedUserId = String(userId ?? '').trim();
      const normalizedDeviceId = String(deviceId ?? '').trim();
      if (!normalizedUserId) return emptyResult('Utente non valido.');
      if (!normalizedDeviceId) return emptyResult('Dispositivo non valido.');

      try {
        const { data, error } = await supabase.rpc('admin_assign_device_to_user', {
          p_user_id: normalizedUserId,
          p_device_id: normalizedDeviceId,
          p_charge_balance: Boolean(chargeBalance),
        });
        if (error) throw error;
        const result = data as { success?: boolean; message?: string } | null;
        if (!result?.success) return emptyResult(result?.message ?? 'Assegnazione dispositivo non riuscita.');
        await refreshAppData();
        return { success: true, message: result.message ?? 'Dispositivo assegnato.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Assegnazione dispositivo non riuscita';
        void logOperationalError('admin_assign_device', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, logOperationalError, pushNotice, refreshAppData],
  );

  const removeDeviceFromUser = useCallback(
    async (userDeviceId: string, refund = false): Promise<ActionResult> => {
      if (!supabase || !currentUser || currentUser.role !== 'admin') return emptyResult('Non autorizzato');
      const normalizedEntryId = String(userDeviceId ?? '').trim();
      if (!normalizedEntryId) return emptyResult('Dispositivo utente non valido.');

      try {
        const { data, error } = await supabase.rpc('admin_remove_user_device', {
          p_entry_id: normalizedEntryId,
          p_refund: Boolean(refund),
        });
        if (error) throw error;
        const result = data as { success?: boolean; message?: string } | null;
        if (!result?.success) return emptyResult(result?.message ?? 'Rimozione dispositivo non riuscita.');
        await refreshAppData();
        return { success: true, message: result.message ?? 'Dispositivo rimosso.' };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Rimozione dispositivo non riuscita';
        void logOperationalError('admin_remove_device', message);
        pushNotice('error', message);
        return emptyResult(message);
      }
    },
    [currentUser, logOperationalError, pushNotice, refreshAppData],
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
        adminDepositRequests,
        adminWithdrawalRequests,
        platformSettings,
        balanceVisible,
        notice,
        login,
        loginWithGoogle,
        requestPasswordReset,
        completePasswordReset,
        register,
        updateNickname,
        updateAvatar,
        logout,
        setAuthMode,
        toggleBalanceVisibility,
        activateDevice,
        claimDailyReward,
        requestDeposit,
        requestWithdrawal,
        updateDepositRequestStatus,
        updateWithdrawalRequestStatus,
        updateUserBalance,
        updateDeviceStatus,
        assignDeviceToUser,
        removeDeviceFromUser,
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
