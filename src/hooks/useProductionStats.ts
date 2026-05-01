import { useState, useEffect, useMemo } from 'react';
import type { UserDevice } from '../types';

export function useProductionStats(userDevices: UserDevice[]) {
  const [production, setProduction] = useState(0);
  const [liveIncrement, setLiveIncrement] = useState(0);

  const activeDevices = useMemo(
    () => userDevices.filter((d) => d.status === 'active'),
    [userDevices],
  );

  const totalPower = useMemo(
    () => activeDevices.reduce((sum, d) => sum + (d.device?.compute_power || 0), 0),
    [activeDevices],
  );

  const targetProduction = useMemo(() => totalPower * 0.05, [totalPower]);

  const productionPercent = useMemo(
    () => Math.min((production / 10) * 100, 100),
    [production],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setProduction((prev) => {
        const diff = targetProduction - prev;
        if (Math.abs(diff) < 0.01) return targetProduction;
        return prev + diff * 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [targetProduction]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveIncrement((prev) => prev + production * 0.001);
    }, 500);
    return () => clearInterval(interval);
  }, [production]);

  return {
    activeDevices,
    totalPower,
    production,
    liveIncrement,
    productionPercent,
  };
}
