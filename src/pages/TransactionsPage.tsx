import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownCircle, ArrowUpCircle, Cpu, Users, Gift,
  Star, Clock, Check, X, Filter, TrendingUp, TrendingDown
} from 'lucide-react';
import { useApp } from '../store/AppContext';

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  deposit: { icon: ArrowDownCircle, label: 'Ricarica', color: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  withdrawal: { icon: ArrowUpCircle, label: 'Prelievo', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  device_purchase: { icon: Cpu, label: 'Acquisto GPU', color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30' },
  device_reward: { icon: Star, label: 'Produzione GPU', color: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  team_bonus: { icon: Users, label: 'Bonus Team', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  daily_claim: { icon: Gift, label: 'Claim Giornaliero', color: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' },
  login_bonus: { icon: Gift, label: 'Bonus Login', color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  completed: { label: 'Completato', icon: Check, color: 'text-green-400 bg-green-500/20' },
  pending: { label: 'In attesa', icon: Clock, color: 'text-yellow-400 bg-yellow-500/20' },
  rejected: { label: 'Rifiutato', icon: X, color: 'text-red-400 bg-red-500/20' },
};

type FilterType = 'all' | 'deposit' | 'withdrawal' | 'device_purchase' | 'device_reward' | 'team_bonus' | 'daily_claim' | 'login_bonus';

const TransactionsPage: React.FC = () => {
  const { transactions } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter);

  const totalIncome = transactions.filter((t) => t.amount > 0 && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.amount < 0 && t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const currencyLabel = (currency: string) => (currency === 'VX' ? 'Dollaro' : currency);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tutte' },
    { key: 'deposit', label: 'Entrate' },
    { key: 'withdrawal', label: 'Uscite' },
    { key: 'device_purchase', label: 'GPU' },
    { key: 'team_bonus', label: 'Team' },
    { key: 'daily_claim', label: 'Claim' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="gradient-primary px-4 pt-6 pb-8 relative z-10">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 border border-white/20 rounded-full" />
          </div>
          
          <h1 className="font-display text-2xl font-bold text-white tracking-wider relative z-10">
            Transazioni
          </h1>
          <p className="text-white/50 text-xs mt-1 relative z-10">Storico completo dei movimenti account</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 mt-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'gradient-primary text-white shadow-md shadow-purple-500/30'
                  : 'glass-dark text-slate-400 border border-purple-500/20 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-dark rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-400" />
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Totale entrate</p>
            </div>
            <p className="font-display font-bold text-green-400 text-xl">
              +{totalIncome.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400">Dollaro</p>
          </div>
          <div className="glass-dark rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-red-400" />
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Totale uscite</p>
            </div>
            <p className="font-display font-bold text-red-400 text-xl">
              {totalExpense.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400">Dollaro</p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="w-12 h-12 text-purple-500/50 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Nessuna transazione trovata</p>
          </div>
        ) : (
          filtered.map((tx, i) => {
            const tc = typeConfig[tx.type] || typeConfig.deposit;
            const sc = statusConfig[tx.status] || statusConfig.completed;
            const TxIcon = tc.icon;
            const StatusIcon = sc.icon;
            const isExpanded = expanded === tx.id;

            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-dark rounded-xl overflow-hidden border border-purple-500/20"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : tx.id)}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tc.color}`}>
                    <TxIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold font-display ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400">{currencyLabel(tx.currency)}</p>
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-purple-500/10 px-4 py-3 bg-slate-900/50"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase">Tipo</p>
                        <p className="text-xs font-medium text-white">{tc.label}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase">Stato</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.color}`}>
                          <StatusIcon size={10} />
                          {sc.label}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] text-slate-400 uppercase">ID Transazione</p>
                        <p className="text-xs font-mono text-purple-400">{tx.id}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
