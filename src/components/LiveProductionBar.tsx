import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Cpu, TrendingUp, ChevronUp } from 'lucide-react';
import { useApp } from '../store/AppContext';

const LiveProductionBar: React.FC = () => {
  const { currentUser, userDevices } = useApp();
  const [production, setProduction] = useState(0);
  const [targetProduction, setTargetProduction] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate total production from active devices
  useEffect(() => {
    const activeDevices = userDevices.filter(d => d.status === 'active');
    const totalPower = activeDevices.reduce((sum, d) => sum + (d.device?.compute_power || 0), 0);
    const baseProduction = totalPower * 0.05; // 0.05 VX per TFLOPS per update
    setTargetProduction(baseProduction);
  }, [userDevices]);

  // Animate production counter
  useEffect(() => {
    const interval = setInterval(() => {
      setProduction(prev => {
        const diff = targetProduction - prev;
        if (Math.abs(diff) < 0.01) return targetProduction;
        return prev + diff * 0.1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [targetProduction]);

  // Simulate live increments
  const [liveIncrement, setLiveIncrement] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveIncrement(prev => prev + production * 0.001);
    }, 500);
    return () => clearInterval(interval);
  }, [production]);

  const activeDevices = userDevices.filter(d => d.status === 'active');
  const totalPower = activeDevices.reduce((sum, d) => sum + (d.device?.compute_power || 0), 0);
  const productionPercent = Math.min((production / 10) * 100, 100);

  if (!currentUser || activeDevices.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="mx-3 mt-2"
        >
          {/* Collapsed Bar */}
          <motion.div
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-xl overflow-hidden shadow-lg shadow-purple-500/20 cursor-pointer border border-purple-500/30"
          >
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent"
              />
            </div>

            <div className="relative px-3 py-2 flex items-center gap-3">
              {/* Status indicator */}
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Zap size={16} className="text-green-400" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              </div>

              {/* Production info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider">
                    Produzione Live
                  </span>
                  <ChevronUp 
                    size={12} 
                    className={`text-purple-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                  />
                </div>
                
                {/* Progress bar */}
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${productionPercent}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-green-400 via-cyan-400 to-purple-500 rounded-full relative"
                  >
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 bg-white/30"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Live counter */}
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Activity size={12} className="text-green-400 animate-pulse" />
                  <span className="font-display font-bold text-green-400 text-sm">
                    +{liveIncrement.toFixed(3)}
                  </span>
                </div>
                <span className="text-[9px] text-purple-400">VX/min</span>
              </div>
            </div>
          </motion.div>

          {/* Expanded Panel */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-900/95 backdrop-blur-xl rounded-b-xl border-x border-b border-purple-500/30 overflow-hidden"
              >
                <div className="p-3 space-y-2">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                      <Cpu size={14} className="text-purple-400 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400">GPU Attive</p>
                      <p className="font-display font-bold text-white">{activeDevices.length}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                      <TrendingUp size={14} className="text-cyan-400 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400">Potenza</p>
                      <p className="font-display font-bold text-white">{totalPower} TF</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                      <Activity size={14} className="text-green-400 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400">Produzione</p>
                      <p className="font-display font-bold text-green-400">{production.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Active devices mini list */}
                  <div className="space-y-1">
                    {activeDevices.slice(0, 3).map((device, i) => (
                      <motion.div
                        key={device.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-2 bg-slate-800/30 rounded-lg px-2 py-1.5"
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs text-white font-medium flex-1">
                          {device.device?.name}
                        </span>
                        <span className="text-[10px] text-green-400 font-display">
                          +{(device.device?.compute_power || 0) * 0.05}/min
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Daily earnings projection */}
                  <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 rounded-lg p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-purple-300">Proiezione giornaliera</span>
                      <span className="font-display font-bold text-white">
                        +{(production * 60 * 24).toFixed(2)} VX
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-purple-300">Settimanale</span>
                      <span className="font-display font-bold text-cyan-400">
                        +{(production * 60 * 24 * 7).toFixed(2)} VX
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default LiveProductionBar;
