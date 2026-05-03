import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, Shield, Cpu, Users, Zap, Award, ChevronDown, Lock,
  Server, Key, Fingerprint, Globe, AlertTriangle,
  TrendingUp, Gift, RefreshCw, Smartphone, Camera, MapPin, Star,
  Play, Pause, SkipForward, Volume2
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

const videoSlides = [
  {
    title: 'Benvenuto su VYRO GPU',
    content: 'VYRO e la piattaforma di cloud computing che ti permette di noleggiare potenza GPU e guadagnare passivamente. Registrati con un codice referral per iniziare.',
    icon: Zap,
    color: 'from-amber-500 to-orange-500',
  },
  {
    title: 'Come funziona',
    content: '1. Registrati con email e referral code\n2. Deposita USDT per acquistare GPU\n3. Le GPU generano rendimenti automatici ogni 7 giorni\n4. Ritira i tuoi guadagni quando vuoi',
    icon: Cpu,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    title: 'Dashboard e Portfolio',
    content: 'Dalla dashboard puoi vedere il tuo saldo, la produzione in tempo reale, le transazioni recenti e gestire depositi e prelievi.',
    icon: TrendingUp,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Sistema Team e Referral',
    content: 'Invita amici con il tuo codice personale. Guadagna il 5% sugli acquisti diretti (Livello 1) e il 2% sugli acquisti indiretti (Livello 2).',
    icon: Users,
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Sicurezza e Protezione',
    content: 'I tuoi fondi sono protetti da crittografia end-to-end, autenticazione a due fattori, e Row Level Security su tutto il database. Certificazioni SOC 2, ISO 27001, GDPR.',
    icon: Shield,
    color: 'from-green-500 to-emerald-600',
  },
  {
    title: 'Daily Claim e Benefici',
    content: 'Accedi ogni giorno per il claim giornaliero. La ricompensa aumenta con lo streak: da 0.12 USDT al giorno 1 fino a 0.70 USDT dopo 30 giorni consecutivi.',
    icon: Gift,
    color: 'from-pink-500 to-rose-500',
  },
  {
    title: 'Tier e Achievement',
    content: 'Sali di livello da Bronze a Diamond. Ogni tier offre benefici esclusivi: commissioni ridotte, bonus maggiori e accesso a GPU premium.',
    icon: Award,
    color: 'from-amber-400 to-yellow-500',
  },
];

