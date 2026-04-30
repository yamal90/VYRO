import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Clock, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { GPUDevice } from '../types';

const gpuColors = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-cyan-500 to-blue-600',
  'from-purple-500 to-pink-600',
  'from-indigo-500 to-violet-600',
  'from-teal-500 to-cyan-600',
  'from-fuchsia-500 to-purple-600',
  'from-blue-600 to-violet-600',
  'from-purple-600 to-indigo-700',
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
    setTimeout(() => {
      const result = activateDevice(device.id);
      setToast({ msg: result.message, ok: result.success });
      setActivatingId(null);
      setTimeout(() => setToast(null), 3000);
      if (result.success) setActiveTab('my');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24">
      {/* Header */}
      <div className="gradient-primary px-4 pt-6 pb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 border border-white/20 rounded-full" />
        </div>
        <h1 className="font-display text-xl font-bold text-white tracking-wider relative z-10">
          Centro Dispositivi
        </h1>
        <p className="text-white/60 text-xs mt-1 relative z-10">GPU virtuali per il cloud computing</p>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-0 relative z-10">
        <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1 mb-4 mt-4">
          {[
            { key: 'center' as const, label: 'Centro Dispositivi' },
            { key: 'my' as const, label: 'I Miei Dispositivi' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'gradient-primary text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mx-4 mb-4 p-3 rounded-xl flex items-center gap-2 ${
              toast.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {toast.ok ? <Check size={16} /> : <AlertCircle size={16} />}
            <span className="text-sm font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-4">
        {activeTab === 'center' ? (
          <div className="space-y-4">
            {gpuDevices.map((device, i) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100"
              >
                {/* GPU Visual */}
                <div className={`bg-gradient-to-br ${gpuColors[i % gpuColors.length]} p-5 relative overflow-hidden`}>
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-white/70 text-[10px] uppercase tracking-widest">Modello</p>
                      <p className="font-display text-2xl font-bold text-white">{device.name}</p>
                    </div>
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      {device.image_url ? (
                        <img src={device.image_url} alt={device.name} className="w-full h-full object-cover" />
                      ) : (
                        <Cpu className="w-8 h-8 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 relative z-10">
                    <Zap size={12} className="text-yellow-300" />
                    <span className="text-white/90 text-xs font-semibold">{device.compute_power} TFLOPS</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Produzione 3 giorni</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{device.reward_3_days} VX</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Produzione 7 giorni</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{device.reward_7_days} VX</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Prezzo attivazione</p>
                      <p className="text-lg font-display font-bold text-purple-600">{device.price.toLocaleString()} VX</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Il tuo saldo</p>
                      <p className={`text-sm font-bold ${(currentUser?.vx_balance ?? 0) >= device.price ? 'text-green-600' : 'text-red-500'}`}>
                        {currentUser?.vx_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} VX
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleActivate(device)}
                    disabled={activatingId === device.id || (currentUser?.vx_balance ?? 0) < device.price}
                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                      (currentUser?.vx_balance ?? 0) >= device.price
                        ? 'gradient-primary text-white glow-purple hover:opacity-90'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {activatingId === device.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap size={16} />
                        {(currentUser?.vx_balance ?? 0) >= device.price ? 'Attiva dispositivo' : 'Saldo insufficiente'}
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
                <Cpu className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Nessun dispositivo attivato</p>
                <p className="text-slate-400 text-sm mt-1">Attiva il tuo primo dispositivo GPU</p>
                <button
                  onClick={() => setActiveTab('center')}
                  className="mt-4 px-6 py-2.5 gradient-primary text-white rounded-xl text-sm font-semibold"
                >
                  Vai al Centro
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
                    className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                            {ud.device?.image_url ? (
                              <img src={ud.device.image_url} alt={ud.device.name} className="w-full h-full object-cover" />
                            ) : (
                              <Cpu className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-display font-bold text-slate-800">{ud.device?.name}</p>
                            <p className="text-[10px] text-slate-400">ID: {ud.id}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${sc.color}`}>
                          <StatusIcon size={12} className={ud.status === 'processing' ? 'animate-spin' : ''} />
                          {sc.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                          <p className="text-[9px] text-slate-400 uppercase">Potenza</p>
                          <p className="text-xs font-bold text-purple-600">{ud.device?.compute_power} TF</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                          <p className="text-[9px] text-slate-400 uppercase">Generato</p>
                          <p className="text-xs font-bold text-green-600">{ud.total_generated} VX</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                          <p className="text-[9px] text-slate-400 uppercase">Avviato</p>
                          <p className="text-xs font-bold text-slate-600">
                            {new Date(ud.start_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>

                      {ud.status === 'active' && (
                        <div className="mt-3 flex items-center gap-2 text-green-600 text-xs">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          Produzione in corso...
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
        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          I dispositivi virtuali producono crediti VX simulati all'interno della piattaforma.
          Non rappresentano hardware reale né rendimenti finanziari.
        </p>
      </div>
    </div>
  );
};

export default DevicesPage;
