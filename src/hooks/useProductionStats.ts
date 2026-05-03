import { useEffect, useMemo, useState } from 'react';
import type { UserDevice } from '../types';

const CYCLE_DAYS = 30;
const CYCLE_MS = CYCLE_DAYS * 24 * 60 * 60 * 1000;

const getCycleGenerated = (device: UserDevice, nowMs: number) => {
  const reward7Days = Number(device.device?.reward_7_days ?? 0);
  if (!Number.isFinite(reward7Days) || reward7Days <= 0) {
    return Number(device.total_generated ?? 0);
  }
  const startMs = Date.parse(device.start_date);
  if (!Number.isFinite(startMs) || startMs <= 0) {
    return Number(device.total_generated ?? 0);
  }
  const elapsedMs = Math.max(0, nowMs - startMs);
  const progress = Math.min(elapsedMs / CYCLE_MS, 1);
  return reward7Days * progress;
};

export function useProductionStats(userDevices: UserDevice[]) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeDevices = useMemo(
    () => userDevices.filter((d) => d.status === 'active'),
    [userDevices],
  );

  const totalPower = useMemo(
    () => activeDevices.reduce((sum, d) => sum + (d.device?.compute_power || 0), 0),
    [activeDevices],
  );

  const production = useMemo(() => {
    return activeDevices.reduce((sum, d) => {
      const reward7Days = Number(d.device?.reward_7_days ?? 0);
      if (!Number.isFinite(reward7Days) || reward7Days <= 0) return sum;
      return sum + reward7Days / (7 * 24 * 60);
    }, 0);
  }, [activeDevices]);

  const liveIncrement = useMemo(
    () => activeDevices.reduce((sum, d) => sum + getCycleGenerated(d, nowMs), 0),
    [activeDevices, nowMs],
  );

  const productionPercent = useMemo(() => {
    if (activeDevices.length === 0) return 0;
    const avgProgress =
      activeDevices.reduce((sum, d) => {
        const cycleTarget = Math.max(Number(d.device?.reward_7_days ?? 0), 1);
        const progress = Math.min(100, (getCycleGenerated(d, nowMs) / cycleTarget) * 100);
        return sum + progress;
      }, 0) / activeDevices.length;
    return Number(avgProgress.toFixed(2));
  }, [activeDevices, nowMs]);

  return {
    activeDevices,
    totalPower,
    production,
    liveIncrement,
    productionPercent,
  };
}
