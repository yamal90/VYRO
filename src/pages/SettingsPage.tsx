import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Eye,
  Smartphone,
  Palette,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, balanceVisible, toggleBalanceVisibility } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  if (!currentUser) return null;

  const settingsGroups = [
    {
      title: t('settings.general', 'Generale'),
      items: [
        {
          icon: Globe,
          label: t('settings.language', 'Lingua'),
          description: t('settings.languageDesc', 'Scegli la lingua dell\'interfaccia'),
          action: 'language',
        },
        {
          icon: Palette,
          label: t('settings.theme', 'Tema'),
          description: darkMode ? 'Scuro' : 'Chiaro',
          action: 'theme',
          toggle: darkMode,
          onToggle: () => setDarkMode(!darkMode),
        },
        {
          icon: Eye,
          label: t('settings.balanceVisibility', 'Visibilità saldo'),
          description: balanceVisible ? 'Visibile' : 'Nascosto',
          action: 'balance',
          toggle: balanceVisible,
          onToggle: toggleBalanceVisibility,
        },
      ],
    },
    {
      title: t('settings.notifications', 'Notifiche'),
      items: [
        {
          icon: Bell,
          label: t('settings.pushNotifications', 'Notifiche push'),
          description: t('settings.pushDesc', 'Ricevi aggiornamenti in tempo reale'),
          toggle: notifications,
          onToggle: () => setNotifications(!notifications),
        },
        {
          icon: Smartphone,
          label: t('settings.haptic', 'Feedback aptico'),
          description: t('settings.hapticDesc', 'Vibrazione per le interazioni'),
          toggle: hapticFeedback,
          onToggle: () => setHapticFeedback(!hapticFeedback),
        },
      ],
    },
    {
      title: t('settings.security', 'Sicurezza'),
      items: [
        {
          icon: Shield,
          label: t('settings.twoFactor', 'Autenticazione a due fattori'),
          description: t('settings.twoFactorDesc', 'Aggiungi un livello di sicurezza extra'),
          action: '2fa',
        },
      ],
    },
    {
      title: t('settings.support', 'Supporto'),
      items: [
        {
          icon: HelpCircle,
          label: t('settings.faq', 'FAQ'),
          description: t('settings.faqDesc', 'Domande frequenti'),
          action: 'faq',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 pb-24">
      {/* Header */}
      <div className="relative overflow-hidden pt-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <div className="gradient-dark px-4 pt-6 pb-8 relative z-10">
          <h1 className="font-display text-2xl font-bold text-white tracking-wider mb-2">
            {t('settings.title', 'Impostazioni')}
          </h1>
          <p className="text-white/50 text-xs">
            {t('settings.subtitle', 'Personalizza la tua esperienza VYRO')}
          </p>
        </div>
      </div>

      {/* Settings Groups */}
      <div className="px-4 -mt-4 space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 px-1">
              {group.title}
            </h3>
            <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
              {group.items.map((item, itemIndex) => (
                <div key={item.label}>
                  {itemIndex > 0 && <div className="h-px bg-white/5" />}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <item.icon size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{item.label}</p>
                        <p className="text-xs text-white/50">{item.description}</p>
                      </div>
                    </div>

                    {item.toggle !== undefined ? (
                      <button
                        onClick={item.onToggle}
                        className={`w-12 h-7 rounded-full transition-colors ${
                          item.toggle ? 'bg-purple-500' : 'bg-slate-700'
                        }`}
                      >
                        <motion.div
                          animate={{ x: item.toggle ? 20 : 2 }}
                          className="w-5 h-5 rounded-full bg-white shadow-md"
                        />
                      </button>
                    ) : item.action === 'language' ? (
                      <LanguageSwitcher compact />
                    ) : (
                      <ChevronRight size={18} className="text-white/30" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Language Selector Full */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/50 border border-white/10 rounded-xl p-4"
        >
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">
            {t('settings.selectLanguage', 'Seleziona Lingua')}
          </h3>
          <LanguageSwitcher />
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-center"
        >
          <p className="text-xs text-white/40">VYRO GPU v2.0</p>
          <p className="text-[10px] text-white/30 mt-1">© 2025 VYRO Cloud Computing</p>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
