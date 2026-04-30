import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Zap, Cpu, UserPlus } from 'lucide-react';
import { useApp } from '../store/AppContext';

const TeamPage: React.FC = () => {
  const { currentUser, teamMembers } = useApp();
  const [activeLevel, setActiveLevel] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);

  if (!currentUser) return null;

  const inviteLink = `https://vyrogpu.com/invite/${currentUser.invite_code}`;
  const level1 = teamMembers.filter(m => m.level === 1);
  const level2 = teamMembers.filter(m => m.level === 2);
  const activeMembers = activeLevel === 1 ? level1 : level2;

  const teamEarnings = teamMembers.reduce((s, m) => s + m.production * (m.level === 1 ? 0.03 : 0.02), 0);
  const teamPower = teamMembers.reduce((s, m) => s + (m.device_active ? 4 : 0), 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24">
      {/* Header with background image */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop')" }}
        />
        <div className="gradient-dark px-4 pt-6 pb-8 relative z-10">
          <div className="absolute inset-0">
            <div className="absolute top-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
          </div>

          <h1 className="font-display text-xl font-bold text-white tracking-wider relative z-10 mb-2">
            Team & Inviti
          </h1>
          <p className="text-white/50 text-xs relative z-10">Costruisci il tuo team di cloud computing</p>

          {/* Robot Mascot with real photo */}
          <div className="flex justify-center mt-4 relative z-10">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-32 h-32 rounded-3xl overflow-hidden border border-white/10 shadow-lg relative"
            >
              <img
                src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=200&fit=crop&crop=center"
                alt="Robot Mascot"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581092160607-ee103cc6f3e2?w=200&h=200&fit=crop&crop=center';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent" />
              <p className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-white font-medium">VYRO Bot</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Invite Card */}
      <div className="px-4 -mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-card rounded-2xl p-5 text-white glow-purple"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wider">La tua posizione</p>
              <p className="font-display font-bold text-lg">Membro Attivo</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3 mb-3">
            <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Codice invito</p>
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-lg tracking-widest">{currentUser.invite_code}</p>
              <button
                onClick={handleCopy}
                className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* QR placeholder */}
          <div className="bg-white rounded-xl p-4 flex items-center gap-4">
            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
              <div className="grid grid-cols-5 gap-0.5">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-[1px] ${Math.random() > 0.4 ? 'bg-slate-800' : 'bg-transparent'}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-xs font-medium mb-1">Link invito</p>
              <p className="text-slate-500 text-[10px] truncate">{inviteLink}</p>
              <button
                onClick={handleCopy}
                className="mt-2 px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-[10px] font-bold flex items-center gap-1"
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
                {copied ? 'Copiato!' : 'Copia link'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Team Stats */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Users size={16} className="text-purple-500" />
          Il mio team
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Zap size={16} className="text-purple-500 mx-auto mb-1" />
            <p className="font-display font-bold text-purple-600">{teamEarnings.toFixed(2)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Guadagni VX</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Cpu size={16} className="text-blue-500 mx-auto mb-1" />
            <p className="font-display font-bold text-blue-600">{teamPower}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">TFLOPS Team</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Users size={16} className="text-cyan-500 mx-auto mb-1" />
            <p className="font-display font-bold text-cyan-600">{teamMembers.length}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Membri</p>
          </div>
        </div>
      </div>

      {/* Team Rates */}
      <div className="px-4 mt-4">
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs font-bold text-purple-700 mb-2">Ricompense team (crediti virtuali)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-purple-500 font-semibold">Livello 1 — Diretti</p>
              <p className="text-xs text-slate-600 mt-0.5">Attività: <span className="font-bold">3%</span></p>
              <p className="text-xs text-slate-600">Bonus invito: <span className="font-bold">5%</span></p>
            </div>
            <div>
              <p className="text-[10px] text-blue-500 font-semibold">Livello 2 — Indiretti</p>
              <p className="text-xs text-slate-600 mt-0.5">Attività: <span className="font-bold">2%</span></p>
              <p className="text-xs text-slate-600">Bonus invito: <span className="font-bold">3%</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Level Tabs */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1 mb-4">
          {[1, 2].map(lvl => (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl as 1 | 2)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeLevel === lvl
                  ? 'gradient-primary text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Livello {lvl} ({lvl === 1 ? level1.length : level2.length})
            </button>
          ))}
        </div>

        {/* Members Table */}
        <div className="space-y-2">
          {activeMembers.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nessun membro a questo livello</p>
            </div>
          ) : (
            activeMembers.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                    <img
                      src={`https://images.unsplash.com/photo-${1500000000000 + member.username.charCodeAt(0) * 1000}?w=100&h=100&fit=crop&crop=face`}
                      alt={member.username}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">${member.username[0]}</div>`;
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">{member.username}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {member.status === 'active' ? 'Attivo' : 'Inattivo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-400">
                        {new Date(member.created_at).toLocaleDateString('it-IT')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {member.device_active ? '🟢 GPU attiva' : '⚫ Nessun GPU'}
                      </span>
                      <span className="text-[10px] text-purple-600 font-semibold">
                        {member.production} VX
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 mt-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[10px] text-amber-700 leading-relaxed text-center">
            ⚠️ Le ricompense team sono crediti virtuali interni alla piattaforma VYRO GPU.
            Non rappresentano rendimenti finanziari reali. Le percentuali si applicano
            esclusivamente ai crediti virtuali generati dall'attività degli utenti.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
