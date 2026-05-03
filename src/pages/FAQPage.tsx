import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, Shield, Cpu, Users, Zap, Award, ChevronDown, Lock,
  Server, Key, Fingerprint, Globe, AlertTriangle,
  TrendingUp, Gift, RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FAQCategory {
  id: string;
  icon: React.ElementType;
  color: string;
}

const faqCategoryDefs: FAQCategory[] = [
  { id: 'platform', icon: Cpu, color: 'from-amber-500 to-amber-600' },
  { id: 'security', icon: Shield, color: 'from-green-500 to-emerald-600' },
  { id: 'production', icon: Zap, color: 'from-amber-500 to-orange-600' },
  { id: 'team', icon: Users, color: 'from-blue-500 to-indigo-600' },
  { id: 'benefits', icon: Gift, color: 'from-pink-500 to-rose-600' },
  { id: 'certifications', icon: Award, color: 'from-emerald-500 to-teal-600' },
];

const faqItemCounts: Record<string, number> = {
  platform: 4, security: 6, production: 4, team: 4, benefits: 4, certifications: 4,
};

const teamMembers = [
  {
    id: 1,
    name: 'Dr. Alessandro Chen',
    role: 'CTO & Co-Founder',
    bio: 'Ex-Google Cloud Architect con 15 anni di esperienza in sistemi distribuiti. Ha guidato lo sviluppo dell\'architettura VYRO Vault™.',
    image: '/images/team/engineer-1.jpg',
    expertise: ['Cloud Architecture', 'Distributed Systems', 'Scalability']
  },
  {
    id: 2,
    name: 'Marco Rodriguez',
    role: 'Lead GPU Engineer',
    bio: 'Ex-NVIDIA senior engineer specializzato in architetture GPU parallele. Responsabile dell\'ottimizzazione TFLOPS delle nostre GPU.',
    image: '/images/team/engineer-2.jpg',
    expertise: ['GPU Computing', 'CUDA', 'Performance Optimization']
  },
  {
    id: 3,
    name: 'Elena Volkov',
    role: 'Hardware Security Lead',
    bio: 'Ex-Ledger security researcher. Ha progettato Neural Shield™ e Quantum Lock™ per la protezione degli asset utenti.',
    image: '/images/team/engineer-3.jpg',
    expertise: ['Hardware Security', 'Cryptography', 'Embedded Systems']
  },
  {
    id: 4,
    name: 'Kenji Tanaka',
    role: 'VP Engineering',
    bio: 'Ex-AWS principal engineer con expertise in infrastrutture ad alta disponibilità. Guida il team di sviluppo piattaforma.',
    image: '/images/team/engineer-4.jpg',
    expertise: ['Infrastructure', 'DevOps', 'High Availability']
  },
  {
    id: 5,
    name: 'Sara Mitchell',
    role: 'AI Research Lead',
    bio: 'Ex-DeepMind researcher specializzata in pattern recognition. Ha sviluppato gli algoritmi di Neural Shield™ per il fraud detection.',
    image: '/images/team/engineer-5.jpg',
    expertise: ['Machine Learning', 'AI', 'Anomaly Detection']
  },
  {
    id: 6,
    name: 'David Weber',
    role: 'Security Architect',
    bio: 'Ex-Palo Alto Networks con 12 anni in cybersecurity. Responsabile delle certificazioni SOC 2, ISO 27001 e del Bug Bounty Program.',
    image: '/images/team/engineer-6.jpg',
    expertise: ['Cybersecurity', 'Compliance', 'Risk Management']
  }
];

const securityBadges = [
  { icon: Shield, label: 'SOC 2 Type II', color: 'text-green-400' },
  { icon: Lock, label: 'ISO 27001', color: 'text-blue-400' },
  { icon: Globe, label: 'GDPR', color: 'text-amber-400' },
  { icon: Key, label: 'PCI DSS L1', color: 'text-amber-400' },
  { icon: Fingerprint, label: '2FA Ready', color: 'text-emerald-400' },
  { icon: Server, label: '99.97% Uptime', color: 'text-emerald-400' }
];

const FAQPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<string>('platform');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showTeam, setShowTeam] = useState(false);

  const faqCategories = faqCategoryDefs.map(def => ({
    ...def,
    title: t(`faq.categories.${def.id}.title`),
    items: Array.from({ length: faqItemCounts[def.id] || 0 }, (_, i) => ({
      question: t(`faq.categories.${def.id}.items.${i}.q`),
      answer: t(`faq.categories.${def.id}.items.${i}.a`),
    })),
  }));

  const toggleItem = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedItems(newSet);
  };

  const currentCategory = faqCategories.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-[#06080f] pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/12 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-emerald-500/12 rounded-full blur-3xl" />
        </div>

        <div className="gradient-primary px-4 pt-6 pb-8 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="w-8 h-8 text-white" />
            <h1 className="font-display text-2xl font-bold text-white tracking-wider">
              {t('faq.title')}
            </h1>
          </div>
          <p className="text-white/60 text-sm">
            {t('faq.subtitle')}
          </p>

          {/* Security Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            {securityBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass-dark rounded-lg px-2.5 py-1.5 flex items-center gap-1.5"
              >
                <badge.icon size={12} className={badge.color} />
                <span className="text-[10px] text-white font-medium">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {faqCategories.map((cat) => (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                  : 'glass-dark text-slate-300 hover:text-white'
              }`}
            >
              <cat.icon size={16} />
              <span className="text-xs font-semibold">{cat.title}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="px-4 mt-4 space-y-2">
        {currentCategory?.items.map((item, i) => {
          const itemId = `${currentCategory.id}-${i}`;
          const isExpanded = expandedItems.has(itemId);

          return (
            <motion.div
              key={itemId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-800/50 border border-amber-500/20 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleItem(itemId)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentCategory.color} flex items-center justify-center`}>
                    <HelpCircle size={16} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-white pr-4">{item.question}</span>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={18} className="text-amber-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1">
                      <div className="bg-white/3 rounded-lg p-3.5 border-l-2 border-amber-500">
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className="px-4 mt-6">
        <div className="glass-dark rounded-xl p-4 border border-amber-500/20">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" />
            {t('faq.platformStats')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="font-display text-xl font-bold text-amber-400">99.97%</p>
              <p className="text-[10px] text-slate-400 mt-1">{t('faq.guaranteedUptime')}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="font-display text-xl font-bold text-green-400">$50M+</p>
              <p className="text-[10px] text-slate-400 mt-1">{t('faq.protectedAssets')}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="font-display text-xl font-bold text-emerald-400">24/7</p>
              <p className="text-[10px] text-slate-400 mt-1">{t('faq.activeSupport')}</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="font-display text-xl font-bold text-amber-400">3</p>
              <p className="text-[10px] text-slate-400 mt-1">{t('faq.activeContinents')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section Toggle */}
      <div className="px-4 mt-6">
        <motion.button
          onClick={() => setShowTeam(!showTeam)}
          className="w-full glass-dark rounded-xl p-4 border border-amber-500/20 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">{t('faq.ourTeam')}</p>
              <p className="text-[10px] text-slate-400">{t('faq.engineers')}</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: showTeam ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={20} className="text-amber-400" />
          </motion.div>
        </motion.button>
      </div>

      {/* Team Members */}
      <AnimatePresence>
        {showTeam && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 mt-4 space-y-3">
              {teamMembers.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-800/50 border border-amber-500/20 rounded-xl overflow-hidden"
                >
                  <div className="flex gap-4 p-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/10 flex-shrink-0 border border-amber-500/25">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-white">{member.name}</p>
                      <p className="text-xs text-amber-400 font-medium">{member.role}</p>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                        {member.bio}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.expertise.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-amber-500/12 text-amber-300 text-[9px] rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Team Motto */}
            <div className="px-4 mt-4">
              <div className="bg-gradient-to-r from-[#0c101c]/60 via-[#0a0e1a]/50 to-[#0c101c]/60 rounded-xl p-4 text-center border border-amber-500/20">
                <p className="font-display text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-emerald-400">
                  {t('faq.motto')}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {t('faq.mottoSub')}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Support */}
      <div className="px-4 mt-6">
        <div className="glass-dark rounded-xl p-4 border border-amber-500/20">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            {t('faq.needHelp')}
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            {t('faq.supportAvailable')}
          </p>
          <button
            onClick={() => window.location.href = 'mailto:support@vyrogpu.com'}
            className="w-full py-3 gradient-primary rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            {t('faq.contactSupport')}
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 mt-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <p className="text-[10px] text-amber-300 leading-relaxed text-center">
            {t('faq.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
