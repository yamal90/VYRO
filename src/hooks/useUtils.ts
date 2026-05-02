import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseRealtimeOptions {
  channel: string;
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

export const useRealtime = <T = unknown>({
  channel,
  table,
  event = '*',
  filter,
}: UseRealtimeOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<T | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // This would integrate with Supabase Realtime
    // For now, it's a placeholder showing the pattern
    const subscribe = async () => {
      // Supabase realtime subscription would go here
      setIsConnected(true);
    };

    subscribe();

    return () => {
      setIsConnected(false);
    };
  }, [channel, table, event, filter]);

  const invalidate = useCallback(
    (queryKey: unknown[]) => {
      queryClient.invalidateQueries({ queryKey: queryKey as string[] });
    },
    [queryClient]
  );

  return { isConnected, lastEvent, invalidate };
};

// Production-ready hook
export const useProductionStats = () => {
  const [stats, setStats] = useState({
    totalGenerated: 0,
    activeDevices: 0,
    dailyRate: 0,
    projectedMonthly: 0,
  });

  useEffect(() => {
    // Calculate stats from devices
    const interval = setInterval(() => {
      // Update stats every second
      setStats((prev) => ({
        ...prev,
        totalGenerated: prev.totalGenerated + prev.dailyRate / 86400,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return stats;
};

// Theme hook
export const useTheme = () => {
  const [theme, setThemeState] = useState<'dark' | 'cyberpunk' | 'neon'>('cyberpunk');

  useEffect(() => {
    const saved = localStorage.getItem('vyro-theme') as typeof theme;
    if (saved) setThemeState(saved);
  }, []);

  const setTheme = useCallback((newTheme: typeof theme) => {
    setThemeState(newTheme);
    localStorage.setItem('vyro-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);

  return { theme, setTheme };
};

// Media query hook
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// Breakpoint hooks
export const useIsMobile = () => useMediaQuery('(max-width: 640px)');
export const useIsTablet = () => useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)');

// Debounce hook
export const useDebounce = <T>(value: T, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

// Local storage hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
};

// Copy to clipboard
export const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { copied, copy };
};
