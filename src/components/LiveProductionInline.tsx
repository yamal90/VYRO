import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Cpu, TrendingUp, ChevronDown, Clock } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useProductionStats } from '../hooks/useProductionStats';

interface LiveProductionInlineProps {
  className?: string;
}

const LiveProductionInline: React.FC<LiveProductionInlineProps> = ({ className = '' }) => {
  const { currentUser, userDevices } = useApp();
  const { activeDevices, totalPower, production, liveIncrement, productionPercent } =
    useProductionStats(userDevices);
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!currentUser || activeDevices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <motion.div
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gradient-to-r from-slate-800 via-amber-900/30 to-slate-800 rounded-2xl overflow-hidden border border-amber-500/25 cursor-pointer relative"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Produzione live - clicca per dettagli"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="absolute inset-0 shimmer" />

        <div className="relative p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <Zap size={20} className="text-green-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Produzione Live</h3>
                <p className="text-[10px] text-amber-400 flex items-center gap-1">
                  <Clock size={10} />
                  Real-time mining
                </p>
              </div>
            </div>

            <ChevronDown
              size={20}
              className={`text-amber-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-400">Efficienza</span>
              <span className="text-[11px] text-green-400 font-display font-bold">
                {productionPercent.toFixed(2)}%
              </span>
            </div>
            <div className="h-2 bg-white/10/50 rounded-full overflow-hidden relative">
              <motion.div
                animate={{ width: `${productionPercent}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full relative"
                style={{
                  background: 'linear-gradient(90deg, #22c55e, #06b6d4, #8b5cf6)',
                }}
              >
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-white/40"
                />
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <Activity size={14} className="text-green-400 mx-auto mb-1" />
              <p className="font-display text-green-400 text-sm font-bold">
                +{liveIncrement.toFixed(2)}
              </p>
              <p className="text-[9px] text-slate-500">Dollari generati</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <Cpu size={14} className="text-amber-400 mx-auto mb-1" />
              <p className="font-display text-amber-400 text-sm font-bold">{totalPower}</p>
              <p className="text-[9px] text-slate-500">TFLOPS</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 text-center">
              <TrendingUp size={14} className="text-emerald-400 mx-auto mb-1" />
              <p className="font-display text-emerald-400 text-sm font-bold">
                {(production * 60 * 24).toFixed(1)}
              </p>
              <p className="text-[9px] text-slate-500">$/giorno</p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-amber-500/20"
            >
              <div className="p-4 space-y-2">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">
                  Dispositivi attivi
                </p>
                {activeDevices.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-white text-xs">{d.device?.name ?? 'GPU'}</span>
                    </div>
                    <span className="text-emerald-400 text-xs font-display">
                      {d.device?.compute_power ?? 0} TF
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default LiveProductionInline;
