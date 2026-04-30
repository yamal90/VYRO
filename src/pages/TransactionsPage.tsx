import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownCircle, ArrowUpCircle, Cpu, Users, Gift,
  Star, Clock, Check, X, Filter
} from 'lucide-react';
import { useApp } from '../store/AppContext';
// types used inline

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  deposit: { icon: ArrowDownCircle, label: 'Ricarica', color: 'bg-green-100 text-green-600' },
  withdrawal: { icon: ArrowUpCircle, label: 'Prelievo', color: 'bg-red-100 text-red-500' },
  device_purchase: { icon: Cpu, label: 'Acquisto GPU', color: 'bg-purple-100 text-purple-600' },
  device_reward: { icon: Star, label: 'Produzione GPU', color: 'bg-amber-100 text-amber-600' },
  team_bonus: { icon: Users, label: 'Bonus Team', color: 'bg-blue-100 text-blue-600' },
  daily_claim: { icon: Gift, label: 'Claim Giornaliero', color: 'bg-cyan-100 text-cyan-600' },
  login_bonus: { icon: Gift, label: 'Bonus Login', color: 'bg-emerald-100 text-emerald-600' },
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  completed: { label: 'Completato', icon: Check, color: 'text-green-600 bg-green-50' },
  pending: { label: 'In attesa', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  rejected: { label: 'Rifiutato', icon: X, color: 'text-red-600 bg-red-50' },
};

type FilterType = 'all' | 'deposit' | 'withdrawal' | 'device_purchase' | 'device_reward' | 'team_bonus' | 'daily_claim' | 'login_bonus';

const TransactionsPage: React.FC = () => {
  const { transactions } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Tutte' },
    { key: 'deposit', label: 'Entrate' },
    { key: 'withdrawal', label: 'Uscite' },
    { key: 'device_purchase', label: 'GPU' },
    { key: 'team_bonus', label: 'Team' },
    { key: 'daily_claim', label: 'Claim' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24">
      {/* Header */}
      <div className="gradient-primary px-4 pt-6 pb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 border border-white/20 rounded-full" />
        </div>
        <h1 className="font-display text-xl font-bold text-white tracking-wider relative z-10">
          Transazioni
        </h1>
        <p className="text-white/60 text-xs mt-1 relative z-10">Storico movimenti crediti virtuali</p>
      </div>

      {/* Filters */}
      <div className="px-4 mt-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'gradient-primary text-white shadow-md'
                  : 'bg-white text-slate-500 shadow-sm hover:text-slate-700'
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
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Totale entrate</p>
            <p className="font-display font-bold text-green-600 text-lg mt-1">
              +{transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0).toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400">VX token</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Totale uscite</p>
            <p className="font-display font-bold text-red-500 text-lg mt-1">
              {transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0).toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400">VX token</p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Nessuna transazione trovata</p>
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
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-50"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : tx.id)}
                  className="w-full p-3.5 flex items-center gap-3 text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tc.color}`}>
                    <TxIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{tx.description}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400">{tx.currency}</p>
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-slate-100 px-3.5 py-3 bg-slate-50/50"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase">Tipo</p>
                        <p className="text-xs font-medium text-slate-700">{tc.label}</p>
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
                        <p className="text-xs font-mono text-slate-600">{tx.id}</p>
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
