import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './store/AppContext';
import LoginPage from './pages/LoginPage';
import BottomNav from './components/BottomNav';
import SupabaseSetupState from './components/SupabaseSetupState';
import ParticleBackground from './components/ParticleBackground';
import ErrorBoundary from './components/ErrorBoundary';
import { isSupabaseConfigured } from './lib/supabase';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DevicesPage = lazy(() => import('./pages/DevicesPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const BenefitsPage = lazy(() => import('./pages/BenefitsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-purple-200/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-white/50">Caricamento...</p>
    </div>
  </div>
);

const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="relative z-10"
  >
    {children}
  </motion.div>
);

const AppContent: React.FC = () => {
  const { isLoggedIn, bootstrapped, authLoading, notice, clearNotice, currentUser } = useApp();
  const location = useLocation();

  if (!isSupabaseConfigured) {
    return <SupabaseSetupState />;
  }

  if (!bootstrapped) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/15 border-t-cyan-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/75">Riconnessione account...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const isAdmin = currentUser?.role === 'admin';
  const showNav = location.pathname !== '/admin';

  return (
    <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto relative min-h-screen bg-slate-50 shadow-2xl shadow-slate-300/50 overflow-hidden">
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
            aria-live="polite"
          >
            <span className="font-semibold block">{notice.message}</span>
            <span className="text-[11px] opacity-75 block mt-1">Tocca per chiudere</span>
          </motion.button>
        )}
      </AnimatePresence>
      
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<AnimatedPage><DashboardPage /></AnimatedPage>} />
            <Route path="/devices" element={<AnimatedPage><DevicesPage /></AnimatedPage>} />
            <Route path="/transactions" element={<AnimatedPage><TransactionsPage /></AnimatedPage>} />
            <Route path="/team" element={<AnimatedPage><TeamPage /></AnimatedPage>} />
            <Route path="/benefits" element={<AnimatedPage><BenefitsPage /></AnimatedPage>} />
            <Route path="/faq" element={<AnimatedPage><FAQPage /></AnimatedPage>} />
            {isAdmin && (
              <Route path="/admin" element={<AnimatedPage><AdminPage /></AnimatedPage>} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      {authLoading && (
        <div
          className="absolute inset-0 z-40 pointer-events-none bg-white/30 backdrop-blur-[2px] flex items-center justify-center"
          role="status"
          aria-label="Caricamento in corso"
        >
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      )}
      {showNav && <BottomNav />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
