import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type {
  ActionResult,
  AdminLog,
  AppNotice,
  AuthMode,
  DailyClaim,
  GPUDevice,
  Page,
  RegisterPayload,
  TeamMember,
  Transaction,
  User,
  UserDevice,
} from '../types';
import { GPU_DEVICES } from './data';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AppState {
  currentUser: User | null;
  isLoggedIn: boolean;
  currentPage: Page;
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
  balanceVisible: boolean;
  notice: AppNotice | null;
  login: (email: string, password: string) => Promise<ActionResult>;
  register: (payload: RegisterPayload) => Promise<ActionResult>;
  updateNickname: (nickname: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
  setPage: (page: Page) => void;
  setAuthMode: (mode: AuthMode) => void;
  toggleBalanceVisibility: () => void;
  activateDevice: (deviceId: string) => Promise<ActionResult>;
  claimDailyReward: () => Promise<ActionResult>;
  updateUserBalance: (userId: string, field: 'vx_balance' | 'demo_usdt_balance', amount: number) => Promise<ActionResult>;
  updateDeviceStatus: (userDeviceId: string, status: UserDevice['status']) => Promise<ActionResult>;
  blockUser: (userId: string) => Promise<ActionResult>;
  refreshAppData: () => Promise<void>;
  pushNotice: (kind: AppNotice['kind'], message: string) => void;
  clearNotice: () => void;
}

type ProfileRow = {
  id: string;
  email: string;
  username: string;
  role: string;
  avatar_url: string | null;
  tier: string;
  balance: number;
  referral_code: string;
  referred_by: string | null;
  streak: number;
  last_claim: string | null;
  last_claim_amount: number;
  joined_at: string;
  team_size: number;
  account_blocked: boolean;
  claim_eligible: boolean;
  created_at: string;
  updated_at: string;
  tier_override: boolean;
};

type TeamMemberRow = {
  id: string;
  owner_id: string;
  username: string;
  avatar_url: string | null;
  tier: string;
  joined: string;
  contribution: number;
  active_balance: number;
  active_sub_count: number;
  account_blocked: boolean;
  claim_eligible: boolean;
  created_at: string;
  updated_at: string;
  is_test_bot: boolean;
  expires_at: string | null;
};

type PortfolioEntryRow = {
  id: string;
  owner_id: string;
  name: string;
  allocation: number;
  value: number;
  change: number;
  position: number;
  created_at: string;
  updated_at: string;
};

type DepositRow = {
  id: string;
  owner_id: string;
  amount: number;
  asset: string;
  network: string;
  tx_hash: string | null;
  status: string;
  created_at: string;
};

type WithdrawalRow = {
  id: string;
  owner_id: string;
  amount: number;
  tx_hash: string | null;
  status: string;
  created_at: string;
  wallet_address: string | null;
};

type ActivityLogRow = {
  id: string;
  owner_id: string;
  type: string;
  description: string;
  amount: number | null;
  created_at: string;
};

type PlatformSettingsRow = {
  id: number;
  maintenance_mode: boolean;
  deposits_enabled: boolean;
  withdrawals_enabled: boolean;
  daily_claim_enabled: boolean;
  min_deposit: number;
  min_withdraw: number;
  deposit_asset: string;
  deposit_network: string;
  deposit_address: string;
};

const AppContext = createContext<AppState | null>(null);

const emptyResult = (message: string): ActionResult => ({ success: false, message });

const mapProfileToUser = (
  profile: ProfileRow,
  computePower: number,
  demoUsdtBalance: number,
): User => ({
  id: profile.id,
  username: profile.username,
  email: profile.email,
  invite_code: profile.referral_code,
  invited_by: profile.referred_by || null,
  role: profile.role === 'admin' ? 'admin' : 'user',
  status: profile.account_blocked ? 'blocked' : 'active',
  vx_balance: Number(profile.balance ?? 0),
  demo_usdt_balance: demoUsdtBalance,
  compute_power: computePower,
  avatar_url: profile.avatar_url || undefined,
  created_at: profile.created_at || profile.joined_at,
});

const mapTeamMember = (row: TeamMemberRow, index: number): TeamMember => ({
  id: row.id,
  user_id: row.id,
  username: row.username,
  created_at: row.joined || row.created_at,
  device_active: row.active_sub_count > 0 || row.active_balance > 0,
  production: Number(row.contribution ?? 0),
  status: row.account_blocked ? 'inactive' : 'active',
  level: index % 2 === 0 ? 1 : 2,
});

const LEGACY_DEVICE_NAME_MAP: Record<string, string> = {
  'X-120': 'Intel Core i3-12100',
  'G-88': 'Intel Core i5-12400F',
  'G-100': 'AMD Ryzen 5 5600',
  'G-700': 'Intel Core i5-13400F',
  'G-900': 'AMD Ryzen 5 7600',
  'X-5700': 'Intel Core i7-13700KF',
  'X-7900': 'AMD Ryzen 7 7800X3D',
  'X-8900': 'Intel Core i9-14900K',
  'IX-9900': 'AMD Ryzen 9 7950X3D',
};

const computeGeneratedValue = (entry: PortfolioEntryRow, fallbackWeekly: number) => {
  const persisted = Number(entry.change ?? 0);
  if (persisted > 0) return persisted;

  const weekly = Math.max(Number(fallbackWeekly ?? 0), 0);
  if (weekly <= 0) return 0;

  const createdAt = new Date(entry.created_at).getTime();
  if (!Number.isFinite(createdAt) || createdAt <= 0) return 0;
  const elapsedHours = Math.max(0, (Date.now() - createdAt) / 36e5);
  const hourlyRate = weekly / (7 * 24);
  return Number((hourlyRate * elapsedHours).toFixed(2));
};

const mapPortfolioEntryToUserDevice = (entry: PortfolioEntryRow): UserDevice => {
  const normalizedName = LEGACY_DEVICE_NAME_MAP[entry.name] ?? entry.name;
  const matchingDevice = GPU_DEVICES.find((device) => device.name === normalizedName || device.name === entry.name) ?? {
    id: `portfolio-${entry.id}`,
    name: normalizedName,
    price: Number(entry.value ?? 0),
    reward_3_days: Number((entry.change ?? 0) * 0.42),
    reward_7_days: Number(entry.change ?? 0),
    compute_power: Math.max(1, Math.round(Number(entry.allocation ?? 0))),
    image_url: undefined,
    active: true,
  };

  return {
    id: entry.id,
    user_id: entry.owner_id,
    device_id: matchingDevice.id,
    device: matchingDevice,
    status: 'active',
    start_date: entry.created_at,
    end_date: null,
    total_generated: computeGeneratedValue(entry, matchingDevice.reward_7_days),
    created_at: entry.created_at,
  };
};

const mapLogsToTransactions = (
  deposits: DepositRow[],
  withdrawals: WithdrawalRow[],
  activities: ActivityLogRow[],
): Transaction[] => {
  const depositTransactions: Transaction[] = deposits.map((row) => ({
    id: row.id,
    user_id: row.owner_id,
    type: 'deposit',
    amount: Number(row.amount ?? 0),
    currency: row.asset === 'USDT' ? 'USDT' : 'VX',
    status: row.status === 'approved' || row.status === 'completed' ? 'completed' : row.status === 'rejected' ? 'rejected' : 'pending',
    description: `Deposito ${row.asset} ${row.network}`,
    created_at: row.created_at,
  }));

  const withdrawalTransactions: Transaction[] = withdrawals.map((row) => ({
    id: row.id,
    user_id: row.owner_id,
    type: 'withdrawal',
    amount: -Math.abs(Number(row.amount ?? 0)),
    currency: 'USDT',
    status: row.status === 'approved' || row.status === 'completed' ? 'completed' : row.status === 'rejected' ? 'rejected' : 'pending',
    description: row.wallet_address ? `Prelievo verso ${row.wallet_address}` : 'Richiesta prelievo',
    created_at: row.created_at,
  }));

  const activityTransactions: Transaction[] = activities.map((row) => {
    let type: Transaction['type'] = 'login_bonus';
    let currency: Transaction['currency'] = 'VX';
    if (row.type.includes('deposit')) type = 'deposit';
    else if (row.type.includes('withdraw')) {
      type = 'withdrawal';
      currency = 'USDT';
    } else if (row.type.includes('claim')) type = 'daily_claim';
    else if (row.type.includes('team')) type = 'team_bonus';
    else if (row.type.includes('purchase') || row.type.includes('device')) type = 'device_purchase';
    else if (row.type.includes('reward') || row.type.includes('yield')) type = 'device_reward';

    return {
      id: row.id,
      user_id: row.owner_id,
      type,
      amount: Number(row.amount ?? 0),
      currency,
      status: 'completed',
      description: row.description,
      created_at: row.created_at,
    };
  });

  return [...activityTransactions, ...depositTransactions, ...withdrawalTransactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
};

const makeDailyClaims = (profile: ProfileRow): DailyClaim[] => {
  if (!profile.last_claim) {
    return [];
  }

  return [
    {
      id: `${profile.id}-last-claim`,
      user_id: profile.id,
      amount: Number(profile.last_claim_amount ?? 0),
      claim_date: profile.last_claim.slice(0, 10),
      created_at: profile.last_claim,
    },
  ];
};

const randomInviteCode = () => `VYRO-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('login');
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

  const pushNotice = useCallback((kind: AppNotice['kind'], message: string) => {
    setNotice({ kind, message });
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);

  const resetData = useCallback(() => {
    setCurrentUser(null);
    setCurrentPage('login');
    setUserDevices([]);
    setTransactions([]);
    setTeamMembers([]);
    setDailyClaims([]);
    setAllUsers([]);
    setAdminUserDevices([]);
    setAdminTransactions([]);
    setAdminLogs([]);
  }, []);

  const fetchAppData = useCallback(async (profileId: string, role: User['role']) => {
    if (!supabase) return null;

    const [
      profileRes,
      settingsRes,
      portfolioRes,
      teamRes,
      depositsRes,
      withdrawalsRes,
      activitiesRes,
    ] = await Promise.all([
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

    const computePower = portfolio.reduce((sum, entry) => sum + Number(entry.allocation ?? 0), 0);
    const demoUsdtBalance =
      deposits.reduce((sum, row) => sum + Number(row.amount ?? 0), 0) -
      withdrawals.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    const profile = mapProfileToUser(profileRes.data as ProfileRow, computePower, demoUsdtBalance);

    setCurrentUser(profile);
    setPlatformSettings((settingsRes.data as PlatformSettingsRow) ?? null);
    setUserDevices(portfolio.map(mapPortfolioEntryToUserDevice));
    setTransactions(mapLogsToTransactions(deposits, withdrawals, activities));
    setTeamMembers(((teamRes.data ?? []) as TeamMemberRow[]).map(mapTeamMember));
    setDailyClaims(makeDailyClaims(profileRes.data as ProfileRow));

    if (role === 'admin') {
      const [profilesAllRes, portfolioAllRes, depositsAllRes, withdrawalsAllRes, activitiesAllRes] = await Promise.all([
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

      setAllUsers(
        allProfileRows.map((row) =>
          mapProfileToUser(row, computeByUser.get(row.id) ?? 0, usdtByUser.get(row.id) ?? 0),
        ),
      );
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

  const syncReferral = useCallback(async (profile: ProfileRow, referralCode: string) => {
    if (!supabase) return;
    const normalized = referralCode.trim().toUpperCase();
    if (!normalized || normalized === profile.referral_code || profile.referred_by) return;

    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('referral_code', normalized)
      .single<ProfileRow>();

    if (referrerError || !referrer) return;

    await supabase
      .from('profiles')
      .update({
        referred_by: normalized,
        updated_at: new Date().toISOString(),
      })
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
      .update({
        team_size: Number(referrer.team_size ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', referrer.id);
  }, []);

  const hydrateFromSession = useCallback(async (session: Session | null) => {
    if (!supabase || !session?.user) {
      resetData();
      setBootstrapped(true);
      return;
    }

    const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single<ProfileRow>();
    if (error || !data) {
      resetData();
      pushNotice('error', 'Profilo utente non trovato su Supabase.');
      setBootstrapped(true);
      return;
    }

    const referralFromMetadata = String(session.user.user_metadata?.referralCode ?? session.user.user_metadata?.referral_code ?? '').trim();
    if (referralFromMetadata) {
      await syncReferral(data, referralFromMetadata);
    }

    await fetchAppData(session.user.id, data.role === 'admin' ? 'admin' : 'user');
    setCurrentPage('home');
    setBootstrapped(true);
  }, [fetchAppData, pushNotice, resetData, syncReferral]);

  useEffect(() => {
    let active = true;
    if (!isSupabaseConfigured || !supabase) {
      setBootstrapped(true);
      return;
    }

    const boot = async () => {
      setAuthLoading(true);
      const { data } = await supabase.auth.getSession();
      if (active) {
        await hydrateFromSession(data.session);
        setAuthLoading(false);
      }
    };
    void boot();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const refreshAppData = useCallback(async () => {
    if (!supabase || !currentUser) return;
    setAuthLoading(true);
    try {
      await fetchAppData(currentUser.id, currentUser.role);
    } catch (error) {
      pushNotice('error', error instanceof Error ? error.message : 'Aggiornamento dati non riuscito');
    } finally {
      setAuthLoading(false);
    }
  }, [currentUser, fetchAppData, pushNotice]);

  const login = useCallback(async (email: string, password: string): Promise<ActionResult> => {
    if (!supabase) return emptyResult('Configura Supabase prima del login.');
    clearNotice();
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      return { success: true, message: 'Accesso completato.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Accesso non riuscito';
      pushNotice('error', message);
      return emptyResult(message);
    } finally {
      setAuthLoading(false);
    }
  }, [clearNotice, pushNotice]);

  const register = useCallback(async (payload: RegisterPayload): Promise<ActionResult> => {
    if (!supabase) return emptyResult('Configura Supabase prima della registrazione.');
    clearNotice();
    const referralCode = payload.referralCode.trim().toUpperCase();
    if (!referralCode) return emptyResult('Il referral code è obbligatorio.');
    if (payload.password !== payload.confirmPassword) return emptyResult('Le password non coincidono.');
    if (payload.password.length < 6) return emptyResult('La password deve avere almeno 6 caratteri.');

    setAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            username: payload.username.trim(),
            referralCode,
            referral_code: referralCode,
          },
        },
      });
      if (error) throw error;

      if (data.session?.user) {
        const { data: createdProfile } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single<ProfileRow>();
        if (createdProfile) {
          await syncReferral(createdProfile, referralCode);
        }
        return { success: true, message: 'Registrazione completata.' };
      }

      setAuthMode('login');
      pushNotice('success', 'Registrazione completata. Controlla la mail di conferma.');
      return { success: true, message: 'Registrazione completata. Conferma la mail.' };
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Registrazione non riuscita';
      const message = /invalid referral code|referral code is required/i.test(rawMessage)
        ? 'Referral code non valido.'
        : rawMessage;
      pushNotice('error', message);
      return emptyResult(message);
    } finally {
      setAuthLoading(false);
    }
  }, [clearNotice, pushNotice, syncReferral]);

  const logout = useCallback(async () => {
    if (!supabase) {
      resetData();
      return;
    }
    await supabase.auth.signOut();
    resetData();
    setAuthMode('login');
  }, [resetData]);

  const updateNickname = useCallback(async (nickname: string): Promise<ActionResult> => {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Aggiornamento nickname non riuscito';
      pushNotice('error', message);
      return emptyResult(message);
    }
  }, [currentUser, pushNotice, refreshAppData]);

  const setPage = useCallback((page: Page) => setCurrentPage(page), []);
  const toggleBalanceVisibility = useCallback(() => setBalanceVisible((value) => !value), []);

  const activateDevice = useCallback(async (deviceId: string): Promise<ActionResult> => {
    if (!supabase || !currentUser) return emptyResult('Non autenticato');
    const device = gpuDevices.find((entry) => entry.id === deviceId);
    if (!device) return emptyResult('Dispositivo non trovato');
    if (currentUser.vx_balance < device.price) return emptyResult('Saldo VX insufficiente');

    try {
      const now = new Date().toISOString();
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          balance: currentUser.vx_balance - device.price,
          updated_at: now,
        })
        .eq('id', currentUser.id);
      if (profileError) throw profileError;

      const { error: portfolioError } = await supabase.from('portfolio_entries').insert({
        owner_id: currentUser.id,
        name: device.name,
        allocation: device.compute_power,
        value: device.price,
        change: device.reward_7_days,
        position: userDevices.length + 1,
      });
      if (portfolioError) throw portfolioError;

      await supabase.from('activity_logs').insert({
        owner_id: currentUser.id,
        type: 'device_purchase',
        description: `Attivazione ${device.name}`,
        amount: -device.price,
      });

      await refreshAppData();
      return { success: true, message: `${device.name} attivato con successo.` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Attivazione non riuscita';
      pushNotice('error', message);
      return emptyResult(message);
    }
  }, [currentUser, gpuDevices, pushNotice, refreshAppData, supabase, userDevices.length]);

  const claimDailyReward = useCallback(async (): Promise<ActionResult> => {
    if (!supabase || !currentUser) return emptyResult('Non autenticato');
    if (platformSettings && !platformSettings.daily_claim_enabled) {
      return emptyResult('Il claim giornaliero è disabilitato dalla piattaforma.');
    }
    const today = new Date().toISOString().slice(0, 10);
    const alreadyClaimed = dailyClaims.some((claim) => claim.claim_date === today);
    if (alreadyClaimed) return emptyResult('Già riscosso oggi.');
    const reward = 0.8;

    try {
      const now = new Date().toISOString();
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          balance: currentUser.vx_balance + reward,
          streak: dailyClaims.length + 1,
          last_claim: now,
          last_claim_amount: reward,
          updated_at: now,
        })
        .eq('id', currentUser.id);
      if (profileError) throw profileError;

      await supabase.from('activity_logs').insert({
        owner_id: currentUser.id,
        type: 'daily_claim',
        description: 'Claim giornaliero VX token',
        amount: reward,
      });

      await refreshAppData();
      return { success: true, message: `+${reward} VX riscossi.` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Claim non riuscito';
      pushNotice('error', message);
      return emptyResult(message);
    }
  }, [currentUser, dailyClaims, pushNotice, refreshAppData, supabase]);

  const updateUserBalance = useCallback(async (
    userId: string,
    field: 'vx_balance' | 'demo_usdt_balance',
    amount: number,
  ): Promise<ActionResult> => {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Aggiornamento saldo non riuscito';
      pushNotice('error', message);
      return emptyResult(message);
    }
  }, [currentUser, pushNotice, refreshAppData]);

  const updateDeviceStatus = useCallback(async (_userDeviceId: string, _status: UserDevice['status']): Promise<ActionResult> => {
    pushNotice('info', 'Lo schema corrente non espone stati separati dei dispositivi. Le posizioni sono considerate attive.');
    return emptyResult('Operazione non supportata dal database attuale.');
  }, [pushNotice]);

  const blockUser = useCallback(async (userId: string): Promise<ActionResult> => {
    if (!supabase || !currentUser || currentUser.role !== 'admin') return emptyResult('Non autorizzato');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_blocked: true, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) throw error;
      await refreshAppData();
      return { success: true, message: 'Utente bloccato.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Blocco utente non riuscito';
      pushNotice('error', message);
      return emptyResult(message);
    }
  }, [currentUser, pushNotice, refreshAppData]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isLoggedIn: Boolean(currentUser),
        currentPage,
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
        balanceVisible,
        notice,
        login,
        register,
        updateNickname,
        logout,
        setPage,
        setAuthMode,
        toggleBalanceVisibility,
        activateDevice,
        claimDailyReward,
        updateUserBalance,
        updateDeviceStatus,
        blockUser,
        refreshAppData,
        pushNotice,
        clearNotice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
