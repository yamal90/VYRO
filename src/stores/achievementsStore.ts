import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  xp: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface AchievementsState {
  achievements: Achievement[];
  totalXp: number;
  level: number;
}

interface AchievementsActions {
  checkAchievements: (stats: {
    devicesCount: number;
    teamSize: number;
    totalEarned: number;
    streak: number;
    transactionsCount: number;
  }) => void;
  unlockAchievement: (id: string) => void;
  getUnlockedCount: () => number;
  getProgress: (id: string) => number;
}

const ACHIEVEMENTS: Achievement[] = [
  // Device achievements
  {
    id: 'first_device',
    title: 'Pionieristico',
    description: 'Attiva il tuo primo dispositivo GPU',
    icon: '🚀',
    tier: 'bronze',
    xp: 100,
    unlocked: false,
  },
  {
    id: '5_devices',
    title: 'Cluster Builder',
    description: 'Attiva 5 dispositivi GPU',
    icon: '⚡',
    tier: 'silver',
    xp: 500,
    unlocked: false,
    maxProgress: 5,
  },
  {
    id: '10_devices',
    title: 'Data Center',
    description: 'Attiva 10 dispositivi GPU',
    icon: '🏭',
    tier: 'gold',
    xp: 1000,
    unlocked: false,
    maxProgress: 10,
  },
  {
    id: 'ultimate_gpu',
    title: 'Powerhouse',
    description: 'Attiva una RTX 4090',
    icon: '💎',
    tier: 'platinum',
    xp: 2000,
    unlocked: false,
  },
  
  // Team achievements
  {
    id: 'first_referral',
    title: 'Reclutatore',
    description: 'Invita il tuo primo membro',
    icon: '👥',
    tier: 'bronze',
    xp: 150,
    unlocked: false,
  },
  {
    id: '10_team',
    title: 'Team Leader',
    description: 'Costruisci un team di 10 persone',
    icon: '🎯',
    tier: 'silver',
    xp: 600,
    unlocked: false,
    maxProgress: 10,
  },
  {
    id: '50_team',
    title: 'Network King',
    description: 'Costruisci un team di 50 persone',
    icon: '👑',
    tier: 'gold',
    xp: 2000,
    unlocked: false,
    maxProgress: 50,
  },
  {
    id: '100_team',
    title: 'Empire Builder',
    description: 'Costruisci un team di 100 persone',
    icon: '🏰',
    tier: 'diamond',
    xp: 5000,
    unlocked: false,
    maxProgress: 100,
  },
  
  // Streak achievements
  {
    id: '7_day_streak',
    title: 'Settimana Perfetta',
    description: '7 giorni consecutivi di claim',
    icon: '🔥',
    tier: 'bronze',
    xp: 200,
    unlocked: false,
    maxProgress: 7,
  },
  {
    id: '30_day_streak',
    title: 'Mese Leggendario',
    description: '30 giorni consecutivi di claim',
    icon: '🌟',
    tier: 'gold',
    xp: 1500,
    unlocked: false,
    maxProgress: 30,
  },
  
  // Earnings achievements
  {
    id: '100_earned',
    title: 'Primi Guadagni',
    description: 'Guadagna 100$ totali',
    icon: '💰',
    tier: 'bronze',
    xp: 100,
    unlocked: false,
    maxProgress: 100,
  },
  {
    id: '1000_earned',
    title: 'Investitore',
    description: 'Guadagna 1,000$ totali',
    icon: '📈',
    tier: 'silver',
    xp: 500,
    unlocked: false,
    maxProgress: 1000,
  },
  {
    id: '10000_earned',
    title: 'Mogul',
    description: 'Guadagna 10,000$ totali',
    icon: '🏆',
    tier: 'platinum',
    xp: 5000,
    unlocked: false,
    maxProgress: 10000,
  },
  {
    id: '100000_earned',
    title: 'Leggenda',
    description: 'Guadagna 100,000$ totali',
    icon: '⭐',
    tier: 'diamond',
    xp: 15000,
    unlocked: false,
    maxProgress: 100000,
  },
];

