import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Clock, Check, AlertCircle, Loader2, Activity, Power, TrendingUp } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { GPUDevice } from '../types';
import LiveProductionInline from '../components/LiveProductionInline';

const gpuColors = [
  'from-[#0c101c] to-[#111827]',
  'from-[#0f1629] to-[#0c1220]',
  'from-[#0c101c] to-[#111827]',
  'from-[#0f1629] to-[#0c1220]',
  'from-[#0c101c] to-[#111827]',
  'from-[#0f1629] to-[#0c1220]',
  'from-[#0c101c] to-[#111827]',
  'from-[#0f1629] to-[#0c1220]',
  'from-[#0c101c] to-[#111827]',
];

const statusConfig = {
  pending: { label: 'In attesa', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  processing: { label: 'In elaborazione', color: 'bg-blue-100 text-blue-700', icon: Loader2 },
  active: { label: 'Attivo', color: 'bg-green-100 text-green-700', icon: Check },
  completed: { label: 'Completato', color: 'bg-slate-100 text-slate-600', icon: Check },
};

const CYCLE_DAYS = 7;
const CYCLE_MS = CYCLE_DAYS * 24 * 60 * 60 * 1000;

const DevicesPage: React.FC = () => {
  const { gpuDevices, userDevices, activateDevice, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'center' | 'my'>('center');
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const liveGeneratedById = useMemo(() => {
    const result = new Map<string, number>();
    for (const ud of userDevices) {
      const cycleTarget = Number(ud.device?.reward_7_days ?? 0);
      const startMs = Date.parse(ud.start_date);
      if (!Number.isFinite(cycleTarget) || cycleTarget <= 0 || !Number.isFinite(startMs) || startMs <= 0) {
        result.set(ud.id, Number(ud.total_generated ?? 0));
        continue;
      }
      const elapsedMs = Math.max(0, nowMs - startMs);
      const elapsedInCycleMs = elapsedMs % CYCLE_MS;
      result.set(ud.id, Number((cycleTarget * (elapsedInCycleMs / CYCLE_MS)).toFixed(2)));
    }
    return result;
  }, [userDevices, nowMs]);

  const handleActivate = async (device: GPUDevice) => {
    setActivatingId(device.id);
    const result = await activateDevice(device.id);
    setToast({ msg: result.message, ok: result.success });
    setActivatingId(null);
    setTimeout(() => setToast(null), 3000);
    if (result.success) setActiveTab('my');
  };

  return (
    <div className="min-h-screen bg-[#06080f] pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1600&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-[#06080f]/60" />
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-amber-500/12 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="px-4 pt-6 pb-8 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c101c]/85 via-[#0a0e1a]/80 to-[#06080f]/90" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 border border-white/20 rounded-full" />
            <div className="absolute bottom-0 left-1/4 w-48 h-48 border border-white/10 rounded-full" />
          </div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-wider">Centro GPU</h1>
              <p className="text-white/60 text-xs mt-1">Hardware per cloud computing</p>
            </div>
            <img src="/vyro-wow-logo.svg" alt="VYRO" className="h-11 w-11 rounded-xl border border-white/15 bg-[#0c101c]/50" />
          </div>
          
          {/* Quick stats */}
          <div className="flex gap-3 mt-4 relative z-10">
            <div className="glass-dark rounded-lg px-3 py-2 flex items-center gap-2">
              <Cpu size={14} className="text-amber-400" />
              <span className="text-white text-xs font-medium">{gpuDevices.length} GPU</span>
            </div>
            <div className="glass-dark rounded-lg px-3 py-2 flex items-center gap-2">
              <Power size={14} className="text-emerald-400" />
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
                  ? 'bg-amber-500 text-[#06080f] shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-white/10'
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
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-xl" />
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
                      <p className="font-display text-2xl font-bold text-white leading-tight">{device.name}</p>
                      {device.description && <p className="text-white/85 text-[11px] mt-1">{device.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Zap size={14} className="text-yellow-300" />
                        <span className="text-white/90 text-sm font-semibold">{device.compute_power} TFLOPS</span>
                      </div>
                    </div>
                    <div className="w-36 h-36 rounded-2xl overflow-hidden bg-black/30 border border-white/20 shadow-xl relative p-1.5">
                      {device.image_url ? (
                        <img
                          src={device.image_url}
                          alt={device.name}
                          className="w-full h-full object-cover rounded-xl"
                          style={{ filter: 'brightness(1.14) contrast(1.12) saturate(1.12)' }}
                          onError={(e) => {
                            const el = e.currentTarget;
                            const clean = (device.image_url || '').split('?')[0];
                            if (el.src.endsWith(clean)) return;
                            el.src = clean;
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Cpu className="w-10 h-10 text-white/60" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 bg-[#0c101c]/90">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-[#0c101c]/60 to-[#0c101c]/40 rounded-xl p-3 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={12} className="text-green-400" />
                        <p className="text-[10px] text-amber-300 uppercase tracking-wider">3 Giorni</p>
                      </div>
                      <p className="text-lg font-bold text-white font-display">{device.reward_3_days} <span className="text-xs text-amber-400">$</span></p>
                    </div>
                    <div className="bg-gradient-to-br from-[#0c101c]/60 to-[#0c101c]/40 rounded-xl p-3 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity size={12} className="text-emerald-400" />
                        <p className="text-[10px] text-emerald-400 uppercase tracking-wider">7 Giorni</p>
                      </div>
                      <p className="text-lg font-bold text-white font-display">{device.reward_7_days} <span className="text-xs text-emerald-400">$</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 p-3 bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="text-[10px] text-amber-300 uppercase tracking-wider mb-1">Prezzo attivazione</p>
                      <p className="text-2xl font-display font-bold text-neon-purple">{device.price.toLocaleString()} $</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 mb-1">Il tuo saldo</p>
                      <p className={`text-sm font-bold font-display ${(currentUser?.vx_balance ?? 0) >= device.price ? 'text-green-400' : 'text-red-400'}`}>
                        {currentUser?.vx_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} $
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => void handleActivate(device)}
                    disabled={activatingId === device.id || (currentUser?.vx_balance ?? 0) < device.price}
                    className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      (currentUser?.vx_balance ?? 0) >= device.price
                        ? 'gradient-primary text-white glow-purple hover:opacity-90'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/6'
                    }`}
                  >
                    {activatingId === device.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap size={18} />
                        {(currentUser?.vx_balance ?? 0) >= device.price ? 'Attiva GPU' : 'Saldo Dollaro insufficiente'}
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live Production Bar - only show when user has devices */}
            <LiveProductionInline />
            
            {userDevices.length === 0 ? (
              <div className="text-center py-16">
                <Cpu className="w-16 h-16 text-amber-500/50 mx-auto mb-4" />
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
                const liveGenerated = liveGeneratedById.get(ud.id) ?? Number(ud.total_generated ?? 0);
                const livePercent = Number(
                  Math.min(
                    100,
                    (liveGenerated / Math.max(Number(ud.device?.reward_7_days ?? 1), 1)) * 100,
                  ).toFixed(2),
                );
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
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border border-amber-500/25 flex items-center justify-center relative animate-gpu-glow">
                            {ud.device?.image_url ? (
                              <img src={ud.device.image_url} alt={ud.device.name} className="w-full h-full object-cover" />
                            ) : (
                              <Cpu className="w-7 h-7 text-amber-400" />
                            )}
                            {ud.status === 'active' && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            )}
                          </div>
                          <div>
                            <p className="font-display font-bold text-white text-lg">{ud.device?.name}</p>
                            {ud.device?.description && (
                              <p className="text-[11px] text-slate-300 mt-0.5">{ud.device.description}</p>
                            )}
                            <p className="text-[11px] text-slate-400">ID: {ud.id}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${sc.color}`}>
                          <StatusIcon size={12} className={ud.status === 'processing' ? 'animate-spin' : ''} />
                          {sc.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-white/6">
                          <p className="text-[9px] text-slate-400 uppercase mb-1">Potenza</p>
                          <p className="text-sm font-bold text-amber-400 font-display">{ud.device?.compute_power} TF</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-white/6">
                          <p className="text-[9px] text-slate-400 uppercase mb-1">Generato</p>
                          <p className="text-sm font-bold text-green-400 font-display">{liveGenerated.toFixed(2)} $</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center border border-white/6">
                          <p className="text-[9px] text-slate-400 uppercase mb-1">Avviato</p>
                          <p className="text-sm font-bold text-white font-display">
                            {new Date(ud.start_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>

                      {ud.status === 'active' && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <Activity size={14} />
                            <span className="font-medium">Produzione in corso...</span>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-[10px] text-green-300 mb-1">
                              <span>Produzione live</span>
                              <span>{livePercent.toFixed(2)}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-[#0c101c]/50 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                                style={{ width: `${livePercent}%` }}
                              />
                            </div>
                          </div>
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
