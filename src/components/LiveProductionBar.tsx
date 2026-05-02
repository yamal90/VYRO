import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Cpu, TrendingUp, ChevronUp } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useProductionStats } from '../hooks/useProductionStats';

const LiveProductionBar: React.FC = () => {
  const { currentUser, userDevices } = useApp();
  const { activeDevices, totalPower, production, liveIncrement, productionPercent } =
    useProductionStats(userDevices);
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!currentUser || activeDevices.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <motion.div initial={{ y: -100 }} animate={{ y: 0 }} className="mx-3 mt-2">
          <motion.div
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-gradient-to-r from-slate-900 via-amber-900/30 to-slate-900 rounded-xl overflow-hidden shadow-lg shadow-amber-500/15 cursor-pointer border border-amber-500/25"
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            aria-label="Barra produzione live"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }
            }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>

            <div className="relative px-3 py-2 flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Zap size={16} className="text-green-400" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">
                    Produzione Live
                  </span>
                  <ChevronUp
                    size={12}
                    className={`text-amber-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${productionPercent}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-green-400 via-emerald-400 to-amber-500 rounded-full relative"
                  >
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 bg-white/30"
                    />
                  </motion.div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Activity size={12} className="text-green-400 animate-pulse" />
                  <span className="font-display font-bold text-green-400 text-sm">
                    +{liveIncrement.toFixed(2)}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500">{productionPercent.toFixed(2)}%</span>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#0c101c]/95 backdrop-blur-xl rounded-b-xl border border-t-0 border-amber-500/25 overflow-hidden"
              >
                <div className="p-3 grid grid-cols-3 gap-2">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <Cpu size={12} className="text-amber-400 mx-auto mb-1" />
                    <p className="font-display text-amber-400 text-xs font-bold">{totalPower}</p>
                    <p className="text-[8px] text-slate-500">TFLOPS</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <Activity size={12} className="text-green-400 mx-auto mb-1" />
                    <p className="font-display text-green-400 text-xs font-bold">
                      {activeDevices.length}
                    </p>
                    <p className="text-[8px] text-slate-500">GPU attive</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <TrendingUp size={12} className="text-emerald-400 mx-auto mb-1" />
                    <p className="font-display text-emerald-400 text-xs font-bold">
                      {(production * 60 * 24).toFixed(1)}
                    </p>
                    <p className="text-[8px] text-slate-500">$/giorno</p>
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
