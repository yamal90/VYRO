import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Cpu, TrendingUp, ChevronDown, Clock } from 'lucide-react';
import { useApp } from '../store/AppContext';

interface LiveProductionInlineProps {
  className?: string;
}

const LiveProductionInline: React.FC<LiveProductionInlineProps> = ({ className = '' }) => {
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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${className}`}
    >
      {/* Main Card */}
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gradient-to-r from-slate-800 via-purple-900/50 to-slate-800 rounded-2xl overflow-hidden border border-purple-500/30 cursor-pointer relative"
      >
        {/* Animated scan line */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent"
        />

        {/* Content */}
        <div className="relative p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Zap size={20} className="text-green-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Produzione Live</h3>
                <p className="text-[10px] text-purple-400 flex items-center gap-1">
                  <Clock size={10} />
                  Real-time mining
                </p>
              </div>
            </div>
            
            <ChevronDown 
              size={20} 
              className={`text-purple-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-400">Efficienza</span>
              <span className="text-[11px] text-green-400 font-display font-bold">{productionPercent.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden relative">
              <motion.div
                animate={{ width: `${productionPercent}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full relative"
                style={{
                  background: 'linear-gradient(90deg, #22c55e, #06b6d4, #8b5cf6)',
                }}
              >
                {/* Glow effect */}
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-white/40"
                />
              </motion.div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-900/50 rounded-xl p-2 text-center">
              <Cpu size={14} className="text-purple-400 mx-auto mb-0.5" />
              <p className="font-display font-bold text-white text-sm">{activeDevices.length}</p>
              <p className="text-[9px] text-slate-500">GPU</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-2 text-center">
              <TrendingUp size={14} className="text-cyan-400 mx-auto mb-0.5" />
              <p className="font-display font-bold text-white text-sm">{totalPower}</p>
              <p className="text-[9px] text-slate-500">TFLOPS</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-2 text-center relative overflow-hidden">
              <Activity size={14} className="text-green-400 mx-auto mb-0.5" />
              <p className="font-display font-bold text-green-400 text-sm">
                +{liveIncrement.toFixed(3)}
              </p>
              <p className="text-[9px] text-slate-500">VX/min</p>
              {/* Pulse effect */}
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 bg-green-500/20 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Expanded Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-2 border-t border-purple-500/20">
                {/* Active Devices List */}
                <div className="mb-3">
                  <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-2 font-semibold">
                    Dispositivi attivi
                  </p>
                  <div className="space-y-1.5">
                    {activeDevices.map((device, i) => (
                      <motion.div
                        key={device.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between bg-slate-900/30 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-xs text-white font-medium">
                            {device.device?.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({device.device?.compute_power} TF)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp size={12} className="text-green-400" />
                          <span className="text-[11px] text-green-400 font-display font-bold">
                            +{((device.device?.compute_power || 0) * 0.05).toFixed(2)}/min
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Earnings Projections */}
                <div className="bg-gradient-to-r from-green-900/20 via-cyan-900/20 to-purple-900/20 rounded-xl p-3 border border-green-500/20">
                  <p className="text-[10px] text-green-400 uppercase tracking-wider mb-2 font-semibold">
                    Proiezioni guadagni
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-300">Oggi (24h)</span>
                      </div>
                      <span className="font-display font-bold text-green-400 text-sm">
                        +{(production * 60 * 24).toFixed(2)} VX
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-300">Settimana</span>
                      </div>
                      <span className="font-display font-bold text-cyan-400 text-sm">
                        +{(production * 60 * 24 * 7).toFixed(2)} VX
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={12} className="text-slate-400" />
                        <span className="text-xs text-slate-300">Mese (30gg)</span>
                      </div>
                      <span className="font-display font-bold text-purple-400 text-sm">
                        +{(production * 60 * 24 * 30).toFixed(2)} VX
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default LiveProductionInline;