const VideoGuide: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        if (prev >= videoSlides.length - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const slide = videoSlides[currentSlide];
  const SlideIcon = slide.icon;
  const progress = ((currentSlide + 1) / videoSlides.length) * 100;

  return (
    <div className="bg-gradient-to-br from-[#0c101c] to-[#111827] border border-white/10 rounded-2xl overflow-hidden">
      <div className="relative aspect-video flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl" />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="relative z-10"
          >
            <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-lg`}>
              <SlideIcon size={28} className="text-white" />
            </div>
            <h3 className="text-white text-lg font-bold mb-3">{slide.title}</h3>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm mx-auto whitespace-pre-line">
              {slide.content}
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-3 left-0 right-0 flex items-center gap-1.5 justify-center">
          {videoSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentSlide ? 'bg-amber-400 w-6' : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="bg-black/30 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-[#06080f] hover:bg-amber-400 transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % videoSlides.length)}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <SkipForward size={14} />
        </button>
        <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="bg-amber-400 h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-[10px] text-white/50 tabular-nums">
          {currentSlide + 1}/{videoSlides.length}
        </span>
        <Volume2 size={14} className="text-white/30" />
      </div>
    </div>
  );
};

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

      {/* Video Guide */}
      <div className="px-4 mt-4 mb-4 relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Play size={16} className="text-amber-400" />
          <h2 className="text-sm font-bold text-white">Guida Video — Come funziona VYRO</h2>
        </div>
        <VideoGuide />
      </div>

      {/* Category Tabs */}
      <div className="px-4 -mt-0 relative z-10">
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Community Promo Gallery */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="px-4 mt-6">
        <div className="glass-dark rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">VYRO Community</h3>
              <p className="text-[10px] text-slate-400">La nostra community globale in azione</p>
            </div>
          </div>

          {/* Community Stats Bar */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-amber-500/10 rounded-lg p-2 text-center">
              <p className="font-display text-sm font-bold text-amber-400">12K+</p>
              <p className="text-[8px] text-slate-400">Utenti attivi</p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
              <p className="font-display text-sm font-bold text-emerald-400">45+</p>
              <p className="text-[8px] text-slate-400">Paesi</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-2 text-center">
              <p className="font-display text-sm font-bold text-blue-400">24/7</p>
              <p className="text-[8px] text-slate-400">GPU attive</p>
            </div>
          </div>

          {/* Promo Image Grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { img: '/images/promo/promo-1.jpg', caption: 'VYRO App — Dashboard live', tag: 'APP', location: 'Milano, IT' },
              { img: '/images/promo/promo-2.jpg', caption: 'Team VYRO — Sviluppo continuo', tag: 'TEAM', location: 'Berlin, DE' },
              { img: '/images/promo/promo-3.jpg', caption: 'Monitoraggio GPU da mobile', tag: 'MOBILE', location: 'London, UK' },
              { img: '/images/promo/promo-4.jpg', caption: 'VYRO Tech Conference 2025', tag: 'EVENT', location: 'Dubai, AE' },
              { img: '/images/promo/promo-5.jpg', caption: 'Community member — Guadagni reali', tag: 'COMMUNITY', location: 'Roma, IT' },
              { img: '/images/promo/promo-6.jpg', caption: 'Data Center VYRO — GPU Farm', tag: 'INFRA', location: 'Frankfurt, DE' },
              { img: '/images/promo/promo-7.jpg', caption: 'Gestione portfolio da smartphone', tag: 'APP', location: 'Paris, FR' },
              { img: '/images/promo/promo-8.jpg', caption: 'Workshop VYRO — Formazione team', tag: 'WORKSHOP', location: 'Barcelona, ES' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="relative rounded-xl overflow-hidden group"
              >
                <img
                  src={item.img}
                  alt={item.caption}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* VYRO tag badge */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-amber-500/90 text-[7px] font-bold text-black rounded">
                    VYRO
                  </span>
                  <span className="px-1.5 py-0.5 bg-white/20 backdrop-blur-sm text-[7px] font-bold text-white rounded">
                    {item.tag}
                  </span>
                </div>
                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-[10px] text-white font-semibold leading-tight">{item.caption}</p>
                  <p className="text-[8px] text-white/60 flex items-center gap-0.5 mt-0.5">
                    <MapPin size={7} />
                    {item.location}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Promotional Testimonials */}
      <div className="px-4 mt-4">
        <div className="glass-dark rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Star size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">Cosa dice la community</h3>
          </div>
          <div className="space-y-3">
            {[
              {
                name: 'Marco T.',
                avatar: '/images/promo/promo-10.jpg',
                text: 'Ho iniziato con un X-120 e ora ho 3 dispositivi attivi. I guadagni sono costanti e il team è sempre disponibile.',
                rating: 5,
                device: 'G-700',
                country: 'Italia'
              },
              {
                name: 'Sarah K.',
                avatar: '/images/promo/promo-9.jpg',
                text: 'La piattaforma è intuitiva e i rendimenti sono reali. La funzione team mi permette di guadagnare passivamente.',
                rating: 5,
                device: 'G-900',
                country: 'Germania'
              },
              {
                name: 'James L.',
                avatar: '/images/promo/promo-12.jpg',
                text: 'Sicurezza al top. La verifica QR sui depositi mi dà totale fiducia. Consiglio a chiunque voglia iniziare.',
                rating: 5,
                device: 'X-5700',
                country: 'UK'
              },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 rounded-xl p-3 border border-white/5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-9 h-9 rounded-full object-cover border border-amber-500/30"
                  />
                  <div className="flex-1">
                    <p className="text-xs text-white font-semibold">{review.name}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-amber-400">{review.device}</span>
                      <span className="text-[9px] text-white/30">•</span>
                      <span className="text-[9px] text-white/40">{review.country}</span>
                    </div>
                  </div>
                  <div className="flex">
                    {Array.from({ length: review.rating }).map((_, j) => (
                      <Star key={j} size={10} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">&#8220;{review.text}&#8221;</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Phone Mockup - VYRO App Preview */}
      <div className="px-4 mt-4">
        <div className="glass-dark rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">VYRO App — Sempre con te</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Phone mockup 1 */}
            <div className="relative">
              <div className="bg-[#0c101c] rounded-2xl p-2 border-2 border-white/10 shadow-xl">
                <div className="bg-gradient-to-b from-[#0c101c] to-[#111827] rounded-xl overflow-hidden">
                  <div className="bg-amber-500/10 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-amber-400 font-bold">VYRO GPU</span>
                      <span className="text-[7px] text-emerald-400">● Live</span>
                    </div>
                  </div>
                  <div className="p-2 space-y-1.5">
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-[7px] text-white/50">Il tuo saldo</p>
                      <p className="text-sm font-bold text-amber-400">$1,245.80</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="bg-emerald-500/10 rounded p-1.5 text-center">
                        <p className="text-[6px] text-emerald-300">Oggi</p>
                        <p className="text-[9px] font-bold text-emerald-400">+$24.00</p>
                      </div>
                      <div className="bg-blue-500/10 rounded p-1.5 text-center">
                        <p className="text-[6px] text-blue-300">7 giorni</p>
                        <p className="text-[9px] font-bold text-blue-400">+$168.00</p>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded p-1.5 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center">
                        <Cpu size={8} className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[7px] text-white font-medium">G-700 Attivo</p>
                        <p className="text-[6px] text-emerald-400">Guadagno: $24/giorno</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-center text-white/40 mt-2">Dashboard</p>
            </div>
            {/* Phone mockup 2 */}
            <div className="relative">
              <div className="bg-[#0c101c] rounded-2xl p-2 border-2 border-white/10 shadow-xl">
                <div className="bg-gradient-to-b from-[#0c101c] to-[#111827] rounded-xl overflow-hidden">
                  <div className="bg-emerald-500/10 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-emerald-400 font-bold">Team Network</span>
                      <span className="text-[7px] text-amber-400">5% / 2%</span>
                    </div>
                  </div>
                  <div className="p-2 space-y-1.5">
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-[7px] text-white/50">Team guadagni</p>
                      <p className="text-sm font-bold text-emerald-400">$387.50</p>
                    </div>
                    <div className="space-y-1">
                      {[{ name: 'Paolo M.', earn: 42 }, { name: 'Giulia R.', earn: 28 }, { name: 'Alex K.', earn: 55 }].map((member, j) => (
                        <div key={j} className="bg-white/5 rounded p-1.5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                              <span className="text-[6px] text-amber-400 font-bold">{member.name[0]}</span>
                            </div>
                            <span className="text-[7px] text-white">{member.name}</span>
                          </div>
                          <span className="text-[7px] text-emerald-400">+${member.earn}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-center text-white/40 mt-2">Team</p>
            </div>
          </div>
          <p className="text-[10px] text-white/30 text-center mt-3">
            Disponibile su tutti i dispositivi • Monitoraggio in tempo reale
          </p>
        </div>
      </div>

      {/* Promo Banner - Extra images */}
      <div className="px-4 mt-4">
        <div className="glass-dark rounded-xl overflow-hidden border border-amber-500/20">
          <div className="relative">
            <img
              src="/images/promo/promo-11.jpg"
              alt="VYRO networking event"
              className="w-full h-40 object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <span className="px-3 py-1 bg-amber-500/90 text-[9px] font-bold text-black rounded-full mb-2">VYRO GPU CLOUD</span>
              <p className="font-display text-lg font-bold text-white">Unisciti alla rivoluzione</p>
              <p className="text-[11px] text-white/70 mt-1">Guadagna ogni giorno con la potenza delle GPU</p>
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
