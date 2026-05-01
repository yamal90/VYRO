import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './store/AppContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DevicesPage from './pages/DevicesPage';
import TransactionsPage from './pages/TransactionsPage';
import TeamPage from './pages/TeamPage';
import BenefitsPage from './pages/BenefitsPage';
import AdminPage from './pages/AdminPage';
import BottomNav from './components/BottomNav';
import SupabaseSetupState from './components/SupabaseSetupState';
import ParticleBackground from './components/ParticleBackground';
import LiveProductionBar from './components/LiveProductionBar';
import { isSupabaseConfigured } from './lib/supabase';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

const AppContent: React.FC = () => {
  const { isLoggedIn, currentPage, bootstrapped, authLoading, notice, clearNotice } = useApp();

  if (!isSupabaseConfigured) {
    return <SupabaseSetupState />;
  }

  if (!bootstrapped) {
    return <LoginPage />;
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <DashboardPage />;
      case 'devices':
        return <DevicesPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'team':
        return <TeamPage />;
      case 'benefits':
        return <BenefitsPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto relative min-h-screen bg-slate-50 shadow-2xl shadow-slate-300/50 overflow-hidden">
      {/* Animated particle background */}
      <ParticleBackground intensity="low" />
      
      <AnimatePresence>
        {notice && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            onClick={clearNotice}
            className={`absolute top-3 left-3 right-3 z-50 rounded-2xl px-4 py-3 text-left text-sm shadow-lg ${
              notice.kind === 'error'
                ? 'bg-red-600 text-white'
                : notice.kind === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-white'
            }`}
          >
            <span className="font-semibold block">{notice.message}</span>
            <span className="text-[11px] opacity-75 block mt-1">Tocca per chiudere</span>
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Live Production Bar */}
      <LiveProductionBar />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative z-10"
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      {authLoading && (
        <div className="absolute inset-0 z-40 pointer-events-none bg-white/30 backdrop-blur-[2px] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      )}
      {currentPage !== 'admin' && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
