import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, Shield, Cpu, Users, Zap, Award, ChevronDown, Lock,
  Server, Key, Fingerprint, Globe, AlertTriangle,
  TrendingUp, Gift, RefreshCw
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'platform',
    title: 'Cos\'è VYRO GPU',
    icon: Cpu,
    color: 'from-purple-500 to-violet-600',
    items: [
      {
        question: 'Cos\'è VYRO GPU?',
        answer: 'VYRO GPU è una piattaforma innovativa di cloud computing che permette agli utenti di attivare potenti unità di elaborazione GPU per generare VX Token attraverso la potenza di calcolo distribuita. Ogni GPU attiva contribuisce alla rete e genera ricompense proporzionali alla sua potenza in TFLOPS.'
      },
      {
        question: 'Come funziona il sistema?',
        answer: 'Il funzionamento è semplice: acquisti e attivi una GPU dal nostro catalogo, il sistema la registra nella tua dashboard, e da quel momento inizia a produrre VX Token automaticamente. La produzione è calcolata in base ai TFLOPS della GPU e viene aggiornata in tempo reale nella Live Production Bar.'
      },
      {
        question: 'Cosa sono i TFLOPS?',
        answer: 'TFLOPS (Tera Floating-point Operations Per Second) è l\'unità di misura della potenza di calcolo di una GPU. Più TFLOPS ha una GPU, maggiore è la sua capacità di elaborazione e quindi la sua produzione di VX Token. Le nostre GPU vanno da 4 TFLOPS (X-120) a 6300 TFLOPS (IX-9900 Ultimate).'
      },
      {
        question: 'Quali sono le GPU Ultimate Edition?',
        answer: 'Le Ultimate Edition sono versioni premium delle nostre GPU più potenti, con potenza incrementata del 50% e design esclusivo. Sono identificate dal suffisso "ULTIMATE" nel nome e offrono la massima capacità produttiva della piattaforma.'
      }
    ]
  },
  {
    id: 'security',
    title: 'Sicurezza Portafogli',
    icon: Shield,
    color: 'from-green-500 to-emerald-600',
    items: [
      {
        question: 'Cos\'è VYRO Vault™?',
        answer: 'VYRO Vault™ è il nostro sistema di cold storage offline dove conserviamo il 98% degli asset degli utenti. Le chiavi private sono mantenute in camere blindate con accesso biometrico, distribuite in 3 continenti per garantire la massima sicurezza e ridondanza.'
      },
      {
        question: 'Come funziona Neural Shield™?',
        answer: 'Neural Shield™ è il nostro sistema di protezione basato su AI che monitora tutte le transazioni in tempo reale. Utilizza pattern recognition avanzata per rilevare anomalie e blocca automaticamente le operazioni sospette prima che vengano eseguite, proteggendo il tuo account da frodi e accessi non autorizzati.'
      },
      {
        question: 'Cos\'è Quantum Lock™?',
        answer: 'Quantum Lock™ è il nostro sistema di crittografia militare che utilizza AES-256 combinato con curve ellittiche per proteggere tutti i dati sensibili. Le chiavi di crittografia vengono ruotate ogni 24 ore e il sistema utilizza zero-knowledge proof per l\'autenticazione, garantendo che le tue credenziali non siano mai esposte.'
      },
      {
        question: 'Cos\'è il Trust Score™?',
        answer: 'Trust Score™ è un punteggio di reputazione da 0 a 100 che viene assegnato al tuo account basato sulla tua attività, storico transazioni e comportamento sulla piattaforma. Un punteggio alto sblocca limiti di prelievo più elevati, bonus esclusivi e priorità nel supporto.'
      },
      {
        question: 'Come funziona Secure Recovery™?',
        answer: 'Secure Recovery™ ti permette di recuperare l\'accesso al tuo account attraverso una seed phrase di 12 parole generata alla registrazione. Opzionalmente, puoi attivare il Social Recovery, che permette a contatti fidati di approvare il ripristino del tuo account. Tutti i recovery includono un time-lock di 48 ore per massima sicurezza.'
      },
      {
        question: 'Quali autenticazioni sono supportate?',
        answer: 'Supportiamo molteplici metodi di autenticazione: 2FA via app (Google Authenticator, Authy), SMS OTP, autenticazione biometrica (impronta digitale, Face ID), e hardware keys (YubiKey). Raccomandiamo di attivare almeno due metodi per la massima sicurezza.'
      }
    ]
  },
  {
    id: 'production',
    title: 'Produzione GPU',
    icon: Zap,
    color: 'from-amber-500 to-orange-600',
    items: [
      {
        question: 'Come vengono calcolati i guadagni?',
        answer: 'I guadagni sono calcolati moltiplicando i TFLOPS della tua GPU per un coefficiente di produzione base (0.05 VX per TFLOPS al minuto). Il sistema aggiorna il calcolo ogni secondo e puoi visualizzare la produzione in tempo reale nella Live Production Bar nella sezione "I Miei Dispositivi".'
      },
      {
        question: 'Quanto posso guadagnare?',
        answer: 'I guadagni dipendono dalla potenza delle tue GPU. Ecco alcuni esempi:\n• X-120 (4 TF): ~12.32 VX/settimana\n• G-700 (68 TF): ~209.94 VX/settimana\n• X-7900 (900 TF): ~3,703 VX/settimana\n• IX-9900 Ultimate (6300 TF): ~31,000 VX/settimana'
      },
      {
        question: 'Quando vengono distribuite le ricompense?',
        answer: 'La produzione VX viene accreditata automaticamente ogni secondo e visibile istantaneamente nel tuo saldo. I VX generati sono immediatamente disponibili per essere utilizzati per nuove attivazioni, trasferimenti o conversioni.'
      },
      {
        question: 'Posso avere più GPU attive?',
        answer: 'Assolutamente sì! Puoi attivare quante GPU desideri. La produzione totale sarà la somma della potenza di tutte le tue GPU attive. Più GPU possiedi, maggiore sarà la tua capacità produttiva e i tuoi guadagni.'
      }
    ]
  },
  {
    id: 'team',
    title: 'Sistema Team',
    icon: Users,
    color: 'from-blue-500 to-indigo-600',
    items: [
      {
        question: 'Come funzionano i referral?',
        answer: 'Ogni utente ha un codice invito unico e un link QR condivisibile. Quando qualcuno si registra tramite il tuo link, entra nel tuo team come membro di Livello 1. I membri che loro invitano diventano il tuo Livello 2.'
      },
      {
        question: 'Quali commissioni ricevo?',
        answer: 'Le commissioni si dividono in:\n• Livello 1 (inviti diretti): 3% sulla produzione + 5% bonus attivazione\n• Livello 2 (inviti dei tuoi inviti): 2% sulla produzione + 3% bonus attivazione\nLe commissioni vengono calcolate in tempo reale e accreditate automaticamente.'
      },
      {
        question: 'Ci sono bonus progressivi?',
        answer: 'Sì! Il sistema team include bonus progressivi:\n• 3 membri attivi: +10% su tutte le commissioni\n• 10 membri attivi: +25% + badge "Team Builder"\n• 50 membri attivi: +50% + badge "Network Leader"\n• 100+ membri: Accesso esclusivo alle GPU Collector Edition'
      },
      {
        question: 'Come monitoro il mio team?',
        answer: 'Nella sezione Team puoi vedere tutti i membri dei Livelli 1 e 2, il loro stato (attivo/inattivo), se hanno GPU attive, la loro produzione totale, e i guadagni che generano per te. Il dashboard si aggiorna in tempo reale.'
      }
    ]
  },
  {
    id: 'benefits',
    title: 'Benefici & Missioni',
    icon: Gift,
    color: 'from-pink-500 to-rose-600',
    items: [
      {
        question: 'Cos\'è il Claim Giornaliero?',
        answer: 'Ogni giorno puoi riscattare 2.5 VX gratuitamente visitando la sezione Benefici. Questo bonus è progettato per premiare la costanza degli utenti attivi. Se mantieni uno streak di 7 giorni consecutivi, sblocchi un bonus extra di 10 VX.'
      },
      {
        question: 'Quali missioni giornaliere esistono?',
        answer: 'Le missioni giornaliere includono:\n• Login giornaliero: +1 VX\n• Claim giornaliero: +2.5 VX\n• Controllo dispositivi: +0.5 VX\n• Invita un amico: +5 VX\nCompletare tutte le missioni garantisce bonus aggiuntivi.'
      },
      {
        question: 'Come funzionano i badge?',
        answer: 'I badge sono riconoscimenti che ottieni raggiungendo obiettivi specifici:\n• "Primo Login" - Accesso alla piattaforma\n• "Primo GPU" - Attivazione primo dispositivo\n• "Team Builder" - Invita 3 membri\n• "Streak 7" - 7 claim consecutivi\n• "Power User" - Raggiungi 100 TFLOPS\n• "Top Earner" - Genera 10,000 VX totali'
      },
      {
        question: 'Cos\'è la classifica?',
        answer: 'La classifica mostra i top performer della piattaforma basandosi su VX totali e potenza TFLOPS. Essere nei primi 3 posti garantisce visibilità speciale, bonus settimanali, e l\'ambito badge "Crown" che appare nel tuo profilo.'
      }
    ]
  },
  {
    id: 'certifications',
    title: 'Certificazioni',
    icon: Award,
    color: 'from-cyan-500 to-teal-600',
    items: [
      {
        question: 'Quali certificazioni possiede VYRO?',
        answer: 'VYRO GPU è certificata:\n• SOC 2 Type II Compliant - Security & Availability\n• ISO 27001 Certified - Information Security\n• GDPR Compliant - Data Protection\n• PCI DSS Level 1 - Payment Security\nQueste certificazioni vengono rinnovate annualmente con audit esterni.'
      },
      {
        question: 'Avete un Bug Bounty Program?',
        answer: 'Sì! Il nostro Bug Bounty Program premia ricercatori di sicurezza che trovano vulnerabilità nel nostro sistema. I premi vanno da $100 a $50,000 a seconda della gravità. Tutti i dettagli sono disponibili su security.vyrogpu.com'
      },
      {
        question: 'Chi sono i partner strategici?',
        answer: 'Collaboriamo con leader del settore per garantire la massima qualità:\n• NVIDIA - Partnership hardware GPU\n• AWS - Infrastruttura cloud\n• Cloudflare - Protezione DDoS\n• Ledger - Cold storage solutions\n• Chainalysis - Compliance & Monitoring'
      },
      {
        question: 'Come garantite l\'uptime?',
        answer: 'La nostra infrastruttura è progettata per il 99.97% di uptime garantito. Utilizziamo:\n• Datacenter distribuiti su 3 continenti\n• Load balancing automatico\n• Failover in tempo reale\n• Backup incrementali ogni ora\nLo stato dei sistemi è sempre visibile nel dashboard.'
      }
    ]
  }
];

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
  { icon: Globe, label: 'GDPR', color: 'text-purple-400' },
  { icon: Key, label: 'PCI DSS L1', color: 'text-amber-400' },
  { icon: Fingerprint, label: '2FA Ready', color: 'text-cyan-400' },
  { icon: Server, label: '99.97% Uptime', color: 'text-emerald-400' }
];

const FAQPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('platform');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showTeam, setShowTeam] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <div className="gradient-primary px-4 pt-6 pb-8 relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="w-8 h-8 text-white" />
            <h1 className="font-display text-2xl font-bold text-white tracking-wider">
              FAQ & Sicurezza
            </h1>
          </div>
          <p className="text-white/60 text-sm">
            Tutto quello che devi sapere sulla piattaforma
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
              className="bg-slate-800/50 border border-purple-500/20 rounded-xl overflow-hidden"
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
                  <ChevronDown size={18} className="text-purple-400" />
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
                      <div className="bg-slate-900/50 rounded-lg p-3.5 border-l-2 border-purple-500">
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
        <div className="glass-dark rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" />
            Statistiche Piattaforma
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="font-display text-xl font-bold text-purple-400">99.97%</p>
              <p className="text-[10px] text-slate-400 mt-1">Uptime garantito</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="font-display text-xl font-bold text-green-400">$50M+</p>
              <p className="text-[10px] text-slate-400 mt-1">Asset protetti</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="font-display text-xl font-bold text-cyan-400">24/7</p>
              <p className="text-[10px] text-slate-400 mt-1">Supporto attivo</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="font-display text-xl font-bold text-amber-400">3</p>
              <p className="text-[10px] text-slate-400 mt-1">Continenti attivi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section Toggle */}
      <div className="px-4 mt-6">
        <motion.button
          onClick={() => setShowTeam(!showTeam)}
          className="w-full glass-dark rounded-xl p-4 border border-purple-500/20 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Il Nostro Team</p>
              <p className="text-[10px] text-slate-400">Ingegneri e esperti di sicurezza</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: showTeam ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={20} className="text-purple-400" />
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
                  className="bg-slate-800/50 border border-purple-500/20 rounded-xl overflow-hidden"
                >
                  <div className="flex gap-4 p-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0 border border-purple-500/30">
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
                      <p className="text-xs text-purple-400 font-medium">{member.role}</p>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                        {member.bio}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.expertise.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] rounded-full"
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
              <div className="bg-gradient-to-r from-purple-900/50 via-slate-800/50 to-cyan-900/50 rounded-xl p-4 text-center border border-purple-500/20">
                <p className="font-display text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                  Innovazione. Sicurezza. Potenza.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Il team VYRO lavora 24/7 per garantire la migliore esperienza
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Support */}
      <div className="px-4 mt-6">
        <div className="glass-dark rounded-xl p-4 border border-purple-500/20">
          <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            Hai bisogno di aiuto?
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Il nostro team di supporto è disponibile 24/7 per rispondere a qualsiasi domanda.
          </p>
          <button
            onClick={() => window.location.href = 'mailto:support@vyrogpu.com'}
            className="w-full py-3 gradient-primary rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Contatta Supporto
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 mt-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <p className="text-[10px] text-amber-300 leading-relaxed text-center">
            Le informazioni fornite in questa FAQ sono a scopo informativo. VYRO GPU si riserva
            il diritto di modificare parametri e policy con preavviso agli utenti.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
