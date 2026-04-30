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

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
};

const AppContent: React.FC = () => {
  const { isLoggedIn, currentPage } = useApp();

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
    <div className="max-w-lg mx-auto relative min-h-screen bg-slate-50 shadow-2xl shadow-slate-300/50">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
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
