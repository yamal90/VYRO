import React from 'react';
import { motion } from 'framer-motion';
import { Home, Cpu, ArrowRightLeft, Users, Gift } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { Page } from '../types';

const navItems: { page: Page; icon: React.ElementType; label: string }[] = [
  { page: 'home', icon: Home, label: 'Home' },
  { page: 'devices', icon: Cpu, label: 'Dispositivi' },
  { page: 'benefits', icon: Gift, label: 'Benefici' },
  { page: 'transactions', icon: ArrowRightLeft, label: 'Transazioni' },
  { page: 'team', icon: Users, label: 'Team' },
];

const BottomNav: React.FC = () => {
  const { currentPage, setPage } = useApp();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto">
        <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200/60 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around">
            {navItems.map(item => {
              const isActive = currentPage === item.page;
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.page}
                  onClick={() => setPage(item.page)}
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all relative ${
                    isActive ? 'text-purple-600' : 'text-slate-400'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full gradient-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className={`p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-purple-100' : ''
                  }`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                  </div>
                  <span className={`text-[9px] font-semibold ${
                    isActive ? 'text-purple-600' : 'text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
