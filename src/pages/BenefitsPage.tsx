import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gift, Calendar, Award, Trophy, Star,
  CheckCircle, Lock, Target, Flame
} from 'lucide-react';
import { useApp } from '../store/AppContext';

const BenefitsPage: React.FC = () => {
  const { currentUser, claimDailyReward, dailyClaims } = useApp();
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

  // Badges
  const badges = [
    { name: 'Primo Login', icon: '🚀', earned: true, desc: 'Accesso alla piattaforma' },
    { name: 'Primo GPU', icon: '⚡', earned: true, desc: 'Attivazione primo dispositivo' },
    { name: 'Team Builder', icon: '👥', earned: true, desc: 'Invita 3 membri' },
    { name: 'Streak 7', icon: '🔥', earned: false, desc: '7 claim consecutivi' },
    { name: 'Power User', icon: '💎', earned: false, desc: '100 TFLOPS potenza' },
    { name: 'Top Earner', icon: '🏆', earned: false, desc: '10.000 VX generati' },
  ];

  // Leaderboard
  const leaderboard = [
    { pos: 1, name: 'QuantumRex', vx: 4500, power: 68 },
    { pos: 2, name: currentUser.username, vx: currentUser.vx_balance, power: currentUser.compute_power },
    { pos: 3, name: 'NeonDrift', vx: 1220, power: 24 },
    { pos: 4, name: 'VoltEdge', vx: 780, power: 8 },
    { pos: 5, name: 'PixelForge', vx: 340, power: 4 },
  ];

  // Missions
  const missions = [
    { name: 'Login giornaliero', reward: 1, completed: true, icon: Star },
    { name: 'Claim giornaliero', reward: 2.5, completed: claimedToday, icon: Gift },
    { name: 'Controlla dispositivi', reward: 0.5, completed: false, icon: Target },
    { name: 'Invita un amico', reward: 5, completed: false, icon: Flame },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24">
      {/* Header with background image */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=400&fit=crop')" }}
        />
        <div className="gradient-dark px-4 pt-6 pb-8 relative z-10">
          <div className="absolute inset-0">
            <div className="absolute top-5 right-5 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-10 w-32 h-32 bg-purple-500/15 rounded-full blur-3xl" />
          </div>
          <h1 className="font-display text-xl font-bold text-white tracking-wider relative z-10">
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
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden"
        >
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full" />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-white/80 text-xs font-medium mb-1">Claim giornaliero</p>
              <p className="font-display text-3xl font-bold">2.5 VX</p>
              <p className="text-white/60 text-[10px] mt-1">Token virtuali giornalieri</p>
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
              claimResult.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {claimResult.msg}
          </motion.div>
        )}
      </div>

      {/* Weekly Progress */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-purple-500" />
          Progresso settimanale
        </h3>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            {weekDays.map((day, i) => {
              const completed = i < daysCompleted;
              return (
                <div key={day} className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    completed
                      ? 'gradient-primary text-white shadow-md'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {completed ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className="text-[9px] text-slate-400">{day}</span>
                </div>
              );
            })}
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(daysCompleted / 7) * 100}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="h-full gradient-primary rounded-full"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            {daysCompleted}/7 giorni completati — Bonus settimana: <span className="font-bold text-purple-600">10 VX</span>
          </p>
        </div>
      </div>

      {/* Daily Missions */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Target size={16} className="text-purple-500" />
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
                className="bg-white rounded-xl p-3.5 flex items-center gap-3 shadow-sm"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  mission.completed ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                }`}>
                  {mission.completed ? <CheckCircle size={18} /> : <MissionIcon size={18} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${mission.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {mission.name}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-full">
                  +{mission.reward} VX
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Award size={16} className="text-purple-500" />
          Badge ottenuti
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-xl p-3 text-center border transition-all ${
                badge.earned
                  ? 'bg-white border-purple-100 shadow-sm'
                  : 'bg-slate-50 border-slate-100 opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">{badge.icon}</div>
              <p className="text-[10px] font-bold text-slate-700">{badge.name}</p>
              <p className="text-[8px] text-slate-400 mt-0.5">{badge.desc}</p>
              {!badge.earned && <Lock size={10} className="text-slate-300 mx-auto mt-1" />}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-4 mt-6 mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Trophy size={16} className="text-purple-500" />
          Classifica utenti
        </h3>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {leaderboard.map((entry, i) => (
            <div
              key={entry.pos}
              className={`flex items-center gap-3 px-4 py-3 ${
                i > 0 ? 'border-t border-slate-50' : ''
              } ${entry.name === currentUser.username ? 'bg-purple-50/50' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                entry.pos === 1 ? 'bg-yellow-100 text-yellow-700' :
                entry.pos === 2 ? 'bg-slate-200 text-slate-600' :
                entry.pos === 3 ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-400'
              }`}>
                {entry.pos}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  entry.name === currentUser.username ? 'text-purple-700 font-bold' : 'text-slate-700'
                }`}>
                  {entry.name}
                  {entry.name === currentUser.username && ' (Tu)'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-purple-600">{entry.vx.toLocaleString()} VX</p>
                <p className="text-[9px] text-slate-400">{entry.power} TFLOPS</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-[10px] text-amber-700 leading-relaxed text-center">
            ⚠️ Tutti i bonus e le ricompense sono in VX token virtuali interni.
            Non rappresentano alcun valore finanziario reale.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BenefitsPage;
