import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Cpu, Gift, ArrowRightLeft, Users, HelpCircle, Settings } from 'lucide-react';

const navItems: { path: string; icon: React.ElementType; label: string }[] = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/devices', icon: Cpu, label: 'GPU' },
  { path: '/benefits', icon: Gift, label: 'Benefici' },
  { path: '/faq', icon: HelpCircle, label: 'FAQ' },
  { path: '/transactions', icon: ArrowRightLeft, label: 'Movimenti' },
  { path: '/team', icon: Users, label: 'Team' },
  { path: '/settings', icon: Settings, label: 'Opzioni' },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" aria-label="Navigazione principale">
      <div className="max-w-lg mx-auto px-1">
        <div className="bg-[#080c16]/95 backdrop-blur-xl rounded-t-2xl px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] border border-white/6 border-b-0">
          <div className="flex items-center justify-between">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  whileTap={{ scale: 0.92 }}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl transition-all relative flex-1 min-w-0 ${
                    isActive ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-7 h-0.5 rounded-full bg-amber-400"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className={`p-1.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-amber-500/15'
                      : 'bg-transparent'
                  }`}>
                    <Icon size={16} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[8px] font-semibold whitespace-nowrap leading-tight ${
                    isActive ? 'text-amber-400' : 'text-slate-500'
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
