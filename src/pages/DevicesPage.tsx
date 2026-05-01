import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Clock, Check, AlertCircle, Loader2, Activity, Power, TrendingUp } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { GPUDevice } from '../types';

const gpuColors = [
  'from-violet-600 to-purple-700',
  'from-blue-600 to-indigo-700',
  'from-cyan-600 to-blue-700',
  'from-purple-600 to-pink-700',
  'from-indigo-600 to-violet-700',
  'from-teal-600 to-cyan-700',
  'from-fuchsia-600 to-purple-700',
  'from-blue-700 to-violet-700',
  'from-purple-700 to-indigo-800',
];

const statusConfig = {
  pending: { label: 'In attesa', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'In elaborazione', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  active: { label: 'Attivo', color: 'bg-green-100 text-green-700', icon: Check },
  completed: { label: 'Completato', color: 'bg-slate-100 text-slate-600', icon: Check },
};

const DevicesPage: React.FC = () => {
  const { gpuDevices, userDevices, activateDevice, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'center' | 'my'>('center');
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const handleActivate = (device: GPUDevice) => {
    setActivatingId(device.id);
    setTimeout(async () => {
      const result = await activateDevice(device.id);
      setToast({ msg: result.message, ok: result.success });
      setActivatingId(null);
      setTimeout(() => setToast(null), 3000);
      if (result.success) setActiveTab('my');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="gradient-primary px-4 pt-6 pb-8 relative z-10">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 border border-white/20 rounded-full" />
            <div className="absolute bottom-0 left-1/4 w-48 h-48 border border-white/10 rounded-full" />
          </div>
          
          <h1 className="font-display text-2xl font-bold text-white tracking-wider relative z-10">
            Centro GPU
          </h1>
          <p className="text-white/60 text-xs mt-1 relative z-10">Hardware per cloud computing</p>
          
          {/* Quick stats */}
          <div className="flex gap-3 mt-4 relative z-10">
            <div className="glass-dark rounded-lg px-3 py-2 flex items-center gap-2">
              <Cpu size={14} className="text-purple-400" />
              <span className="text-white text-xs font-medium">{gpuDevices.length} GPU</span>
            </div>
            <div className="glass-dark rounded-lg px-3 py-2 flex items-center gap-2">
              <Power size={14} className="text-cyan-400" />
              <span className="text-white text-xs font-medium">{userDevices.filter(d => d.status === 'active').length} Attive</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="glass-dark rounded-xl p-1 flex gap-1">
          {[
            { key: 'center' as const, label: 'Centro GPU', count: gpuDevices.length },
            { key: 'my' as const, label: 'I Miei Dispositivi', count: userDevices.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? 'gradient-primary text-white shadow-lg shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-2 ${
              toast.ok ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {toast.ok ? <Check size={16} /> : <AlertCircle size={16} />}
            <span className="text-sm font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-4 mt-4">
        {activeTab === 'center' ? (
          <div className="space-y-4">
            {gpuDevices.map((device, i) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="gpu-card-enhanced overflow-hidden"
              >
                {/* GPU Visual */}
                <div className={`bg-gradient-to-br ${gpuColors[i % gpuColors.length]} p-6 relative overflow-hidden`}>
                  {/* Animated background effects */}
                  <div className="absolute inset-0">
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-lg" />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/5 rounded-full"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">Modello</p>
                      <p className="font-display text-3xl font-bold text-white">{device.name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Zap size={14} className="text-yellow-300" />
                        <span className="text-white/90 text-sm font-semibold">{device.compute_power} TFLOPS</span>
                      </div>
                    </div>
                    
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/30 backdrop-blur-sm border border-white/10 shadow-xl relative animate-gpu-glow">
                      {device.image_url ? (
                        <img 
                          src={device.image_url} 
                          alt={device.name} 
                          className="w-full h-full object-cover"
                          style={{ filter: 'contrast(1.1) saturate(1.3)' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Cpu className="w-10 h-10 text-white/60" />
                        </div>
                      )}
                      {/* Scanner effect */}
                      <motion.div
                        animate={{ y: ['-100%', '300%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute left-0 right-0 h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 bg-slate-900/90">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl p-3 border border-purple-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={12} className="text-green-400" />
                        <p className="text-[10px] text-purple-300 uppercase tracking-wider">3 Giorni</p>
                      </div>
                      <p className="text-lg font-bold text-white font-display">{device.reward_3_days} <span className="text-xs text-purple-400">VX</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 rounded-xl p-3 border border-cyan-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity size={12} className="text-cyan-400" />
                        <p className="text-[10px] text-cyan-300 uppercase tracking-wider">7 Giorni</p>
                      </div>
                      <p className="text-lg font-bold text-white font-display">{device.reward_7_days} <span className="text-xs text-cyan-400">VX</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 p-3 bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="text-[10px] text-purple-300 uppercase tracking-wider mb-1">Prezzo attivazione</p>
                      <p className="text-2xl font-display font-bold text-neon-purple">{device.price.toLocaleString()} VX</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 mb-1">Il tuo saldo</p>
                      <p className={`text-sm font-bold font-display ${(currentUser?.vx_balance ?? 0) >= device.price ? 'text-green-400' : 'text-red-400'}`}>
                        {currentUser?.vx_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} VX
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleActivate(device)}
                    disabled={activatingId === device.id || (currentUser?.vx_balance ?? 0) < device.price}
                    className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      (currentUser?.vx_balance ?? 0) >= device.price
                        ? 'gradient-primary text-white glow-purple hover:opacity-90'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {activatingId === device.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap size={18} />
                        {(currentUser?.vx_balance ?? 0) >= device.price ? 'Attiva GPU' : 'Saldo insufficiente'}
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {userDevices.length === 0 ? (
              <div className="text-center py-16">
                <Cpu className="w-16 h-16 text-purple-500/50 mx-auto mb-4" />
                <p className="text-white font-medium">Nessun dispositivo attivato</p>
                <p className="text-slate-400 text-sm mt-1">Attiva il tuo primo dispositivo GPU</p>
                <button
                  onClick={() => setActiveTab('center')}
                  className="mt-4 px-6 py-3 gradient-primary text-white rounded-xl text-sm font-semibold glow-purple"
                >
                  Vai al Centro GPU
                </button>
              </div>
            ) : (
              userDevices.map((ud, i) => {
                const sc = statusConfig[ud.status];
                const StatusIcon = sc.icon;
                return (
                  <motion.div
                    key={ud.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="gpu-card-enhanced overflow-hidden"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border border-purple-500/30 flex items-center justify-center relative animate-gpu-glow">
                            {ud.device?.image_url ? (
                              <img src={ud.device.image_url} alt={ud.device.name} className="w-full h-full object-cover" />
                            ) : (
                              <Cpu className="w-7 h-7 text-purple-400" />
                            )}
                            {ud.status === 'active' && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <div>
                            <p className="font-display font-bold text-white text-lg">{ud.device?.name}</p>
                            <p className="text-[11px] text-slate-400">ID: {ud.id}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${sc.color}`}>
                          <StatusIcon size={12} className={ud.status === 'processing' ? 'animate-spin' : ''} />
                          {sc.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                          <p className="text-[9px] text-slate-400 uppercase mb-1">Potenza</p>
                          <p className="text-sm font-bold text-purple-400 font-display">{ud.device?.compute_power} TF</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                          <p className="text-[9px] text-slate-400 uppercase mb-1">Generato</p>
                          <p className="text-sm font-bold text-green-400 font-display">{ud.total_generated} VX</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-slate-700/50">
                          <p className="text-[9px] text-slate-400 uppercase mb-1">Avviato</p>
                          <p className="text-sm font-bold text-white font-display">
                            {new Date(ud.start_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>

                      {ud.status === 'active' && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2 text-green-400 text-sm">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <Activity size={14} />
                          <span className="font-medium">Produzione in corso...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-4 mt-6">
        <div className="glass-dark rounded-xl p-4">
          <p className="text-[11px] text-slate-400 leading-relaxed text-center">
            Ogni dispositivo amplia la tua presenza nella piattaforma e rende la dashboard
            più ricca di attività, potenza e progressione visiva.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DevicesPage;
