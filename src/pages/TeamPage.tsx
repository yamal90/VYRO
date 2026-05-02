import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Zap, Cpu, UserPlus, Sparkles, ChevronDown, Brain } from 'lucide-react';
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

  const l1Count = level1.length;
  const l2Count = level2.length;
  const totalNodes = l1Count + l2Count;

  return (
    <div className="min-h-screen bg-[#06080f] pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/12 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-emerald-500/12 rounded-full blur-3xl" />
        </div>
        
        <div className="gradient-dark px-4 pt-6 pb-6 relative z-10">
          <h1 className="font-display text-2xl font-bold text-white tracking-wider relative z-10 mb-1">
            Team & Inviti
          </h1>
          <p className="text-white/50 text-xs relative z-10">Costruisci il tuo team di cloud computing</p>

          {/* AI Neural Network Flow Visualization */}
          <div className="mt-5 relative z-10">
            <div className="relative bg-[#080c16]/80 rounded-2xl border border-amber-500/10 p-4 overflow-hidden">
              {/* Animated background grid */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: 'linear-gradient(rgba(240,180,41,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(240,180,41,0.5) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }} />

              {/* Header label */}
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 rounded-full border border-amber-400/40 flex items-center justify-center"
                >
                  <Brain size={10} className="text-amber-400" />
                </motion.div>
                <span className="text-[10px] text-amber-400/80 font-semibold uppercase tracking-widest">AI Network Graph</span>
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="ml-auto text-[8px] text-emerald-400 font-medium"
                >
                  ● LIVE
                </motion.span>
              </div>

              {/* SVG Neural Network */}
              <div className="relative" style={{ height: l1Count > 0 ? (l2Count > 0 ? '200px' : '140px') : '80px' }}>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="lineGradL1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0b429" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#f0b429" stopOpacity="0.15" />
                    </linearGradient>
                    <linearGradient id="lineGradL2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                    </linearGradient>
                    <filter id="nodeGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="pulseGlow">
                      <feGaussianBlur stdDeviation="2" />
                    </filter>
                  </defs>

                  {/* Connection lines from center to L1 nodes */}
                  {level1.slice(0, 5).map((_, i) => {
                    const l1x = l1Count <= 1 ? 160 : 60 + (i * (200 / (Math.min(l1Count, 5) - 1)));
                    return (
                      <g key={`line-l1-${i}`}>
                        <line x1="160" y1="28" x2={l1x} y2="90" stroke="url(#lineGradL1)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                        {/* Animated pulse traveling along line */}
                        <circle r="2.5" fill="#f0b429" filter="url(#pulseGlow)">
                          <animateMotion dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite">
                            <mpath href={`#path-l1-${i}`} />
                          </animateMotion>
                        </circle>
                        <path id={`path-l1-${i}`} d={`M160,28 L${l1x},90`} fill="none" stroke="none" />
                      </g>
                    );
                  })}

                  {/* Connection lines from L1 to L2 nodes */}
                  {level2.slice(0, 4).map((_, i) => {
                    const l2x = l2Count <= 1 ? 160 : 80 + (i * (160 / (Math.min(l2Count, 4) - 1)));
                    const parentL1x = l1Count <= 1 ? 160 : 60 + (Math.floor(i * Math.min(l1Count, 5) / Math.min(l2Count, 4)) * (200 / (Math.min(l1Count, 5) - 1)));
                    return (
                      <g key={`line-l2-${i}`}>
                        <line x1={parentL1x} y1="90" x2={l2x} y2="160" stroke="url(#lineGradL2)" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
                        <circle r="2" fill="#10b981" filter="url(#pulseGlow)">
                          <animateMotion dur={`${2 + i * 0.4}s`} repeatCount="indefinite">
                            <mpath href={`#path-l2-${i}`} />
                          </animateMotion>
                        </circle>
                        <path id={`path-l2-${i}`} d={`M${parentL1x},90 L${l2x},160`} fill="none" stroke="none" />
                      </g>
                    );
                  })}

                  {/* Central node (YOU) */}
                  <g filter="url(#nodeGlow)">
                    <circle cx="160" cy="24" r="18" fill="#0c101c" stroke="#f0b429" strokeWidth="2" />
                    <circle cx="160" cy="24" r="12" fill="#f0b429" opacity="0.15" />
                    <text x="160" y="28" textAnchor="middle" fill="#f0b429" fontSize="9" fontWeight="bold" fontFamily="Orbitron, sans-serif">TU</text>
                    {/* Orbiting ring */}
                    <circle cx="160" cy="24" r="22" fill="none" stroke="#f0b429" strokeWidth="0.5" opacity="0.3" strokeDasharray="3 5">
                      <animateTransform attributeName="transform" type="rotate" from="0 160 24" to="360 160 24" dur="8s" repeatCount="indefinite" />
                    </circle>
                  </g>

                  {/* L1 member nodes */}
                  {level1.slice(0, 5).map((member, i) => {
                    const cx = l1Count <= 1 ? 160 : 60 + (i * (200 / (Math.min(l1Count, 5) - 1)));
                    const isActive = member.device_active;
                    return (
                      <g key={`node-l1-${member.id}`}>
                        {/* Pulse ring for active */}
                        {isActive && (
                          <circle cx={cx} cy="90" r="14" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.4">
                            <animate attributeName="r" values="14;20;14" dur="2.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <circle cx={cx} cy="90" r="12" fill="#0c101c" stroke={isActive ? '#10b981' : '#f0b429'} strokeWidth="1.5" opacity="0.9" />
                        <circle cx={cx} cy="90" r="3" fill={isActive ? '#10b981' : '#f0b429'} opacity="0.6" />
                        <text x={cx} y="110" textAnchor="middle" fill="white" fontSize="7" opacity="0.6" fontFamily="Inter, sans-serif">{member.username.slice(0, 6)}</text>
                      </g>
                    );
                  })}

                  {/* L2 member nodes */}
                  {level2.slice(0, 4).map((member, i) => {
                    const cx = l2Count <= 1 ? 160 : 80 + (i * (160 / (Math.min(l2Count, 4) - 1)));
                    const isActive = member.device_active;
                    return (
                      <g key={`node-l2-${member.id}`}>
                        <circle cx={cx} cy="160" r="9" fill="#0c101c" stroke={isActive ? '#10b981' : '#334155'} strokeWidth="1" opacity="0.7" />
                        <circle cx={cx} cy="160" r="2.5" fill={isActive ? '#10b981' : '#475569'} opacity="0.5" />
                        <text x={cx} y="176" textAnchor="middle" fill="white" fontSize="6" opacity="0.4" fontFamily="Inter, sans-serif">{member.username.slice(0, 5)}</text>
                      </g>
                    );
                  })}

                  {/* Empty state */}
                  {l1Count === 0 && (
                    <text x="160" y="65" textAnchor="middle" fill="#475569" fontSize="9" fontFamily="Inter, sans-serif">Invita il tuo primo membro</text>
                  )}
                </svg>
              </div>

              {/* Stats bar at bottom */}
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5 relative z-10">
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-white/40">Nodi: <span className="text-amber-400 font-bold">{totalNodes + 1}</span></span>
                  <span className="text-[9px] text-white/40">L1: <span className="text-amber-400 font-bold">{l1Count}</span></span>
                  <span className="text-[9px] text-white/40">L2: <span className="text-emerald-400 font-bold">{l2Count}</span></span>
                </div>
                <div className="flex items-center gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-amber-400"
                  />
                  <span className="text-[8px] text-white/30 uppercase tracking-wider">Syncing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Card */}
      <div className="px-4 -mt-2 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0c101c] rounded-2xl p-5 text-white border border-amber-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wider">La tua posizione</p>
              <p className="font-display font-bold text-lg flex items-center gap-2">
                Membro Attivo
                <Sparkles size={14} className="text-amber-400" />
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center border border-amber-500/20">
              <UserPlus size={20} className="text-amber-400" />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 mb-3 border border-white/6">
            <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Codice invito</p>
            <div className="flex items-center justify-between">
              <p className="font-display font-bold text-lg tracking-widest text-amber-400">{currentUser.invite_code}</p>
              <button
                onClick={handleCopy}
                className="w-8 h-8 rounded-lg bg-amber-500/12 flex items-center justify-center hover:bg-amber-500/20 transition-colors border border-amber-500/20"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-amber-400" />}
              </button>
            </div>
          </div>

          {/* QR */}
          <div className="bg-white rounded-xl p-4 flex items-center gap-4">
            <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center p-1.5">
              <QRCodeSVG
                value={inviteLink}
                size={68}
                fgColor="#d4940a"
                bgColor="#ffffff"
                level="M"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-xs font-medium mb-1">Link invito</p>
              <p className="text-slate-500 text-[10px] truncate">{inviteLink}</p>
              <button
                onClick={handleCopy}
                className="mt-2 px-3 py-1.5 bg-amber-500/10 text-amber-700 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-amber-500/25"
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
          <Users size={16} className="text-amber-400" />
          Il mio team
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0c101c] rounded-xl p-3 text-center border border-amber-500/15">
            <Zap size={16} className="text-amber-400 mx-auto mb-1" />
            <p className="font-display font-bold text-amber-400">{teamEarnings.toFixed(2)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Guadagni Dollaro</p>
          </div>
          <div className="bg-[#0c101c] rounded-xl p-3 text-center border border-emerald-500/15">
            <Cpu size={16} className="text-emerald-400 mx-auto mb-1" />
            <p className="font-display font-bold text-emerald-400">{teamPower}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">TFLOPS Team</p>
          </div>
          <div className="bg-[#0c101c] rounded-xl p-3 text-center border border-white/8">
            <Users size={16} className="text-green-400 mx-auto mb-1" />
            <p className="font-display font-bold text-green-400">{teamMembers.length}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">Membri</p>
          </div>
        </div>
      </div>

      {/* Team Rates */}
      <div className="px-4 mt-4">
        <div className="bg-[#0c101c] rounded-xl p-4 border border-white/6">
          <p className="text-xs font-bold text-amber-400 mb-2">Ricompense team</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/15">
              <p className="text-[10px] text-amber-400 font-semibold mb-1">Livello 1 — Diretti</p>
              <p className="text-xs text-slate-300">Attività: <span className="font-bold text-white">3%</span></p>
              <p className="text-xs text-slate-300">Bonus invito: <span className="font-bold text-white">5%</span></p>
            </div>
            <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/15">
              <p className="text-[10px] text-emerald-400 font-semibold mb-1">Livello 2 — Indiretti</p>
              <p className="text-xs text-slate-300">Attività: <span className="font-bold text-white">2%</span></p>
              <p className="text-xs text-slate-300">Bonus invito: <span className="font-bold text-white">3%</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Level Tabs */}
      <div className="px-4 mt-6">
        <div className="bg-[#0c101c] rounded-xl p-1 flex gap-1 mb-4 border border-white/6">
          {[1, 2].map(lvl => (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl as 1 | 2)}
              className={`flex-1 py-3 rounded-lg text-xs font-semibold transition-all ${
                activeLevel === lvl
                  ? 'bg-amber-500 text-[#06080f] shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Livello {lvl} ({lvl === 1 ? level1.length : level2.length})
            </button>
          ))}
        </div>

        {/* Members List */}
        <div className="relative">
          {/* Vertical connector line */}
          {activeMembers.length > 1 && (
            <div className="absolute left-[22px] top-8 bottom-8 w-px">
              <div className="h-full bg-gradient-to-b from-amber-400/25 via-amber-400/10 to-transparent" />
              {/* Animated pulse on the line */}
              <motion.div
                animate={{ y: ['0%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute top-0 left-0 w-px h-4 bg-amber-400/60"
                style={{ filter: 'blur(1px)' }}
              />
            </div>
          )}

          <div className="space-y-2">
            {activeMembers.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-12 h-12 text-amber-500/30 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nessun membro a questo livello</p>
                <ChevronDown size={14} className="text-amber-400/40 mx-auto mt-2 animate-bounce" />
              </div>
            ) : (
              activeMembers.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#0c101c] rounded-xl p-4 border border-white/6 relative ml-6"
                >
                  {/* Node connector dot */}
                  <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center">
                    <motion.div
                      animate={{ boxShadow: member.device_active ? ['0 0 0px #10b981', '0 0 8px #10b981', '0 0 0px #10b981'] : 'none' }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-3 h-3 rounded-full border-2 ${member.device_active ? 'bg-emerald-400 border-emerald-400/50' : 'bg-slate-600 border-slate-500/50'}`}
                    />
                    <div className={`w-3 h-px ${member.device_active ? 'bg-emerald-400/30' : 'bg-slate-600/30'}`} />
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center border-2 ${member.device_active ? 'border-emerald-400/40' : 'border-white/10'}`}>
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                        alt={member.username}
                        className="w-full h-full object-cover bg-[#0c101c]"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{member.username}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          member.status === 'active' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-white/5 text-slate-400 border border-white/6'
                        }`}>
                          {member.status === 'active' ? 'Attivo' : 'Inattivo'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-slate-400">
                          {new Date(member.created_at).toLocaleDateString('it-IT')}
                        </span>
                        <span className={`text-[10px] ${member.device_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {member.device_active ? '● GPU attiva' : '○ Nessun GPU'}
                        </span>
                        <span className="text-[10px] text-amber-400 font-semibold">
                          {member.production} $
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 mt-6">
        <div className="bg-[#0c101c] rounded-xl p-4 border border-white/6">
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
