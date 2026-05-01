import React from 'react';
import { motion } from 'framer-motion';
import { Home, Cpu, Gift, ArrowRightLeft, Users, Sparkles } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { Page } from '../types';

const navItems: { page: Page; icon: React.ElementType; label: string }[] = [
  { page: 'home', icon: Home, label: 'Home' },
  { page: 'devices', icon: Cpu, label: 'GPU' },
  { page: 'benefits', icon: Gift, label: 'Benefici' },
  { page: 'transactions', icon: ArrowRightLeft, label: 'Transazioni' },
  { page: 'team', icon: Users, label: 'Team' },
];

const BottomNav: React.FC = () => {
  const { currentPage, setPage } = useApp();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto">
        <div className="glass-dark border-t border-purple-500/30 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-4px_30px_rgba(124,58,237,0.2)]">
          <div className="flex items-center justify-around">
            {navItems.map(item => {
              const isActive = currentPage === item.page;
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.page}
                  onClick={() => setPage(item.page)}
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all relative ${
                    isActive ? 'text-purple-400' : 'text-slate-500'
                  }`}
                >
                  {isActive && (
                    <>
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full gradient-primary"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                      <motion.div
                        layoutId="navGlow"
                        className="absolute inset-0 rounded-xl bg-purple-500/10"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </>
                  )}
                  <div className={`p-2 rounded-xl transition-all relative ${
                    isActive ? 'bg-purple-500/20 border border-purple-500/30' : ''
                  }`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                    {isActive && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles size={10} className="text-cyan-400" />
                      </motion.div>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold ${
                    isActive ? 'text-purple-300' : 'text-slate-500'
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
