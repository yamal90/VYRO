import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProvider, useApp } from './store/AppContext';
const LoginPage = lazy(() => import('./pages/LoginPage'));
import BottomNav from './components/BottomNav';
import SupabaseSetupState from './components/SupabaseSetupState';
import ParticleBackground from './components/ParticleBackground';
import ErrorBoundary from './components/ErrorBoundary';
import { isSupabaseConfigured } from './lib/supabase';
import { initSentry, setUserContext, clearUserContext } from './lib/sentry';
import './i18n';

initSentry();

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const DevicesPage = lazy(() => import('./pages/DevicesPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const BenefitsPage = lazy(() => import('./pages/BenefitsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AchievementsPage = lazy(() => import('./components/achievements/AchievementsPanel'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const TiersPage = lazy(() => import('./components/tiers/TiersPanel'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  },
});

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#06080f]">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-amber-200/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
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

  React.useEffect(() => {
    if (currentUser) {
      setUserContext({
        id: currentUser.id,
        email: currentUser.email,
        username: currentUser.username,
      });
    } else {
      clearUserContext();
    }
  }, [currentUser]);

  if (!isSupabaseConfigured) {
    return <SupabaseSetupState />;
  }

  if (!bootstrapped) {
    return (
      <div className="min-h-screen bg-[#06080f] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-white/10 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/75">Riconnessione account...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>;
  }

  const isAdmin = currentUser?.role === 'admin';
  const showNav = !['/admin', '/achievements', '/tiers'].includes(location.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto relative min-h-screen bg-[#06080f]/95 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-x-hidden overflow-y-auto border border-white/6">
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
                    : 'bg-[#0c101c] text-white'
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
              <Route path="/settings" element={<AnimatedPage><SettingsPage /></AnimatedPage>} />
              <Route path="/support" element={<AnimatedPage><SupportPage /></AnimatedPage>} />
              <Route path="/achievements" element={<AnimatedPage><AchievementsPage /></AnimatedPage>} />
              <Route path="/tiers" element={<AnimatedPage><TiersPage userStats={{ balance: currentUser?.vx_balance ?? 0, devices: 0, teamSize: 0 }} currentTier={currentUser?.tier} /></AnimatedPage>} />
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
            <div className="w-10 h-10 border-4 border-amber-200/20 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}
        {showNav && <BottomNav />}
      </div>
    </QueryClientProvider>
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
