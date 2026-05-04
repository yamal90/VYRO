import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Check, Zap, Cpu, UserPlus, Sparkles, ChevronDown, GitBranch, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../store/AppContext';

const TeamPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, teamMembers } = useApp();
  const [activeLevel, setActiveLevel] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);

  if (!currentUser) return null;

  const inviteLink = `${window.location.origin}?ref=${currentUser.invite_code}`;
  const level1 = teamMembers.filter(m => m.level === 1);
  const level2 = teamMembers.filter(m => m.level === 2);
  const activeMembers = activeLevel === 1 ? level1 : level2;

  const teamEarnings = teamMembers.reduce((s, m) => s + m.production * (m.level === 1 ? 0.05 : 0.02), 0);
  const teamPower = teamMembers.reduce((s, m) => s + (m.device_active ? 4 : 0), 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#06080f] pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/12 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-emerald-500/12 rounded-full blur-3xl" />
        </div>
        
        <div className="gradient-dark px-4 pt-6 pb-8 relative z-10">
          <h1 className="font-display text-2xl font-bold text-white tracking-wider relative z-10 mb-2">
            {t('team.title')}
          </h1>
          <p className="text-white/50 text-xs relative z-10">{t('team.buildTeam')}</p>

          {/* Team Flow Visualization - You at center top, members branching down */}
          <div className="mt-6 relative z-10">
            <div className="flex flex-col items-center">
              {/* Your node */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg shadow-amber-500/20 bg-[#0c101c]">
                  <img src="/vyro-wow-logo.svg" alt="Tu" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 rounded-full text-[8px] font-bold text-[#06080f] whitespace-nowrap">
                  {t('common.you')}
                </div>
              </motion.div>

              {/* Connector line down */}
              <div className="w-px h-6 bg-gradient-to-b from-amber-400/60 to-amber-400/20" />

              {/* Branch out indicator */}
              <div className="flex items-center gap-1 mb-2">
                <GitBranch size={12} className="text-amber-400/60" />
                <span className="text-[9px] text-amber-400/60 font-medium">Team Network</span>
              </div>

              {/* Level 1 members preview - connected flow */}
              {level1.length > 0 ? (
                <div className="relative w-full">
                  {/* Horizontal connector */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" style={{ width: `${Math.min(level1.length * 52, 260)}px` }} />
                  
                  <div className="flex justify-center gap-2 flex-wrap">
                    {level1.slice(0, 5).map((member, i) => (
                      <motion.div
                        key={member.id}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className="flex flex-col items-center"
                      >
                        {/* Vertical connector to horizontal line */}
                        <div className="w-px h-2 bg-amber-400/25" />
                        <div className={`w-9 h-9 rounded-xl overflow-hidden border ${member.device_active ? 'border-emerald-400/50' : 'border-white/10'} bg-[#0c101c]`}>
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                            alt={member.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[7px] text-slate-400 mt-0.5 max-w-[40px] truncate">{member.username}</span>
                        {member.device_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-0.5" />}
                      </motion.div>
                    ))}
                    {level1.length > 5 && (
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-px h-2 bg-amber-400/25" />
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                          <span className="text-[10px] text-amber-400 font-bold">+{level1.length - 5}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Level 2 sub-branches */}
                  {level2.length > 0 && (
                    <>
                      <div className="flex justify-center mt-1">
                        <div className="w-px h-4 bg-gradient-to-b from-emerald-400/30 to-emerald-400/10" />
                      </div>
                      <div className="flex justify-center gap-1.5 flex-wrap">
                        {level2.slice(0, 4).map((member, i) => (
                          <motion.div
                            key={member.id}
                            initial={{ y: 8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 + i * 0.06 }}
                            className="flex flex-col items-center"
                          >
                            <div className={`w-7 h-7 rounded-lg overflow-hidden border ${member.device_active ? 'border-emerald-400/40' : 'border-white/8'} bg-[#0c101c]`}>
                              <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                                alt={member.username}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </motion.div>
                        ))}
                        {level2.length > 4 && (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                            <span className="text-[8px] text-emerald-400 font-bold">+{level2.length - 4}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-slate-500 text-[10px]">{t('team.inviteFirst')}</p>
                  <ChevronDown size={14} className="text-amber-400/40 mx-auto mt-1 animate-bounce" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Card */}
      <div className="px-4 -mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0c101c] rounded-2xl p-5 text-white border border-amber-500/20"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/60 text-[10px] uppercase tracking-wider">{t('team.yourPosition')}</p>
              <p className="font-display font-bold text-lg flex items-center gap-2">
                {t('team.activePosition')}
                <Sparkles size={14} className="text-amber-400" />
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center border border-amber-500/20">
              <UserPlus size={20} className="text-amber-400" />
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-3 mb-3 border border-white/6">
            <p className="text-white/60 text-[10px] uppercase tracking-wider mb-1">{t('team.inviteCode')}</p>
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
              <p className="text-slate-800 text-xs font-medium mb-1">{t('team.inviteLink')}</p>
              <p className="text-slate-500 text-[10px] truncate">{inviteLink}</p>
              <button
                onClick={handleCopy}
                className="mt-2 px-3 py-1.5 bg-amber-500/10 text-amber-700 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-amber-500/25"
              >
                {copied ? <Check size={10} /> : <Copy size={10} />}
                {copied ? t('common.copied') : t('team.copyLink')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Team Stats */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Users size={16} className="text-amber-400" />
          {t('team.myTeam')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#0c101c] rounded-xl p-3 text-center border border-amber-500/15">
            <Zap size={16} className="text-amber-400 mx-auto mb-1" />
            <p className="font-display font-bold text-amber-400">{teamEarnings.toFixed(2)}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{t('team.teamEarnings')}</p>
          </div>
          <div className="bg-[#0c101c] rounded-xl p-3 text-center border border-emerald-500/15">
            <Cpu size={16} className="text-emerald-400 mx-auto mb-1" />
            <p className="font-display font-bold text-emerald-400">{teamPower}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{t('team.teamPower')}</p>
          </div>
          <div className="bg-[#0c101c] rounded-xl p-3 text-center border border-white/8">
            <Users size={16} className="text-green-400 mx-auto mb-1" />
            <p className="font-display font-bold text-green-400">{teamMembers.length}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{t('team.members')}</p>
          </div>
        </div>
      </div>

      {/* Team Rates */}
      <div className="px-4 mt-4">
        <div className="bg-[#0c101c] rounded-xl p-4 border border-white/6">
          <p className="text-xs font-bold text-amber-400 mb-2">{t('team.teamRewards')}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/15">
              <p className="text-[10px] text-amber-400 font-semibold mb-1">{t('team.level1Direct')}</p>
              <p className="text-xs text-slate-300">{t('team.activity')}: <span className="font-bold text-white">5%</span></p>
            </div>
            <div className="bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/15">
              <p className="text-[10px] text-emerald-400 font-semibold mb-1">{t('team.level2Indirect')}</p>
              <p className="text-xs text-slate-300">{t('team.activity')}: <span className="font-bold text-white">2%</span></p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 bg-blue-500/5 rounded-lg p-3 border border-blue-500/15">
            <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-300 leading-relaxed">{t('team.referralEarningsInfo')}</p>
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
              {t('team.level')} {lvl} ({lvl === 1 ? level1.length : level2.length})
            </button>
          ))}
        </div>

        {/* Members List with flow connectors */}
        <div className="relative">
          {/* Vertical connector line on the left */}
          {activeMembers.length > 1 && (
            <div
              className="absolute left-5 top-8 w-px bg-gradient-to-b from-amber-400/30 via-amber-400/15 to-transparent"
              style={{ height: `${(activeMembers.length - 1) * 72}px` }}
            />
          )}

          <div className="space-y-2">
            {activeMembers.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-12 h-12 text-amber-500/30 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">{t('team.noMembers')}</p>
              </div>
            ) : (
              activeMembers.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#0c101c] rounded-xl p-4 border border-white/6 relative"
                >
                  {/* Connector dot on the left */}
                  {activeMembers.length > 1 && (
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 -translate-x-[calc(100%+8px)]">
                      <div className={`w-2.5 h-2.5 rounded-full border-2 ${member.device_active ? 'bg-emerald-400 border-emerald-400/50' : 'bg-slate-600 border-slate-500/50'}`} />
                    </div>
                  )}

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
                          {member.status === 'active' ? t('team.active') : t('team.inactive')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-slate-400">
                          {new Date(member.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'it-IT')}
                        </span>
                        <span className={`text-[10px] ${member.device_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {member.device_active ? `● ${t('team.gpuActive')}` : `○ ${t('team.noGPU')}`}
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
            {t('team.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;
