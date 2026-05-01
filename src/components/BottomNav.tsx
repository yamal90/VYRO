import React from 'react';
import { motion } from 'framer-motion';
import { Home, Cpu, Gift, ArrowRightLeft, Users, HelpCircle } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { Page } from '../types';

const navItems: { page: Page; icon: React.ElementType; label: string }[] = [
  { page: 'home', icon: Home, label: 'Home' },
  { page: 'devices', icon: Cpu, label: 'GPU' },
  { page: 'benefits', icon: Gift, label: 'Benefici' },
  { page: 'faq', icon: HelpCircle, label: 'FAQ' },
  { page: 'transactions', icon: ArrowRightLeft, label: 'Transazioni' },
  { page: 'team', icon: Users, label: 'Team' },
];

const BottomNav: React.FC = () => {
  const { currentPage, setPage } = useApp();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto">
        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-purple-500/20 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-4px_30px_rgba(124,58,237,0.15)]">
          {/* Scrollable nav container */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-1 snap-x snap-mandatory">
            {navItems.map(item => {
              const isActive = currentPage === item.page;
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.page}
                  onClick={() => setPage(item.page)}
                  whileTap={{ scale: 0.9 }}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all relative flex-shrink-0 snap-center ${
                    isActive ? 'text-purple-400' : 'text-slate-500'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full gradient-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className={`p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-purple-500/20' : ''
                  }`}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                  </div>
                  <span className={`text-[9px] font-semibold whitespace-nowrap ${
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
