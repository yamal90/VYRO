import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type Theme = 'dark' | 'cyberpunk' | 'neon';
type Language = 'it' | 'en' | 'de' | 'fr' | 'es';

interface ThemeState {
  theme: Theme;
  language: Language;
  balanceVisible: boolean;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  reducedMotion: boolean;
}

interface ThemeActions {
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleBalanceVisibility: () => void;
  toggleNotifications: () => void;
  toggleSound: () => void;
  toggleAnimations: () => void;
  setReducedMotion: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    immer((set) => ({
      // State
      theme: 'cyberpunk',
      language: 'it',
      balanceVisible: true,
      notificationsEnabled: true,
      soundEnabled: true,
      animationsEnabled: true,
      reducedMotion: false,

      // Actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },

      setLanguage: (language) => set({ language }),

      toggleBalanceVisibility: () => set((state) => ({ 
        balanceVisible: !state.balanceVisible 
      })),

      toggleNotifications: () => set((state) => ({ 
        notificationsEnabled: !state.notificationsEnabled 
      })),

      toggleSound: () => set((state) => ({ 
        soundEnabled: !state.soundEnabled 
      })),

      toggleAnimations: () => set((state) => ({ 
        animationsEnabled: !state.animationsEnabled 
      })),

      setReducedMotion: (value) => set({ reducedMotion: value }),
    })),
    {
      name: 'vyro-theme',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    useThemeStore.getState().setReducedMotion(true);
  }
  
  // Apply saved theme
  const savedTheme = useThemeStore.getState().theme;
  document.documentElement.setAttribute('data-theme', savedTheme);
}
