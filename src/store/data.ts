import { GPUDevice } from '../types';

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
  // ULTIMATE EDITIONS - Premium variants with enhanced stats
  { id: 'gpu-3u', name: 'G-100 ULTIMATE', price: 720, reward_3_days: 55.69, reward_7_days: 135.82, compute_power: 36, active: true, image_url: '/images/gpu-g100_ultimate.jpg' },
  { id: 'gpu-5u', name: 'G-900 ULTIMATE', price: 4500, reward_3_days: 374.99, reward_7_days: 914.74, compute_power: 240, active: true, image_url: '/images/gpu-g900_ultimate.jpg' },
  { id: 'gpu-7u', name: 'X-7900 ULTIMATE', price: 27000, reward_3_days: 2507, reward_7_days: 6158, compute_power: 1350, active: true, image_url: '/images/gpu-x7900_ultimate.jpg' },
  { id: 'gpu-9u', name: 'IX-9900 ULTIMATE', price: 108000, reward_3_days: 12600, reward_7_days: 31000, compute_power: 6300, active: true, image_url: '/images/gpu-ix9900_ultimate.jpg' },
];

export const buildInviteCode = (seed: string) =>
  `VYRO-${seed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6).padEnd(6, 'X')}`;
