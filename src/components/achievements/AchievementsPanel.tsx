import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, Lock, Sparkles, Star, Crown, Diamond } from 'lucide-react';
import { useAchievementsStore, type Achievement } from '@/stores/achievementsStore';

const tierColors = {
  bronze: 'from-amber-700 to-amber-900',
  silver: 'from-slate-400 to-slate-600',
  gold: 'from-yellow-500 to-yellow-700',
  platinum: 'from-emerald-400 to-emerald-600',
  diamond: 'from-amber-500 to-amber-700',
};

const tierIcons = {
  bronze: Star,
  silver: Star,
  gold: Trophy,
  platinum: Crown,
  diamond: Diamond,
};

interface AchievementCardProps {
  achievement: Achievement;
  index: number;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, index }) => {
  const { t } = useTranslation();
  const { getProgress } = useAchievementsStore();
  const TierIcon = tierIcons[achievement.tier];
  const progress = getProgress(achievement.id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`relative overflow-hidden rounded-2xl border ${
        achievement.unlocked 
          ? 'border-amber-500/40 bg-gradient-to-br from-amber-900/20 to-[#0a0e1a]/30' 
          : 'border-white/6 bg-[#0c101c]/50'
      }`}
    >
      {achievement.unlocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/10" />
      )}
      
      <div className="p-4 relative z-10">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            achievement.unlocked
              ? `bg-gradient-to-br ${tierColors[achievement.tier]} shadow-lg`
              : 'bg-slate-800'
          }`}>
            {achievement.unlocked ? (
              <span className="text-2xl">{achievement.icon}</span>
            ) : (
              <Lock className="w-5 h-5 text-slate-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-sm ${achievement.unlocked ? 'text-white' : 'text-slate-400'}`}>
                {achievement.title}
              </h3>
              <TierIcon className={`w-3 h-3 ${
                achievement.unlocked ? 'text-yellow-400' : 'text-slate-600'
              }`} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{achievement.description}</p>
            
            {/* Progress bar */}
            {achievement.maxProgress && !achievement.unlocked && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>{t('achievements.progress')}</span>
                  <span>{achievement.progress ?? 0}/{achievement.maxProgress}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* XP badge */}
            <div className="flex items-center gap-1 mt-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400">+{achievement.xp} XP</span>
            </div>
          </div>
        </div>

        {/* Unlocked date */}
        {achievement.unlocked && achievement.unlockedAt && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <span className="text-[10px] text-slate-500">
              {new Date(achievement.unlockedAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface AchievementsPanelProps {
  onClose?: () => void;
}

export const AchievementsPanel: React.FC<AchievementsPanelProps> = () => {
  const { t } = useTranslation();
  const { achievements, totalXp, level, getUnlockedCount } = useAchievementsStore();
  const unlockedCount = getUnlockedCount();
  const totalAchievements = achievements.length;

  return (
    <div className="min-h-screen bg-[#06080f] pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/12 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/12 rounded-full blur-3xl" />
        </div>
        
        <div className="px-4 pt-6 pb-8 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-700/72 via-[#0a0e1a]/80 to-[#06080f]/90" />
          
          <div className="relative z-10">
            <h1 className="font-display text-2xl font-bold text-white tracking-wider">
              {t('achievements.title')}
            </h1>
            <p className="text-white/50 text-xs mt-1">Sblocca achievement e guadagna XP</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6 relative z-10">
            <div className="glass-dark rounded-xl p-3 text-center border border-amber-500/20">
              <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="font-display font-bold text-white">{unlockedCount}/{totalAchievements}</p>
              <p className="text-[9px] text-slate-400">{t('achievements.unlocked')}</p>
            </div>
            <div className="glass-dark rounded-xl p-3 text-center border border-amber-500/20">
              <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="font-display font-bold text-amber-400">{totalXp.toLocaleString()}</p>
              <p className="text-[9px] text-slate-400">{t('achievements.totalXp')}</p>
            </div>
            <div className="glass-dark rounded-xl p-3 text-center border border-amber-500/20">
              <Crown className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="font-display font-bold text-emerald-400">{level}</p>
              <p className="text-[9px] text-slate-400">{t('achievements.level')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {achievements.map((achievement, index) => (
            <AchievementCard key={achievement.id} achievement={achievement} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementsPanel;
