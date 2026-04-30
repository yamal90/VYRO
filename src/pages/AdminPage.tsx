import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Users, Cpu, Activity, ArrowLeft,
  UserX, Edit3, Check, X, Eye
} from 'lucide-react';
import { useApp } from '../store/AppContext';

type AdminTab = 'users' | 'devices' | 'transactions' | 'logs';

const AdminPage: React.FC = () => {
  const {
    currentUser, allUsers, userDevices, transactions,
    setPage, updateUserBalance, updateDeviceStatus, blockUser
  } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg font-bold">Accesso negato</p>
          <button onClick={() => setPage('home')} className="mt-4 text-purple-400 text-sm">
            Torna alla home
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: 'users', label: 'Utenti', icon: Users },
    { key: 'devices', label: 'Dispositivi', icon: Cpu },
    { key: 'transactions', label: 'Transazioni', icon: Activity },
    { key: 'logs', label: 'Log', icon: Eye },
  ];

  const handleSaveBalance = (userId: string) => {
    const amount = parseFloat(editBalance);
    if (!isNaN(amount)) {
      updateUserBalance(userId, 'vx_balance', amount);
    }
    setEditingUser(null);
    setEditBalance('');
  };

  const logs = [
    { time: '2025-06-15 14:30', action: 'Approvato dispositivo ud-2', admin: 'AdminVyro' },
    { time: '2025-06-15 12:00', action: 'Modificato saldo usr-001', admin: 'AdminVyro' },
    { time: '2025-06-14 18:00', action: 'Bloccato utente usr-spam', admin: 'AdminVyro' },
    { time: '2025-06-14 09:00', action: 'Creato nuovo modello GPU', admin: 'AdminVyro' },
    { time: '2025-06-13 16:30', action: 'Aggiornata percentuale team L1', admin: 'AdminVyro' },
  ];

  return (
    <div className="min-h-screen gradient-dark pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setPage('home')}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-white tracking-wider flex items-center gap-2">
              <Shield size={20} className="text-yellow-400" />
              Admin Panel
            </h1>
            <p className="text-white/40 text-xs">Gestione piattaforma VYRO GPU</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Utenti', value: allUsers.length, color: 'from-purple-500 to-violet-600' },
            { label: 'Dispositivi', value: userDevices.length, color: 'from-blue-500 to-indigo-600' },
            { label: 'Transazioni', value: transactions.length, color: 'from-cyan-500 to-teal-600' },
            { label: 'Attivi', value: userDevices.filter(d => d.status === 'active').length, color: 'from-green-500 to-emerald-600' },
          ].map(stat => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-xl p-3 text-center`}>
              <p className="font-display text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[9px] text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  activeTab === tab.key
                    ? 'bg-purple-600 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                <TabIcon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4">
        {activeTab === 'users' && (
          <div className="space-y-2">
            {allUsers.map(user => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-white text-xs font-bold">
                      {user.username[0]}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{user.username}</p>
                      <p className="text-white/40 text-[10px]">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingUser(user.id);
                        setEditBalance(user.vx_balance.toString());
                      }}
                      className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/30"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={() => blockUser(user.id)}
                      className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30"
                    >
                      <UserX size={12} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-[9px] text-white/40">VX</p>
                    <p className="text-xs font-bold text-purple-400">{user.vx_balance.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-[9px] text-white/40">USDT</p>
                    <p className="text-xs font-bold text-green-400">{user.demo_usdt_balance.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-[9px] text-white/40">TFLOPS</p>
                    <p className="text-xs font-bold text-cyan-400">{user.compute_power}</p>
                  </div>
                </div>

                {editingUser === user.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 flex items-center gap-2"
                  >
                    <input
                      type="number"
                      value={editBalance}
                      onChange={e => setEditBalance(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                      placeholder="Nuovo saldo VX"
                    />
                    <button
                      onClick={() => handleSaveBalance(user.id)}
                      className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="space-y-2">
            {userDevices.map(ud => (
              <div key={ud.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white text-sm font-semibold">{ud.device?.name}</p>
                    <p className="text-white/40 text-[10px]">ID: {ud.id} | User: {ud.user_id}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    ud.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    ud.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    ud.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {ud.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {(['pending', 'processing', 'active', 'completed'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => updateDeviceStatus(ud.id, status)}
                      className={`px-2 py-1 rounded text-[9px] font-semibold transition-all ${
                        ud.status === status
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/5 text-white/40 hover:text-white/70'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-2">
            {transactions.slice(0, 15).map(tx => (
              <div key={tx.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  tx.status === 'completed' ? 'bg-green-500' :
                  tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">{tx.description}</p>
                  <p className="text-white/30 text-[9px]">{tx.id}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} {tx.currency}
                  </p>
                  <p className="text-white/30 text-[9px]">
                    {new Date(tx.created_at).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={12} className="text-yellow-400" />
                  <p className="text-white/60 text-[10px]">{log.time}</p>
                  <span className="text-purple-400 text-[10px] font-bold ml-auto">{log.admin}</span>
                </div>
                <p className="text-white text-xs">{log.action}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
