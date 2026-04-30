export interface User {
  id: string;
  username: string;
  email: string;
  invite_code: string;
  invited_by: string | null;
  role: 'user' | 'admin';
  vx_balance: number;
  demo_usdt_balance: number;
  compute_power: number;
  avatar_url?: string;
  created_at: string;
}

export interface GPUDevice {
  id: string;
  name: string;
  price: number;
  reward_3_days: number;
  reward_7_days: number;
  compute_power: number;
  image_url?: string;
  active: boolean;
}

export interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  device?: GPUDevice;
  status: 'pending' | 'processing' | 'active' | 'completed';
  start_date: string;
  end_date: string | null;
  total_generated: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'device_purchase' | 'device_reward' | 'team_bonus' | 'daily_claim' | 'login_bonus';
  amount: number;
  currency: 'VX' | 'USDT';
  status: 'completed' | 'pending' | 'rejected';
  description: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  username: string;
  user_id: string;
  created_at: string;
  device_active: boolean;
  production: number;
  status: 'active' | 'inactive';
  level: 1 | 2;
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

export type Page = 'home' | 'devices' | 'transactions' | 'team' | 'benefits' | 'admin' | 'login';
