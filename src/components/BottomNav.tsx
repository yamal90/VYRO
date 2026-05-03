import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Home, Cpu, Gift, ArrowRightLeft, Users, HelpCircle, Settings } from 'lucide-react';

const navItems: { path: string; icon: React.ElementType; labelKey: string }[] = [
  { path: '/', icon: Home, labelKey: 'nav.home' },
  { path: '/devices', icon: Cpu, labelKey: 'nav.gpu' },
  { path: '/benefits', icon: Gift, labelKey: 'nav.benefits' },
  { path: '/faq', icon: HelpCircle, labelKey: 'nav.faq' },
  { path: '/transactions', icon: ArrowRightLeft, labelKey: 'nav.transactions' },
  { path: '/team', icon: Users, labelKey: 'nav.team' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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
                  aria-label={t(item.labelKey)}
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
                    {t(item.labelKey)}
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
