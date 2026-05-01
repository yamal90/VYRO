import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, RefreshCw, Headphones,
  ArrowDownCircle, ArrowUpCircle, Repeat, FileText,
  Zap, TrendingUp, Users, Activity, ChevronRight, Shield, Sparkles, LogOut, Settings
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import NicknameModal from '../components/ui/NicknameModal';

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const DashboardPage: React.FC = () => {
  const { currentUser, balanceVisible, toggleBalanceVisibility, transactions, userDevices, teamMembers, refreshAppData, pushNotice, updateNickname, logout } = useApp();
  const navigate = useNavigate();
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);

  const todayIncome = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return transactions
      .filter((t) => t.amount > 0 && t.created_at.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const personalProd = useMemo(() => {
    return userDevices
      .filter((d) => d.status === 'active')
      .reduce((sum, d) => sum + d.total_generated, 0);
  }, [userDevices]);

  const teamProd = useMemo(() => {
    return teamMembers.reduce((sum, m) => sum + m.production * (m.level === 1 ? 0.03 : 0.02), 0);
  }, [teamMembers]);

  if (!currentUser) return null;

  const recentTx = transactions.slice(0, 4);
  const actionButtons = [
    {
      icon: ArrowDownCircle,
      label: 'Ricarica',
      color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      onClick: () => {
        navigate('/transactions');
        pushNotice('info', 'Le richieste di ricarica vengono tracciate nella sezione transazioni.');
      },
    },
    {
      icon: ArrowUpCircle,
      label: 'Prelievo',
      color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      onClick: () => {
        navigate('/transactions');
        pushNotice('info', 'I prelievi verranno mostrati nello storico transazioni.');
      },
    },
    {
      icon: Repeat,
      label: 'Scambio',
      color: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
      onClick: () => {
        navigate('/devices');
        pushNotice('info', 'Per ora lo scambio passa dal catalogo dispositivi e dal saldo VX.');
      },
    },
    {
      icon: FileText,
      label: 'Fattura',
      color: 'bg-green-500/20 text-green-400 border border-green-500/30',
      onClick: () => {
        navigate('/transactions');
        pushNotice('info', 'Apri una transazione per vedere il relativo dettaglio contabile.');
      },
    },
  ];

  const mask = (v: number) => balanceVisible ? v.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '••••••';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 pb-32 pt-16">
      {/* Header with background */}
      <div className="relative overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 right-0 w-64 h-64 bg-purple-600/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute top-20 left-0 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl"
          />
        </div>
        
        <div className="px-4 pt-6 pb-24 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/70 via-indigo-600/65 to-cyan-600/60" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-40 h-40 border border-white/20 rounded-full" />
            <div className="absolute top-20 right-20 w-20 h-20 border border-white/10 rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 border border-white/10 rounded-full" />
          </div>

          <div className="flex items-center justify-between relative z-10 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400/50 shadow-lg shadow-purple-500/30 relative">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.username}`}
                  alt={currentUser.username}
                  className="w-full h-full object-cover bg-purple-900"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-purple-900" />
              </div>
              <div>
                <p className="text-white font-bold text-base flex items-center gap-2">
                  {currentUser.username}
                  <Sparkles size={14} className="text-yellow-400" />
                </p>
                <p className="text-white/50 text-xs">ID: {currentUser.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void refreshAppData()}
                className="w-10 h-10 rounded-full glass-dark flex items-center justify-center hover:bg-white/20 transition-colors border border-purple-500/30"
              >
                <RefreshCw size={16} className="text-purple-300" />
              </button>
              <button
                onClick={() => {
                  window.location.href = 'mailto:support@vyrogpu.com';
                }}
                className="w-10 h-10 rounded-full glass-dark flex items-center justify-center hover:bg-white/20 transition-colors border border-purple-500/30"
              >
                <Headphones size={16} className="text-purple-300" />
              </button>
              <button
                onClick={() => setNicknameModalOpen(true)}
                className="w-10 h-10 rounded-full glass-dark flex items-center justify-center hover:bg-white/20 transition-colors border border-purple-500/30"
                aria-label="Modifica nickname"
              >
                <Settings size={16} className="text-purple-300" />
              </button>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-10 h-10 rounded-full glass-dark flex items-center justify-center hover:bg-white/20 transition-colors border border-yellow-500/30"
                >
                  <Shield size={16} className="text-yellow-400" />
                </button>
              )}
              <button
                onClick={() => { void logout(); }}
                className="w-10 h-10 rounded-full glass-dark flex items-center justify-center hover:bg-white/20 transition-colors border border-red-500/30"
              >
                <LogOut size={16} className="text-red-300" />
              </button>
            </div>
          </div>

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/80 text-sm font-medium">Attività Totali</span>
              <button onClick={toggleBalanceVisibility} className="text-white/60 hover:text-white transition-colors">
                {balanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            <div className="flex items-end gap-6">
              <div>
                <p className="text-white/50 text-[11px] uppercase tracking-wider mb-0.5">VX Token</p>
                <p className="text-white font-display text-3xl font-bold tracking-wide">
                  {mask(currentUser.vx_balance)}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-[11px] uppercase tracking-wider mb-0.5">USDT Balance</p>
                <p className="text-white font-display text-xl font-semibold tracking-wide">
                  {mask(currentUser.demo_usdt_balance)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="-mt-12 px-4 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="surface-card rounded-2xl p-5 grid grid-cols-4 gap-3"
        >
          {actionButtons.map((item, i) => (
            <motion.button
              key={item.label}
              custom={i}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              whileTap={{ scale: 0.92 }}
              onClick={item.onClick}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
                <item.icon size={22} />
              </div>
              <span className="text-xs font-medium text-slate-300">{item.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* My Earnings */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-purple-400" />
          I miei guadagni
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Entrate oggi', value: todayIncome, icon: Zap, gradient: 'from-purple-600 to-violet-700' },
            { label: 'Produzione', value: personalProd, icon: Activity, gradient: 'from-blue-600 to-indigo-700' },
            { label: 'Team oggi', value: teamProd, icon: Users, gradient: 'from-cyan-600 to-teal-700' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              custom={i + 4}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className={`rounded-2xl p-4 text-white relative overflow-hidden border border-white/10 bg-gradient-to-br ${item.gradient} shadow-[0_10px_24px_rgba(2,6,23,0.35)]`}
            >
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
              <item.icon size={18} className="mb-2 opacity-80" />
              <p className="font-display text-xl font-bold">{mask(item.value)}</p>
              <p className="text-[10px] text-white/70 mt-1 leading-tight">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Personal Earnings */}
      <div className="px-4 mt-6">
        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Guadagni personali</h3>
            <span className="px-3 py-1.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full flex items-center gap-1.5 border border-green-500/30">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              In corso
            </span>
          </div>

          {/* Mini Chart */}
          <div className="flex items-end gap-1 h-24 mb-4">
            {[35, 55, 42, 68, 50, 75, 60, 82, 70, 90, 65, 85, 78, 95].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                className={`flex-1 rounded-sm ${i >= 12 ? 'bg-gradient-to-t from-purple-600 to-cyan-500' : 'bg-purple-800/50'}`}
              />
            ))}
          </div>

          {/* Compute Power */}
          <div className="soft-divider mb-3" />
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-400">Potenza di calcolo</span>
            <span className="text-sm font-bold text-purple-400 font-display">{currentUser.compute_power} TFLOPS</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Ultime attività</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-purple-400 text-xs font-semibold flex items-center gap-0.5 hover:text-purple-300 transition-colors"
          >
            Vedi tutto <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {recentTx.map((tx, i) => (
            <motion.div
              key={tx.id}
              custom={i + 7}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="surface-card-soft rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                tx.amount > 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {tx.amount > 0 ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                <p className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString('it-IT')}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold font-display ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                </p>
                <p className="text-[10px] text-slate-400">{tx.currency}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 mb-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-[10px] text-amber-300 leading-relaxed text-center">
            VYRO GPU integra strumenti di monitoraggio, protezione account e controllo operativo
            per offrire un'esperienza stabile, chiara e orientata alla continuità della piattaforma.
          </p>
        </div>
      </div>

      <NicknameModal
        isOpen={nicknameModalOpen}
        currentNickname={currentUser.username}
        onClose={() => setNicknameModalOpen(false)}
        onSave={(nickname) => {
          setNicknameModalOpen(false);
          void updateNickname(nickname).then((result) => {
            pushNotice(result.success ? 'success' : 'error', result.message);
          });
        }}
      />
    </div>
  );
};

export default DashboardPage;
