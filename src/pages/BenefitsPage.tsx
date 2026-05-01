import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gift, Calendar, Award, Trophy, Star,
  CheckCircle, Lock, Target, Flame, Crown
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';

const BenefitsPage: React.FC = () => {
  const { currentUser, claimDailyReward, dailyClaims, userDevices, teamMembers } = useApp();
  const [claimResult, setClaimResult] = useState<{ msg: string; ok: boolean } | null>(null);
  const [claiming, setClaiming] = useState(false);

  if (!currentUser) return null;

  const today = new Date().toISOString().slice(0, 10);
  const claimedToday = dailyClaims.some(c => c.claim_date === today);

  const handleClaim = () => {
    setClaiming(true);
    setTimeout(async () => {
      const result = await claimDailyReward();
      setClaimResult({ msg: result.message, ok: result.success });
      setClaiming(false);
      setTimeout(() => setClaimResult(null), 3000);
    }, 800);
  };

  // Week days
  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const daysCompleted = Math.min(dailyClaims.length, 7);

  const badges = useMemo(() => [
    { name: 'Primo Login', icon: '🚀', earned: Boolean(currentUser), desc: 'Accesso alla piattaforma', tier: 'bronze' },
    { name: 'Primo GPU', icon: '⚡', earned: userDevices.length > 0, desc: 'Attivazione primo dispositivo', tier: 'silver' },
    { name: 'Team Builder', icon: '👥', earned: teamMembers.length >= 3, desc: 'Invita 3 membri', tier: 'silver' },
    { name: 'Streak 7', icon: '🔥', earned: dailyClaims.length >= 7, desc: '7 claim consecutivi', tier: 'gold' },
    { name: 'Power User', icon: '💎', earned: currentUser.compute_power >= 100, desc: '100 TFLOPS potenza', tier: 'platinum' },
    { name: 'Top Earner', icon: '🏆', earned: currentUser.vx_balance >= 10000, desc: '10.000 VX generati', tier: 'diamond' },
    { name: 'Legend', icon: '👑', earned: currentUser.vx_balance >= 100000, desc: '100.000 VX generati', tier: 'ultimate' },
    { name: 'Pioneer', icon: '🌟', earned: userDevices.some(d => (d.device?.price ?? 0) >= 2000), desc: 'GPU Ultimate posseduta', tier: 'ultimate' },
  ], [currentUser, userDevices, teamMembers, dailyClaims]);

  const tierColors: Record<string, string> = {
    bronze: 'from-amber-700 to-amber-900',
    silver: 'from-slate-400 to-slate-600',
    gold: 'from-yellow-500 to-amber-600',
    platinum: 'from-cyan-400 to-blue-600',
    diamond: 'from-purple-500 to-pink-600',
    ultimate: 'from-purple-600 via-pink-500 to-cyan-500',
  };

  const [leaderboard, setLeaderboard] = useState<{ pos: number; name: string; vx: number; power: number }[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.rpc('leaderboard_top', { p_limit: 10 }).then(({ data }) => {
      if (data && Array.isArray(data)) {
        setLeaderboard(data.map((r: { pos: number; username: string; vx: number; power: number }) => ({
          pos: Number(r.pos),
          name: r.username,
          vx: Number(r.vx),
          power: Number(r.power),
        })));
      }
    });
  }, [currentUser.vx_balance]);

  // Missions
  const missions = [
    { name: 'Login giornaliero', reward: 1, completed: true, icon: Star },
    { name: 'Claim giornaliero', reward: 2.5, completed: claimedToday, icon: Gift },
    { name: 'Controlla dispositivi', reward: 0.5, completed: false, icon: Target },
    { name: 'Invita un amico', reward: 5, completed: false, icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-yellow-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="gradient-dark px-4 pt-6 pb-8 relative z-10">
          <div className="absolute inset-0">
            <div className="absolute top-5 right-5 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-purple-500/15 rounded-full blur-3xl" />
          </div>
          
          <h1 className="font-display text-2xl font-bold text-white tracking-wider relative z-10">
            Centro Benefici
          </h1>
          <p className="text-white/50 text-xs mt-1 relative z-10">Missioni, ricompense e classifiche</p>
        </div>
      </div>

      {/* Daily Claim Card */}
      <div className="px-4 -mt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/30 relative overflow-hidden border border-yellow-400/30"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />
          
          {/* Animated shine */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-white/80 text-xs font-medium mb-1">Claim giornaliero</p>
              <p className="font-display text-3xl font-bold">2.5 VX</p>
              <p className="text-white/60 text-[10px] mt-1">Ricompensa giornaliera</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleClaim}
              disabled={claimedToday || claiming}
              className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                claimedToday
                  ? 'bg-white/20 text-white/60 cursor-not-allowed'
                  : 'bg-white text-orange-600 hover:bg-white/90 shadow-lg'
              }`}
            >
              {claiming ? (
                <div className="w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
              ) : claimedToday ? (
                <>
                  <CheckCircle size={16} />
                  Riscosso
                </>
              ) : (
                <>
                  <Gift size={16} />
                  Riscuoti
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {claimResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 p-3 rounded-xl text-sm font-medium text-center ${
              claimResult.ok ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {claimResult.msg}
          </motion.div>
        )}
      </div>

      {/* Weekly Progress */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-purple-400" />
          Progresso settimanale
        </h3>
        <div className="glass-dark rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            {weekDays.map((day, i) => {
              const completed = i < daysCompleted;
              return (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    completed
                      ? 'gradient-primary text-white shadow-md shadow-purple-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {completed ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className="text-[9px] text-slate-400">{day}</span>
                </div>
              );
            })}
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(daysCompleted / 7) * 100}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full gradient-primary rounded-full"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            {daysCompleted}/7 giorni completati — Bonus settimana: <span className="font-bold text-purple-400">10 VX</span>
          </p>
        </div>
      </div>

      {/* Daily Missions */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Target size={16} className="text-purple-400" />
          Missioni giornaliere
        </h3>
        <div className="space-y-2">
          {missions.map((mission, i) => {
            const MissionIcon = mission.icon;
            return (
              <motion.div
                key={mission.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="glass-dark rounded-xl p-3.5 flex items-center gap-3 border border-purple-500/20"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  mission.completed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}>
                  {mission.completed ? <CheckCircle size={18} /> : <MissionIcon size={18} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${mission.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                    {mission.name}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded-full border border-purple-500/30">
                  +{mission.reward} VX
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Award size={16} className="text-purple-400" />
          Badge ottenuti
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl p-3 text-center border transition-all ${
                badge.earned
                  ? `bg-gradient-to-br ${tierColors[badge.tier]} border-white/20 shadow-lg`
                  : 'glass-dark border-slate-700 opacity-50'
              }`}
            >
              <div className="text-xl mb-1">{badge.icon}</div>
              <p className="text-[9px] font-bold text-white leading-tight">{badge.name}</p>
              {!badge.earned && <Lock size={10} className="text-slate-500 mx-auto mt-1" />}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-4 mt-6 mb-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Trophy size={16} className="text-purple-400" />
          Classifica utenti
        </h3>
        <div className="glass-dark rounded-xl overflow-hidden border border-purple-500/20">
          {leaderboard.map((entry, i) => (
            <div
              key={entry.pos}
              className={`flex items-center gap-3 px-4 py-3 ${
                i > 0 ? 'border-t border-purple-500/10' : ''
              } ${entry.name === currentUser.username ? 'bg-purple-500/10' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                entry.pos === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-lg shadow-yellow-500/30' :
                entry.pos === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                entry.pos === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                'bg-slate-800 text-slate-400'
              }`}>
                {entry.pos === 1 ? <Crown size={14} /> : entry.pos}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  entry.name === currentUser.username ? 'text-purple-400 font-bold' : 'text-white'
                }`}>
                  {entry.name}
                  {entry.name === currentUser.username && ' (Tu)'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-purple-400 font-display">{entry.vx.toLocaleString()} VX</p>
                <p className="text-[9px] text-slate-400">{entry.power} TFLOPS</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 mb-6">
        <div className="glass-dark rounded-xl p-4 border border-purple-500/20">
          <p className="text-[10px] text-slate-400 leading-relaxed text-center">
            Missioni, streak e badge rendono l'esperienza VYRO GPU più coinvolgente,
            premiando la costanza e la crescita del tuo profilo giorno dopo giorno.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BenefitsPage;
