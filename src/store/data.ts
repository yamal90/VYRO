import { GPUDevice, User, UserDevice, Transaction, TeamMember, DailyClaim } from '../types';

// Generate unique IDs
let idCounter = 1000;
export const uid = () => `vyro-${++idCounter}`;

// ── GPU DEVICES ──
export const GPU_DEVICES: GPUDevice[] = [
  { id: 'gpu-1', name: 'X-120', price: 80, reward_3_days: 5.04, reward_7_days: 12.32, compute_power: 4, active: true, image_url: '/images/gpu-x120.jpg' },
  { id: 'gpu-2', name: 'G-88', price: 160, reward_3_days: 10.99, reward_7_days: 26.8, compute_power: 8, active: true, image_url: '/images/gpu-g88.jpg' },
  { id: 'gpu-3', name: 'G-100', price: 480, reward_3_days: 33.69, reward_7_days: 82.19, compute_power: 24, active: true, image_url: '/images/gpu-g100.jpg' },
  { id: 'gpu-4', name: 'G-700', price: 1200, reward_3_days: 86.06, reward_7_days: 209.94, compute_power: 68, active: true, image_url: '/images/gpu-g700.jpg' },
  { id: 'gpu-5', name: 'G-900', price: 3000, reward_3_days: 224.99, reward_7_days: 548.84, compute_power: 160, active: true, image_url: '/images/gpu-g900.jpg' },
  { id: 'gpu-6', name: 'X-5700', price: 7200, reward_3_days: 565.69, reward_7_days: 1379.93, compute_power: 360, active: true, image_url: '/images/gpu-x5700.jpg' },
  { id: 'gpu-7', name: 'X-7900', price: 18000, reward_3_days: 1507, reward_7_days: 3703, compute_power: 900, active: true, image_url: '/images/gpu-x7900.jpg' },
  { id: 'gpu-8', name: 'X-8900', price: 34000, reward_3_days: 3125, reward_7_days: 7677, compute_power: 1800, active: true, image_url: '/images/gpu-x8900.jpg' },
  { id: 'gpu-9', name: 'IX-9900', price: 72000, reward_3_days: 7600, reward_7_days: 18666, compute_power: 4200, active: true, image_url: '/images/gpu-ix9900.jpg' },
];

// ── DEMO USER ──
export const DEMO_USER: User = {
  id: 'usr-001',
  username: 'CyberNova',
  email: 'demo@vyrogpu.com',
  invite_code: 'VYRO-7X9K2',
  invited_by: null,
  role: 'user',
  vx_balance: 2450.75,
  demo_usdt_balance: 1280.50,
  compute_power: 32,
  created_at: '2025-01-15T10:00:00Z',
};

export const ADMIN_USER: User = {
  id: 'usr-admin',
  username: 'AdminVyro',
  email: 'admin@vyrogpu.com',
  invite_code: 'VYRO-ADMIN',
  invited_by: null,
  role: 'admin',
  vx_balance: 999999,
  demo_usdt_balance: 500000,
  compute_power: 99999,
  created_at: '2024-12-01T00:00:00Z',
};

// ── USER DEVICES ──
export const DEMO_USER_DEVICES: UserDevice[] = [
  {
    id: 'ud-1',
    user_id: 'usr-001',
    device_id: 'gpu-1',
    device: GPU_DEVICES[0],
    status: 'active',
    start_date: '2025-06-01T10:00:00Z',
    end_date: null,
    total_generated: 42.8,
    created_at: '2025-06-01T10:00:00Z',
  },
  {
    id: 'ud-2',
    user_id: 'usr-001',
    device_id: 'gpu-2',
    device: GPU_DEVICES[1],
    status: 'processing',
    start_date: '2025-06-10T14:00:00Z',
    end_date: null,
    total_generated: 0,
    created_at: '2025-06-10T14:00:00Z',
  },
];

// ── TRANSACTIONS ──
export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 'tx-001', user_id: 'usr-001', type: 'deposit', amount: 500, currency: 'VX', status: 'completed', description: 'Ricarica crediti VX', created_at: '2025-06-15T09:00:00Z' },
  { id: 'tx-002', user_id: 'usr-001', type: 'device_purchase', amount: -80, currency: 'VX', status: 'completed', description: 'Attivazione X-120', created_at: '2025-06-14T15:30:00Z' },
  { id: 'tx-003', user_id: 'usr-001', type: 'device_reward', amount: 5.04, currency: 'VX', status: 'completed', description: 'Produzione X-120 — 3 giorni', created_at: '2025-06-13T08:00:00Z' },
  { id: 'tx-004', user_id: 'usr-001', type: 'team_bonus', amount: 12.50, currency: 'VX', status: 'completed', description: 'Bonus team Livello 1', created_at: '2025-06-12T18:00:00Z' },
  { id: 'tx-005', user_id: 'usr-001', type: 'daily_claim', amount: 2.5, currency: 'VX', status: 'completed', description: 'Claim giornaliero', created_at: '2025-06-11T12:00:00Z' },
  { id: 'tx-006', user_id: 'usr-001', type: 'withdrawal', amount: -100, currency: 'USDT', status: 'pending', description: 'Richiesta prelievo USDT demo', created_at: '2025-06-10T20:00:00Z' },
  { id: 'tx-007', user_id: 'usr-001', type: 'device_purchase', amount: -160, currency: 'VX', status: 'completed', description: 'Attivazione G-88', created_at: '2025-06-10T14:00:00Z' },
  { id: 'tx-008', user_id: 'usr-001', type: 'login_bonus', amount: 1.0, currency: 'VX', status: 'completed', description: 'Bonus login giornaliero', created_at: '2025-06-09T07:00:00Z' },
  { id: 'tx-009', user_id: 'usr-001', type: 'team_bonus', amount: 8.20, currency: 'VX', status: 'completed', description: 'Bonus team Livello 2', created_at: '2025-06-08T16:00:00Z' },
  { id: 'tx-010', user_id: 'usr-001', type: 'deposit', amount: 1000, currency: 'VX', status: 'completed', description: 'Ricarica crediti VX', created_at: '2025-06-07T10:00:00Z' },
];

