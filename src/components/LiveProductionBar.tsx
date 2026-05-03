import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Activity, Cpu, TrendingUp, ChevronUp, DollarSign } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { useProductionStats } from '../hooks/useProductionStats';

const PARTICLE_COUNT = 6;

const LiveProductionBar: React.FC = () => {
  const { currentUser, userDevices } = useApp();
  const { activeDevices, totalPower, production, liveIncrement, productionPercent } =
    useProductionStats(userDevices);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [displayedIncrement, setDisplayedIncrement] = useState(liveIncrement);
  const [sparkIndex, setSparkIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDisplayedIncrement((prev) => {
        const diff = liveIncrement - prev;
        if (Math.abs(diff) < 0.001) return liveIncrement;
        return prev + diff * 0.15;
      });
      setSparkIndex((prev) => (prev + 1) % PARTICLE_COUNT);
    }, 50);
    return () => window.clearInterval(timer);
  }, [liveIncrement]);

  if (!currentUser || activeDevices.length === 0) return null;

  const perSecond = production / 60;
  const dailyEstimate = production * 60 * 24;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <motion.div initial={{ y: -100 }} animate={{ y: 0 }} className="mx-3 mt-2">
          <motion.div
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-gradient-to-r from-slate-900 via-amber-900/30 to-slate-900 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20 cursor-pointer border border-amber-500/25 relative"
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
              <motion.div
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 50%, rgba(34,197,94,0.08) 0%, transparent 60%)',
                    'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.08) 0%, transparent 60%)',
                    'radial-gradient(circle at 80% 50%, rgba(34,197,94,0.08) 0%, transparent 60%)',
                    'radial-gradient(circle at 20% 50%, rgba(34,197,94,0.08) 0%, transparent 60%)',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
              />
            </div>

            {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  x: [0, 30 + i * 15, 60 + i * 20],
                  y: [-2, -8 - (i % 3) * 4, -2],
                  opacity: sparkIndex === i ? [0, 1, 0] : 0,
                  scale: sparkIndex === i ? [0.5, 1.2, 0.5] : 0,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute w-1 h-1 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.8)]"
                style={{ left: `${productionPercent * 0.85}%`, top: '55%' }}
              />
            ))}

            <div className="relative px-3 py-2.5 flex items-center gap-3">
              <div className="relative">
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(34,197,94,0)',
                      '0 0 12px 4px rgba(34,197,94,0.3)',
                      '0 0 0 0 rgba(34,197,94,0)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500/25 to-emerald-500/15 flex items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Zap size={17} className="text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                  </motion.div>
                </motion.div>
                <motion.span
                  animate={{
                    scale: [1, 1.4, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(34,197,94,0.4)',
                      '0 0 0 4px rgba(34,197,94,0)',
                      '0 0 0 0 rgba(34,197,94,0.4)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] text-amber-300 font-semibold uppercase tracking-wider">
                    Produzione Live
                  </span>
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-[8px] text-green-400 font-mono"
                  >
                    +{perSecond.toFixed(4)}/s
                  </motion.span>
                  <ChevronUp
                    size={12}
                    className={`text-amber-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                <div className="h-2 bg-white/8 rounded-full overflow-hidden relative">
                  <motion.div
                    animate={{ width: `${productionPercent}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="h-full rounded-full relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(90deg, #22c55e, #10b981, #f59e0b, #22c55e)',
                      backgroundSize: '200% 100%',
                    }}
                  >
                    <motion.div
                      animate={{
                        backgroundPosition: ['0% 0%', '200% 0%'],
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        backgroundSize: '50% 100%',
                      }}
                    />
                    <motion.div
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                    />
                  </motion.div>
                  {productionPercent > 5 && (
                    <motion.div
                      animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.4 }}
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                      style={{ left: `calc(${productionPercent}% - 5px)` }}
                    />
                  )}
                </div>
              </div>

              <div className="text-right min-w-[72px]">
                <div className="flex items-center gap-1 justify-end">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
                  >
                    <DollarSign size={11} className="text-green-400" />
                  </motion.div>
                  <motion.span
                    key={Math.floor(displayedIncrement * 100)}
                    className="font-display font-bold text-green-400 text-sm tabular-nums"
                  >
                    +{displayedIncrement.toFixed(2)}
                  </motion.span>
                </div>
                <motion.span
                  animate={{ color: ['#64748b', '#22c55e', '#64748b'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-[9px] font-mono"
                >
                  {productionPercent.toFixed(2)}%
                </motion.span>
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
                  <motion.div
                    animate={{ borderColor: ['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.35)', 'rgba(245,158,11,0.15)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-white/5 rounded-lg p-2.5 text-center border"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    >
                      <Cpu size={14} className="text-amber-400 mx-auto mb-1" />
                    </motion.div>
                    <p className="font-display text-amber-400 text-sm font-bold">{totalPower}</p>
                    <p className="text-[8px] text-slate-500">TFLOPS</p>
                  </motion.div>
                  <motion.div
                    animate={{ borderColor: ['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.35)', 'rgba(34,197,94,0.15)'] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    className="bg-white/5 rounded-lg p-2.5 text-center border"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Activity size={14} className="text-green-400 mx-auto mb-1" />
                    </motion.div>
                    <p className="font-display text-green-400 text-sm font-bold">
                      {activeDevices.length}
                    </p>
                    <p className="text-[8px] text-slate-500">GPU attive</p>
                  </motion.div>
                  <motion.div
                    animate={{ borderColor: ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.35)', 'rgba(16,185,129,0.15)'] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    className="bg-white/5 rounded-lg p-2.5 text-center border"
                  >
                    <TrendingUp size={14} className="text-emerald-400 mx-auto mb-1" />
                    <motion.p
                      animate={{ color: ['#34d399', '#22c55e', '#10b981', '#34d399'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="font-display text-sm font-bold"
                    >
                      {dailyEstimate.toFixed(1)}
                    </motion.p>
                    <p className="text-[8px] text-slate-500">$/giorno</p>
                  </motion.div>
                </div>

                <div className="px-3 pb-3">
                  <div className="bg-white/3 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400">Prossimo ciclo</span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">
                      {productionPercent >= 100 ? 'Riscuoti ora!' : `${(100 - productionPercent).toFixed(1)}% rimanente`}
                    </span>
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
