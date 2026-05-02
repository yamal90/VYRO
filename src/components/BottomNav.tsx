import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Cpu, Gift, ArrowRightLeft, Users, HelpCircle, Settings } from 'lucide-react';

const navItems: { path: string; icon: React.ElementType; label: string }[] = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/devices', icon: Cpu, label: 'GPU' },
  { path: '/benefits', icon: Gift, label: 'Benefici' },
  { path: '/faq', icon: HelpCircle, label: 'FAQ' },
  { path: '/transactions', icon: ArrowRightLeft, label: 'Transazioni' },
  { path: '/team', icon: Users, label: 'Team' },
  { path: '/settings', icon: Settings, label: 'Impostazioni' },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" aria-label="Navigazione principale">
      <div className="max-w-lg mx-auto px-2">
        <div className="surface-card rounded-t-3xl px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-2 shadow-[0_-12px_35px_rgba(2,6,23,0.62)] border border-white/10">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-1 snap-x snap-mandatory">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  whileTap={{ scale: 0.95 }}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all relative flex-shrink-0 snap-center min-w-[66px] ${
                    isActive ? 'text-cyan-300 bg-white/5' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-violet-400"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className={`p-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-violet-500/30 to-cyan-500/25 shadow-[0_0_0_1px_rgba(125,211,252,0.35)]'
                      : 'bg-transparent'
                  }`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[10px] font-semibold whitespace-nowrap tracking-wide ${
                    isActive ? 'text-cyan-200' : 'text-slate-500'
                  }`}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