// ── TEAM MEMBERS ──
export const DEMO_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm-1', username: 'PixelForge', user_id: 'usr-t01', created_at: '2025-03-10T08:00:00Z', device_active: true, production: 24.5, status: 'active', level: 1 },
  { id: 'tm-2', username: 'NeonDrift', user_id: 'usr-t02', created_at: '2025-04-05T12:00:00Z', device_active: true, production: 88.2, status: 'active', level: 1 },
  { id: 'tm-3', username: 'ByteStorm', user_id: 'usr-t03', created_at: '2025-04-18T09:30:00Z', device_active: false, production: 0, status: 'inactive', level: 1 },
  { id: 'tm-4', username: 'QuantumRex', user_id: 'usr-t04', created_at: '2025-05-02T16:00:00Z', device_active: true, production: 156.8, status: 'active', level: 1 },
  { id: 'tm-5', username: 'VoltEdge', user_id: 'usr-t05', created_at: '2025-05-15T11:00:00Z', device_active: true, production: 42.1, status: 'active', level: 2 },
  { id: 'tm-6', username: 'CorePulse', user_id: 'usr-t06', created_at: '2025-05-20T14:00:00Z', device_active: false, production: 0, status: 'inactive', level: 2 },
  { id: 'tm-7', username: 'FluxNode', user_id: 'usr-t07', created_at: '2025-06-01T07:00:00Z', device_active: true, production: 10.5, status: 'active', level: 2 },
];

// ── DAILY CLAIMS ──
export const DEMO_DAILY_CLAIMS: DailyClaim[] = [
  { id: 'dc-1', user_id: 'usr-001', amount: 2.5, claim_date: '2025-06-15', created_at: '2025-06-15T08:00:00Z' },
  { id: 'dc-2', user_id: 'usr-001', amount: 2.5, claim_date: '2025-06-14', created_at: '2025-06-14T09:00:00Z' },
  { id: 'dc-3', user_id: 'usr-001', amount: 2.5, claim_date: '2025-06-13', created_at: '2025-06-13T07:30:00Z' },
  { id: 'dc-4', user_id: 'usr-001', amount: 2.5, claim_date: '2025-06-12', created_at: '2025-06-12T10:00:00Z' },
  { id: 'dc-5', user_id: 'usr-001', amount: 2.5, claim_date: '2025-06-11', created_at: '2025-06-11T08:15:00Z' },
];

// ── ALL USERS (for admin) ──
export const ALL_USERS: User[] = [
  DEMO_USER,
  {
    id: 'usr-t01', username: 'PixelForge', email: 'pixel@demo.com', invite_code: 'VYRO-PF001',
    invited_by: 'usr-001', role: 'user', vx_balance: 340, demo_usdt_balance: 120,
    compute_power: 4, created_at: '2025-03-10T08:00:00Z',
  },
  {
    id: 'usr-t02', username: 'NeonDrift', email: 'neon@demo.com', invite_code: 'VYRO-ND002',
    invited_by: 'usr-001', role: 'user', vx_balance: 1220, demo_usdt_balance: 580,
    compute_power: 24, created_at: '2025-04-05T12:00:00Z',
  },
  {
    id: 'usr-t03', username: 'ByteStorm', email: 'byte@demo.com', invite_code: 'VYRO-BS003',
    invited_by: 'usr-001', role: 'user', vx_balance: 50, demo_usdt_balance: 10,
    compute_power: 0, created_at: '2025-04-18T09:30:00Z',
  },
  {
    id: 'usr-t04', username: 'QuantumRex', email: 'quantum@demo.com', invite_code: 'VYRO-QR004',
    invited_by: 'usr-001', role: 'user', vx_balance: 4500, demo_usdt_balance: 2200,
    compute_power: 68, created_at: '2025-05-02T16:00:00Z',
  },
  {
    id: 'usr-t05', username: 'VoltEdge', email: 'volt@demo.com', invite_code: 'VYRO-VE005',
    invited_by: 'usr-t01', role: 'user', vx_balance: 780, demo_usdt_balance: 350,
    compute_power: 8, created_at: '2025-05-15T11:00:00Z',
  },
  {
    id: 'usr-t06', username: 'CorePulse', email: 'core@demo.com', invite_code: 'VYRO-CP006',
    invited_by: 'usr-t02', role: 'user', vx_balance: 20, demo_usdt_balance: 0,
    compute_power: 0, created_at: '2025-05-20T14:00:00Z',
  },
  {
    id: 'usr-t07', username: 'FluxNode', email: 'flux@demo.com', invite_code: 'VYRO-FN007',
    invited_by: 'usr-t04', role: 'user', vx_balance: 190, demo_usdt_balance: 80,
    compute_power: 4, created_at: '2025-06-01T07:00:00Z',
  },
];