export const useAchievementsStore = create<AchievementsState & AchievementsActions>()(
  persist(
    immer((set, get) => ({
      // State
      achievements: ACHIEVEMENTS,
      totalXp: 0,
      level: 1,

      // Actions
      checkAchievements: (stats) => {
        const updates: { id: string; unlocked: boolean; progress?: number }[] = [];
        
        // Check device achievements
        if (stats.devicesCount >= 1) {
          updates.push({ id: 'first_device', unlocked: true });
        }
        if (stats.devicesCount >= 5) {
          updates.push({ id: '5_devices', unlocked: true, progress: 5 });
        } else if (stats.devicesCount > 0) {
          updates.push({ id: '5_devices', unlocked: false, progress: stats.devicesCount });
        }
        if (stats.devicesCount >= 10) {
          updates.push({ id: '10_devices', unlocked: true, progress: 10 });
        } else if (stats.devicesCount > 0) {
          updates.push({ id: '10_devices', unlocked: false, progress: stats.devicesCount });
        }
        
        // Check team achievements
        if (stats.teamSize >= 1) {
          updates.push({ id: 'first_referral', unlocked: true });
        }
        if (stats.teamSize >= 10) {
          updates.push({ id: '10_team', unlocked: true, progress: 10 });
        } else if (stats.teamSize > 0) {
          updates.push({ id: '10_team', unlocked: false, progress: stats.teamSize });
        }
        if (stats.teamSize >= 50) {
          updates.push({ id: '50_team', unlocked: true, progress: 50 });
        }
        if (stats.teamSize >= 100) {
          updates.push({ id: '100_team', unlocked: true, progress: 100 });
        }
        
        // Check streak achievements
        if (stats.streak >= 7) {
          updates.push({ id: '7_day_streak', unlocked: true, progress: 7 });
        } else {
          updates.push({ id: '7_day_streak', unlocked: false, progress: stats.streak });
        }
        if (stats.streak >= 30) {
          updates.push({ id: '30_day_streak', unlocked: true, progress: 30 });
        } else {
          updates.push({ id: '30_day_streak', unlocked: false, progress: stats.streak });
        }
        
        // Check earnings achievements
        if (stats.totalEarned >= 100) {
          updates.push({ id: '100_earned', unlocked: true, progress: 100 });
        } else {
          updates.push({ id: '100_earned', unlocked: false, progress: Math.min(stats.totalEarned, 100) });
        }
        if (stats.totalEarned >= 1000) {
          updates.push({ id: '1000_earned', unlocked: true, progress: 1000 });
        } else {
          updates.push({ id: '1000_earned', unlocked: false, progress: Math.min(stats.totalEarned, 1000) });
        }
        if (stats.totalEarned >= 10000) {
          updates.push({ id: '10000_earned', unlocked: true, progress: 10000 });
        } else {
          updates.push({ id: '10000_earned', unlocked: false, progress: Math.min(stats.totalEarned, 10000) });
        }
        if (stats.totalEarned >= 100000) {
          updates.push({ id: '100000_earned', unlocked: true, progress: 100000 });
        }
        
        // Apply updates
        set((state) => {
          let newXp = 0;
          state.achievements = state.achievements.map(a => {
            const update = updates.find(u => u.id === a.id);
            if (update) {
              const wasLocked = !a.unlocked && update.unlocked;
              if (wasLocked) {
                newXp += a.xp;
              }
              return { 
                ...a, 
                unlocked: update.unlocked,
                progress: update.progress,
                unlockedAt: wasLocked ? new Date().toISOString() : a.unlockedAt,
              };
            }
            return a;
          });
          state.totalXp += newXp;
          state.level = Math.floor(state.totalXp / 1000) + 1;
        });
      },

      unlockAchievement: (id) => {
        set((state) => {
          const achievement = state.achievements.find(a => a.id === id);
          if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            achievement.unlockedAt = new Date().toISOString();
            state.totalXp += achievement.xp;
            state.level = Math.floor(state.totalXp / 1000) + 1;
          }
        });
      },

      getUnlockedCount: () => {
        return get().achievements.filter(a => a.unlocked).length;
      },

      getProgress: (id) => {
        const achievement = get().achievements.find(a => a.id === id);
        if (!achievement) return 0;
        if (achievement.unlocked) return 100;
        if (achievement.maxProgress && achievement.progress) {
          return Math.round((achievement.progress / achievement.maxProgress) * 100);
        }
        return 0;
      },
    })),
    {
      name: 'vyro-achievements',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
