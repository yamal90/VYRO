import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, RefreshCw, Headphones, Settings,
  ArrowDownCircle, ArrowUpCircle, Repeat, FileText,
  Zap, TrendingUp, Users, Activity, ChevronRight, Shield
} from 'lucide-react';
import { useApp } from '../store/AppContext';

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const DashboardPage: React.FC = () => {
  const { currentUser, balanceVisible, toggleBalanceVisibility, setPage, transactions, refreshAppData, pushNotice } = useApp();
  if (!currentUser) return null;

  const todayIncome = 18.54;
  const personalProd = 12.32;
  const teamProd = 6.22;

  const recentTx = transactions.slice(0, 4);
  const actionButtons = [
    {
      icon: ArrowDownCircle,
      label: 'Ricarica',
      color: 'bg-purple-100 text-purple-600',
      onClick: () => {
        setPage('transactions');
        pushNotice('info', 'Le richieste di ricarica vengono tracciate nella sezione transazioni.');
      },
    },
    {
      icon: ArrowUpCircle,
      label: 'Prelievo',
      color: 'bg-blue-100 text-blue-600',
      onClick: () => {
        setPage('transactions');
        pushNotice('info', 'I prelievi verranno mostrati nello storico transazioni.');
      },
    },
    {
      icon: Repeat,
      label: 'Scambio',
      color: 'bg-cyan-100 text-cyan-600',
      onClick: () => {
        setPage('devices');
        pushNotice('info', 'Per ora lo scambio passa dal catalogo dispositivi e dal saldo VX.');
      },
    },
    {
      icon: FileText,
      label: 'Fattura',
      color: 'bg-emerald-100 text-emerald-600',
      onClick: () => {
        setPage('transactions');
        pushNotice('info', 'Apri una transazione per vedere il relativo dettaglio contabile.');
      },
    },
  ];

  const mask = (v: number) => balanceVisible ? v.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '••••••';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24">
      {/* Header with background image */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=400&fit=crop')" }}
        />
        <div className="gradient-primary px-4 pt-6 pb-20 relative z-10">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-40 h-40 border border-white/20 rounded-full" />
            <div className="absolute top-20 right-20 w-20 h-20 border border-white/10 rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 border border-white/10 rounded-full" />
          </div>

          <div className="flex items-center justify-between relative z-10 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                  alt={currentUser.username}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <p className="text-white font-bold text-base">{currentUser.username}</p>
                <p className="text-white/60 text-xs">ID: {currentUser.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void refreshAppData()}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <RefreshCw size={16} className="text-white" />
              </button>
              <button
                onClick={() => {
                  window.location.href = 'mailto:support@vyrogpu.com';
                }}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Headphones size={16} className="text-white" />
              </button>
              <button
                onClick={() => {
                  if (currentUser.role === 'admin') {
                    setPage('admin');
                    return;
                  }
                  pushNotice('info', 'Area impostazioni in arrivo. Per ora puoi gestire tutto da Team e Transazioni.');
                }}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                {currentUser.role === 'admin' ? <Shield size={16} className="text-yellow-300" /> : <Settings size={16} className="text-white" />}
              </button>
            </div>
          </div>

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white/80 text-sm font-medium">Attività</span>
              <button onClick={toggleBalanceVisibility} className="text-white/60 hover:text-white transition-colors">
                {balanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            <div className="flex items-end gap-6">
              <div>
                <p className="text-white/50 text-[11px] uppercase tracking-wider mb-0.5">VX Token</p>
                <p className="text-white font-display text-2xl font-bold tracking-wide">
                  {mask(currentUser.vx_balance)}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-[11px] uppercase tracking-wider mb-0.5">USDT Balance</p>
                <p className="text-white font-display text-lg font-semibold tracking-wide">
                  {mask(currentUser.demo_usdt_balance)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Action Buttons - overlapping */}
      <div className="-mt-10 px-4 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg shadow-purple-500/5 p-5 grid grid-cols-4 gap-3"
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
              <span className="text-xs font-medium text-slate-600">{item.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* My Earnings */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-purple-500" />
          I miei guadagni
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Entrate oggi', value: todayIncome, icon: Zap, gradient: 'from-purple-500 to-violet-600' },
            { label: 'Produzione', value: personalProd, icon: Activity, gradient: 'from-blue-500 to-indigo-600' },
            { label: 'Team oggi', value: teamProd, icon: Users, gradient: 'from-cyan-500 to-teal-600' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              custom={i + 4}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className={`bg-gradient-to-br ${item.gradient} rounded-2xl p-3.5 text-white relative overflow-hidden`}
            >
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-white/10 rounded-full" />
              <item.icon size={16} className="mb-2 opacity-80" />
              <p className="font-display text-lg font-bold">{mask(item.value)}</p>
              <p className="text-[10px] text-white/70 mt-0.5 leading-tight">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Personal Earnings */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Guadagni personali</h3>
            <span className="px-2.5 py-1 bg-green-100 text-green-600 text-[10px] font-bold rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              In corso
            </span>
          </div>

          {/* Mini Chart */}
          <div className="flex items-end gap-1 h-20 mb-4">
            {[35, 55, 42, 68, 50, 75, 60, 82, 70, 90, 65, 85, 78, 95].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                className={`flex-1 rounded-sm ${i >= 12 ? 'bg-purple-500' : 'bg-purple-200'}`}
              />
            ))}
          </div>

          {/* Compute Power */}
          <div className="flex items-center justify-between py-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">Potenza di calcolo</span>
            <span className="text-sm font-bold text-purple-600 font-display">{currentUser.compute_power} TFLOPS</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Ultime attività</h3>
          <button
            onClick={() => setPage('transactions')}
            className="text-purple-500 text-xs font-semibold flex items-center gap-0.5 hover:text-purple-600 transition-colors"
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
              className="bg-white rounded-xl p-3.5 flex items-center gap-3 shadow-sm"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
              }`}>
                {tx.amount > 0 ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{tx.description}</p>
                <p className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString('it-IT')}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[10px] text-amber-700 leading-relaxed text-center">
            VYRO GPU ti offre un ambiente dinamico per seguire risultati, crescita del team
            e progressione della tua attivita in un'esperienza sempre fluida e aggiornata.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
