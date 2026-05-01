import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Zap, Cpu, UserPlus, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useApp } from '../store/AppContext';

const TeamPage: React.FC = () => {
  const { currentUser, teamMembers } = useApp();
  const [activeLevel, setActiveLevel] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);

  if (!currentUser) return null;

  const inviteLink = `${window.location.origin}?ref=${currentUser.invite_code}`;
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="gradient-dark px-4 pt-6 pb-8 relative z-10">
          <div className="absolute inset-0">
            <div className="absolute top-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
          </div>

          <h1 className="font-display text-2xl font-bold text-white tracking-wider relative z-10 mb-2">
            Team & Inviti
          </h1>
          <p className="text-white/50 text-xs relative z-10">Costruisci il tuo team di cloud computing</p>

          {/* Robot Mascot */}
          <div className="flex justify-center mt-4 relative z-10">
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-28 h-28 rounded-2xl overflow-hidden border border-purple-500/30 shadow-lg shadow-purple-500/20 relative"
            >
              <img
                src="https://api.dicebear.com/7.x/bottts/svg?seed=vyro&backgroundColor=1e1b4b"
                alt="VYRO Bot"
                className="w-full h-full object-cover bg-purple-900"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent" />
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-2 left-0 right-0 text-center"
              >
                <span className="text-[9px] text-cyan-400 font-medium">VYRO Bot</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Invite Card */}
      <div className="px-4 -mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-card rounded-2xl p-5 text-white glow-purple border border-purple-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wider">La tua posizione</p>
              <p className="font-display font-bold text-lg flex items-center gap-2">
                Membro Attivo
                <Sparkles size={14} className="text-yellow-400" />
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/10">
              <UserPlus size={20} />
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-3 mb-3 border border-white/10">
            <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Codice invito</p>
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-lg tracking-widest text-neon-purple">{currentUser.invite_code}</p>
              <button
                onClick={handleCopy}
                className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* QR */}
          <div className="bg-white rounded-xl p-4 flex items-center gap-4">
            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center p-1.5">
              <QRCodeSVG
                value={inviteLink}
                size={68}
                fgColor="#7c3aed"
                bgColor="#ffffff"
                level="M"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-xs font-medium mb-1">Link invito</p>
              <p className="text-slate-500 text-[10px] truncate">{inviteLink}</p>
              <button
                onClick={handleCopy}
                className="mt-2 px-3 py-1.5 bg-purple-500/10 text-purple-600 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-purple-500/30"
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
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Users size={16} className="text-purple-400" />
          Il mio team
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-dark rounded-xl p-3 text-center border border-purple-500/20">
            <Zap size={16} className="text-purple-400 mx-auto mb-1" />
            <p className="font-display font-bold text-purple-400">{teamEarnings.toFixed(2)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Guadagni VX</p>
          </div>
          <div className="glass-dark rounded-xl p-3 text-center border border-purple-500/20">
            <Cpu size={16} className="text-cyan-400 mx-auto mb-1" />
            <p className="font-display font-bold text-cyan-400">{teamPower}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">TFLOPS Team</p>
          </div>
          <div className="glass-dark rounded-xl p-3 text-center border border-purple-500/20">
            <Users size={16} className="text-green-400 mx-auto mb-1" />
            <p className="font-display font-bold text-green-400">{teamMembers.length}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Membri</p>
          </div>
        </div>
      </div>

      {/* Team Rates */}
      <div className="px-4 mt-4">
        <div className="glass-dark rounded-xl p-4 border border-purple-500/20">
          <p className="text-xs font-bold text-purple-400 mb-2">Ricompense team</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
              <p className="text-[10px] text-purple-400 font-semibold mb-1">Livello 1 — Diretti</p>
              <p className="text-xs text-slate-300">Attività: <span className="font-bold text-white">3%</span></p>
              <p className="text-xs text-slate-300">Bonus invito: <span className="font-bold text-white">5%</span></p>
            </div>
            <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/20">
              <p className="text-[10px] text-cyan-400 font-semibold mb-1">Livello 2 — Indiretti</p>
              <p className="text-xs text-slate-300">Attività: <span className="font-bold text-white">2%</span></p>
              <p className="text-xs text-slate-300">Bonus invito: <span className="font-bold text-white">3%</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Level Tabs */}
      <div className="px-4 mt-6">
        <div className="glass-dark rounded-xl p-1 flex gap-1 mb-4 border border-purple-500/20">
          {[1, 2].map(lvl => (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl as 1 | 2)}
              className={`flex-1 py-3 rounded-lg text-xs font-semibold transition-all ${
                activeLevel === lvl
                  ? 'gradient-primary text-white shadow-md shadow-purple-500/30'
                  : 'text-slate-400 hover:text-white'
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
              <Users className="w-12 h-12 text-purple-500/50 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Nessun membro a questo livello</p>
            </div>
          ) : (
            activeMembers.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-dark rounded-xl p-4 border border-purple-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border border-purple-500/30">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                      alt={member.username}
                      className="w-full h-full object-cover bg-purple-900"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{member.username}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        member.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-700 text-slate-400'
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
                      <span className="text-[10px] text-purple-400 font-semibold">
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
        <div className="glass-dark rounded-xl p-4 border border-purple-500/20">
          <p className="text-[10px] text-slate-400 leading-relaxed text-center">
            Il programma team valorizza la crescita della tua rete con bonus progressivi,
            attività condivise e una panoramica chiara dei risultati generati dai membri invitati.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
