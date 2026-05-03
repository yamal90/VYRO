export type ProfileRow = {
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

export type TeamMemberRow = {
  id: string;
  owner_id: string;
  member_user_id: string | null;
  username: string;
  avatar_url: string | null;
  tier: string;
  joined: string;
  contribution: number;
  active_balance: number;
  active_sub_count: number;
  account_blocked: boolean;
  claim_eligible: boolean;
  level?: number;
  created_at: string;
  updated_at: string;
  is_test_bot: boolean;
  expires_at: string | null;
};

export type PortfolioEntryRow = {
  id: string;
  owner_id: string;
  name: string;
  allocation: number;
  value: number;
  change: number;
  cycle_reward?: number | null;
  cycle_days?: number | null;
  last_cycle_reset_at?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type DepositRow = {
  id: string;
  owner_id: string;
  amount: number;
  asset: string;
  network: string;
  tx_hash: string | null;
  proof_image_url: string | null;
  status: string;
  created_at: string;
};

export type WithdrawalRow = {
  id: string;
  owner_id: string;
  amount: number;
  tx_hash: string | null;
  status: string;
  created_at: string;
  wallet_address: string | null;
};

export type ActivityLogRow = {
  id: string;
  owner_id: string;
  type: string;
  description: string;
  amount: number | null;
  created_at: string;
};

export type PlatformSettingsRow = {
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
