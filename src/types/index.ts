export interface User {
  id: string;
  username: string;
  email: string;
  invite_code: string;
  invited_by: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'blocked';
  claim_eligible: boolean;
  vx_balance: number;
  demo_usdt_balance: number;
  compute_power: number;
  avatar_url?: string;
  tier: string;
  streak: number;
  account_blocked: boolean;
  created_at: string;
}

export interface GPUDevice {
  id: string;
  name: string;
  description?: string;
  price: number;
  reward_3_days: number;
  reward_7_days: number;
  compute_power: number;
  image_url?: string;
  active: boolean;
}

export interface UserDevice {
  id: string;
  user_id?: string;
  device_id?: string;
  device?: GPUDevice | null;
  status: 'pending' | 'processing' | 'active' | 'completed';
  start_date: string;
  end_date?: string | null;
  total_generated: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  tx_hash?: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  username: string;
  user_id?: string;
  avatar_url?: string | null;
  tier?: string;
  created_at: string;
  device_active: boolean;
  production: number;
  status: string;
  level: number;
}

export interface DailyClaim {
  id: string;
  user_id: string;
  amount: number;
  claim_date: string;
  created_at: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminDepositRequest {
  id: string;
  owner_id: string;
  username: string;
  email: string;
  amount: number;
  asset: string;
  network: string;
  tx_hash: string | null;
  proof_image_url: string | null;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  created_at: string;
}

export interface AdminWithdrawalRequest {
  id: string;
  owner_id: string;
  username: string;
  email: string;
  amount: number;
  wallet_address: string | null;
  tx_hash: string | null;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  created_at: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  referralCode: string;
}

export interface AppNotice {
  kind: 'info' | 'success' | 'error';
  message: string;
}

export type AuthMode = 'login' | 'register';
export type Page = 'home' | 'devices' | 'transactions' | 'team' | 'benefits' | 'admin' | 'faq' | 'login';
