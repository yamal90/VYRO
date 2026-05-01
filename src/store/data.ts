import { GPUDevice } from '../types';

// ── GPU DEVICES ──
export const GPU_DEVICES: GPUDevice[] = [
  { id: 'gpu-1', name: 'Intel Core i3-12100', description: 'GTX 1650 | 8GB RAM', price: 80, reward_3_days: 5.04, reward_7_days: 12.32, compute_power: 4, active: true, image_url: '/images/gpu-x120.jpg?v=20260501' },
  { id: 'gpu-2', name: 'Intel Core i5-12400F', description: 'GTX 1660 Super | 16GB RAM', price: 160, reward_3_days: 10.99, reward_7_days: 26.8, compute_power: 8, active: true, image_url: '/images/gpu-g88.jpg?v=20260501' },
  { id: 'gpu-3', name: 'AMD Ryzen 5 5600', description: 'RTX 3050 | 16GB RAM', price: 480, reward_3_days: 33.69, reward_7_days: 82.19, compute_power: 24, active: true, image_url: '/images/gpu-g100.jpg?v=20260501' },
  { id: 'gpu-4', name: 'Intel Core i5-13400F', description: 'RTX 3060 | 16GB RAM', price: 1200, reward_3_days: 86.06, reward_7_days: 209.94, compute_power: 68, active: true, image_url: '/images/gpu-g700.jpg?v=20260501' },
  { id: 'gpu-5', name: 'AMD Ryzen 5 7600', description: 'RTX 4060 Ti | 16GB RAM', price: 3000, reward_3_days: 224.99, reward_7_days: 548.84, compute_power: 160, active: true, image_url: '/images/gpu-g900.jpg?v=20260501' },
  { id: 'gpu-6', name: 'Intel Core i7-13700KF', description: 'RTX 4070 Super | 32GB RAM', price: 7200, reward_3_days: 565.69, reward_7_days: 1379.93, compute_power: 360, active: true, image_url: '/images/gpu-x5700.jpg?v=20260501' },
  { id: 'gpu-7', name: 'AMD Ryzen 7 7800X3D', description: 'RTX 4070 Ti Super | 32GB RAM', price: 18000, reward_3_days: 1507, reward_7_days: 3703, compute_power: 900, active: true, image_url: '/images/gpu-x7900.jpg?v=20260501' },
  { id: 'gpu-8', name: 'Intel Core i9-14900K', description: 'RTX 4080 Super | 32GB RAM', price: 34000, reward_3_days: 3125, reward_7_days: 7677, compute_power: 1800, active: true, image_url: '/images/gpu-x8900.jpg?v=20260501' },
  { id: 'gpu-9', name: 'AMD Ryzen 9 7950X3D', description: 'RTX 4090 | 64GB RAM', price: 72000, reward_3_days: 7600, reward_7_days: 18666, compute_power: 4200, active: true, image_url: '/images/gpu-ix9900.jpg?v=20260501' },
];

export const buildInviteCode = (seed: string) =>
  `VYRO-${seed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6).padEnd(6, 'X')}`;
