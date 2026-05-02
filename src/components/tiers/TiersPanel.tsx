import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Crown, Zap, Shield, Star, Infinity, ChevronRight } from 'lucide-react';

export interface Tier {
  id: string;
  name: string;
  minBalance: number;
  minDevices: number;
  minTeamSize: number;
  benefits: string[];
  color: string;
  icon: React.FC<{ className?: string }>;
}

export const TIERS: Tier[] = [
  {
    id: 'zyra',
    name: 'ZYRA',
    minBalance: 0,
    minDevices: 0,
    minTeamSize: 0,
    benefits: [
      'Accesso base alla piattaforma',
      '1 referral code',
      'Claim giornaliero base',
    ],
    color: 'from-slate-600 to-slate-800',
    icon: Star,
  },
  {
    id: 'vortex',
    name: 'VORTEX',
    minBalance: 1000,
    minDevices: 2,
    minTeamSize: 5,
    benefits: [
      'Bonus referral +2%',
      'Claim giornaliero +10%',
      'Accesso supporto prioritario',
    ],
    color: 'from-blue-600 to-blue-800',
    icon: Zap,
  },
  {
    id: 'nebula',
    name: 'NEBULA',
    minBalance: 10000,
    minDevices: 5,
    minTeamSize: 20,
    benefits: [
      'Bonus referral +5%',
      'Claim giornaliero +25%',
      'Commissioni ridotte',
      'Badge esclusivo',
    ],
    color: 'from-purple-600 to-purple-800',
    icon: Shield,
  },
  {
    id: 'quantum',
    name: 'QUANTUM',
    minBalance: 50000,
    minDevices: 10,
    minTeamSize: 50,
    benefits: [
      'Bonus referral +10%',
      'Claim giornaliero +50%',
      'Zero commissioni',
      'Accesso Beta features',
      'Account manager dedicato',
    ],
    color: 'from-cyan-500 to-cyan-700',
    icon: Crown,
  },
  {
    id: 'infinity',
    name: 'INFINITY',
    minBalance: 100000,
    minDevices: 20,
    minTeamSize: 100,
    benefits: [
      'Bonus referral +15%',
      'Claim giornaliero +100%',
      'VIP support 24/7',
      'Eventi esclusivi',
      'Custom NFT badge',
      'Revenue sharing',
    ],
    color: 'from-amber-500 to-amber-700',
    icon: Infinity,
  },
];

interface TierCardProps {
  tier: Tier;
  isCurrent?: boolean;
  isLocked?: boolean;
  progress?: number;
}

const TierCard: React.FC<TierCardProps> = ({ tier, isCurrent, isLocked, progress }) => {
  const { t } = useTranslation();
  const Icon = tier.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border ${
        isCurrent 
          ? 'border-purple-500/50 shadow-lg shadow-purple-500/20' 
          : 'border-slate-700/50'
      }`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${tier.color} opacity-10`} />
      
      {/* Content */}
      <div className="p-4 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${tier.color}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white">{tier.name}</h3>
              <p className="text-[10px] text-slate-400">
                Min. ${tier.minBalance.toLocaleString()}
              </p>
            </div>
          </div>
          
          {isCurrent && (
            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
              Attuale
            </span>
          )}
        </div>

        {/* Requirements */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <p className="text-[9px] text-slate-400">Saldo</p>
            <p className="text-xs font-bold text-white">${tier.minBalance.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <p className="text-[9px] text-slate-400">GPU</p>
            <p className="text-xs font-bold text-white">{tier.minDevices}+</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2 text-center">
            <p className="text-[9px] text-slate-400">Team</p>
            <p className="text-xs font-bold text-white">{tier.minTeamSize}+</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-1">
          {tier.benefits.map((benefit, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <ChevronRight className="w-3 h-3 text-purple-400" />
              <span className="text-slate-300">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {progress !== undefined && !isCurrent && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900/50 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${tier.color}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface TiersPanelProps {
  currentTier?: string;
  userStats: {
    balance: number;
    devices: number;
    teamSize: number;
  };
}

export const TiersPanel: React.FC<TiersPanelProps> = ({ currentTier = 'zyra', userStats }) => {
  const { t } = useTranslation();

  const calculateProgress = (tier: Tier) => {
    const balanceProgress = Math.min(100, (userStats.balance / tier.minBalance) * 100);
    const devicesProgress = Math.min(100, (userStats.devices / tier.minDevices) * 100);
    const teamProgress = Math.min(100, (userStats.teamSize / tier.minTeamSize) * 100);
    
    return Math.round((balanceProgress + devicesProgress + teamProgress) / 3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="px-4 pt-6 pb-8 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-700/72 via-indigo-700/64 to-cyan-700/58" />
          
          <div className="relative z-10">
            <h1 className="font-display text-2xl font-bold text-white tracking-wider">
              Tier System
            </h1>
            <p className="text-white/50 text-xs mt-1">Sali di livello e sblocca vantaggi esclusivi</p>
          </div>

          {/* Current tier highlight */}
          <div className="mt-6 relative z-10">
            <div className="glass-dark rounded-xl p-4 border border-purple-500/30">
              <p className="text-xs text-slate-400 mb-2">Il tuo tier attuale</p>
              <div className="flex items-center gap-3">
                {(() => {
                  const tier = TIERS.find(t => t.id === currentTier) || TIERS[0];
                  const Icon = tier.icon;
                  return (
                    <>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${tier.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-display font-bold text-white text-xl">{tier.name}</p>
                        <p className="text-xs text-slate-400">
                          {t(`tiers.${currentTier}`)}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="px-4 mt-4">
        <div className="space-y-4">
          {TIERS.map((tier) => {
            const isCurrent = tier.id === currentTier;
            const progress = calculateProgress(tier);
            
            return (
              <TierCard 
                key={tier.id} 
                tier={tier} 
                isCurrent={isCurrent}
                progress={isCurrent ? undefined : progress}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TiersPanel;
