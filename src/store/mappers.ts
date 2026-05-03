import type { DailyClaim, TeamMember, Transaction, User, UserDevice } from '../types';
import type {
  ActivityLogRow,
  DepositRow,
  PortfolioEntryRow,
  ProfileRow,
  TeamMemberRow,
  WithdrawalRow,
} from './db-types';
import { GPU_DEVICES } from './data';

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

const DEFAULT_CYCLE_DAYS = 7;

const parseTimestamp = (value: string | null | undefined) => {
  if (!value) return NaN;
  const direct = Date.parse(value);
  if (Number.isFinite(direct)) return direct;
  const normalized = value.replace(' ', 'T');
  return Date.parse(normalized);
};

export const mapProfileToUser = (
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
  claim_eligible: Boolean(profile.claim_eligible),
  vx_balance: Number(profile.balance ?? 0),
  demo_usdt_balance: demoUsdtBalance,
  compute_power: computePower,
  avatar_url: profile.avatar_url || undefined,
  tier: profile.tier ?? 'zyra',
  streak: profile.streak ?? 0,
  account_blocked: profile.account_blocked ?? false,
  created_at: profile.created_at || profile.joined_at,
});

export const mapTeamMember = (row: TeamMemberRow): TeamMember => ({
  id: row.id,
  user_id: row.member_user_id ?? row.id,
  username: row.username,
  created_at: row.joined || row.created_at,
  device_active: row.active_sub_count > 0 || row.active_balance > 0,
  production: Number(row.contribution ?? 0),
  status: row.account_blocked ? 'inactive' : 'active',
  level: Number(row.level ?? 1) as 1 | 2,
});

const computeGeneratedValue = (entry: PortfolioEntryRow, fallbackWeekly: number) => {
  const cycleDays = Math.max(Number(entry.cycle_days ?? DEFAULT_CYCLE_DAYS), 1);
  const cycleReward = Math.max(
    Number(entry.cycle_reward ?? 0),
    Number(fallbackWeekly ?? 0),
    Number(entry.change ?? 0),
    0,
  );
  if (cycleReward <= 0) return 0;

  const cycleStart = parseTimestamp(entry.last_cycle_reset_at ?? entry.created_at);
  if (!Number.isFinite(cycleStart) || cycleStart <= 0) return 0;

  const cycleMs = cycleDays * 24 * 60 * 60 * 1000;
  const elapsedMs = Math.max(0, Date.now() - cycleStart);
  const elapsedInCycleMs = elapsedMs % cycleMs;
  const generated = cycleReward * (elapsedInCycleMs / cycleMs);
  return Number(generated.toFixed(2));
};

export const mapPortfolioEntryToUserDevice = (entry: PortfolioEntryRow): UserDevice => {
  const normalizedName = LEGACY_DEVICE_NAME_MAP[entry.name] ?? entry.name;
  const cycleReward = Math.max(Number(entry.cycle_reward ?? 0), Number(entry.change ?? 0), 0);
  const matchingDevice = GPU_DEVICES.find(
    (device) => device.name === normalizedName || device.name === entry.name,
  ) ?? {
    id: `portfolio-${entry.id}`,
    name: normalizedName,
    price: Number(entry.value ?? 0),
    reward_3_days: Number((cycleReward * 3 / 7).toFixed(2)),
    reward_7_days: Number(cycleReward.toFixed(2)),
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
    start_date: entry.last_cycle_reset_at ?? entry.created_at,
    end_date: null,
    total_generated: computeGeneratedValue(entry, matchingDevice.reward_7_days),
    created_at: entry.created_at,
  };
};

export const mapLogsToTransactions = (
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
    status:
      row.status === 'approved' || row.status === 'completed'
        ? 'completed'
        : row.status === 'rejected'
          ? 'rejected'
          : 'pending',
    description: `${row.status === 'pending' ? 'Deposit request' : 'Deposit'} ${row.asset} ${row.network}`,
    created_at: row.created_at,
  }));

  const withdrawalTransactions: Transaction[] = withdrawals.map((row) => ({
    id: row.id,
    user_id: row.owner_id,
    type: 'withdrawal',
    amount: -Math.abs(Number(row.amount ?? 0)),
    currency: 'USDT',
    status:
      row.status === 'approved' || row.status === 'completed'
        ? 'completed'
        : row.status === 'rejected'
          ? 'rejected'
          : 'pending',
    description: row.wallet_address
      ? `${row.status === 'pending' ? 'Withdrawal request to' : 'Withdrawal to'} ${row.wallet_address}`
      : 'Withdrawal request',
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
    else if (row.type.includes('purchase') || row.type.includes('device'))
      type = 'device_purchase';
    else if (row.type.includes('reward') || row.type.includes('yield'))
      type = 'device_reward';

    return {
      id: row.id,
      user_id: row.owner_id,
      type,
      amount: Number(row.amount ?? 0),
      currency,
      status: 'completed' as const,
      description: row.description,
      created_at: row.created_at,
    };
  });

  return [...activityTransactions, ...depositTransactions, ...withdrawalTransactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
};

export const makeDailyClaims = (profile: ProfileRow): DailyClaim[] => {
  if (!profile.last_claim) return [];
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

export const randomInviteCode = () =>
  `VYRO-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
