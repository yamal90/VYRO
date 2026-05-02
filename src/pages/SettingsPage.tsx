import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Eye,
  Smartphone,
  Palette,
  LogOut,
  Camera,
  Edit3,
  Mail,
  Lock,
} from 'lucide-react';
import { useApp } from '../store/AppContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import NicknameModal from '../components/ui/NicknameModal';
import AvatarModal from '../components/ui/AvatarModal';

const STORAGE_KEY = 'vyro_settings';

interface LocalPrefs {
  darkMode: boolean;
  notifications: boolean;
  hapticFeedback: boolean;
}

function loadPrefs(): LocalPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LocalPrefs;
  } catch { /* ignore */ }
  return { darkMode: true, notifications: true, hapticFeedback: true };
}

function savePrefs(prefs: LocalPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    currentUser,
    balanceVisible,
    toggleBalanceVisibility,
    updateNickname,
    updateAvatar,
    requestPasswordReset,
    logout,
    pushNotice,
  } = useApp();

  const [prefs, setPrefs] = useState<LocalPrefs>(loadPrefs);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const togglePref = useCallback((key: keyof LocalPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handlePasswordReset = useCallback(async () => {
    if (!currentUser || resetEmailSent) return;
    const result = await requestPasswordReset(currentUser.email);
    if (result.success) {
      setResetEmailSent(true);
      pushNotice('success', t('settings.resetEmailSent', 'Email di reset inviata. Controlla la tua casella.'));
    } else {
      pushNotice('error', result.message);
    }
  }, [currentUser, resetEmailSent, requestPasswordReset, pushNotice, t]);

  const handleLogout = useCallback(async () => {
    setShowLogoutConfirm(false);
    await logout();
  }, [logout]);

  if (!currentUser) return null;

  const profileAvatar = currentUser.avatar_url || `https://i.pravatar.cc/160?u=${currentUser.id}`;

  const settingsGroups = [
    {
      title: t('settings.general', 'Generale'),
      items: [
        {
          icon: Globe,
          label: t('settings.language', 'Lingua'),
          description: t('settings.languageDesc', "Scegli la lingua dell'interfaccia"),
          type: 'language' as const,
        },
        {
          icon: Palette,
          label: t('settings.theme', 'Tema'),
          description: prefs.darkMode ? 'Scuro' : 'Chiaro',
          type: 'toggle' as const,
          toggle: prefs.darkMode,
          onToggle: () => togglePref('darkMode'),
        },
        {
          icon: Eye,
          label: t('settings.balanceVisibility', 'Visibilità saldo'),
          description: balanceVisible ? 'Visibile' : 'Nascosto',
          type: 'toggle' as const,
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
          type: 'toggle' as const,
          toggle: prefs.notifications,
          onToggle: () => togglePref('notifications'),
        },
        {
          icon: Smartphone,
          label: t('settings.haptic', 'Feedback aptico'),
          description: t('settings.hapticDesc', 'Vibrazione per le interazioni'),
          type: 'toggle' as const,
          toggle: prefs.hapticFeedback,
          onToggle: () => togglePref('hapticFeedback'),
        },
      ],
    },
    {
      title: t('settings.security', 'Sicurezza'),
      items: [
        {
          icon: Lock,
          label: t('settings.changePassword', 'Cambia password'),
          description: resetEmailSent
            ? t('settings.resetSent', 'Email inviata')
            : t('settings.changePasswordDesc', 'Ricevi email per reimpostare la password'),
          type: 'action' as const,
          onAction: handlePasswordReset,
          disabled: resetEmailSent,
        },
        {
          icon: Shield,
          label: t('settings.twoFactor', 'Autenticazione a due fattori'),
          description: t('settings.comingSoon', 'Prossimamente'),
          type: 'info' as const,
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
          type: 'nav' as const,
          onAction: () => navigate('/faq'),
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

      <div className="px-4 -mt-4 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAvatarModalOpen(true)}
              className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-500/40 flex-shrink-0 group"
              aria-label={t('settings.changeAvatar', 'Cambia avatar')}
            >
              <img
                src={profileAvatar}
                alt={currentUser.username}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={18} className="text-white" />
              </div>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-base truncate">{currentUser.username}</p>
                <button
                  onClick={() => setNicknameModalOpen(true)}
                  className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
                  aria-label={t('settings.editNickname', 'Modifica nickname')}
                >
                  <Edit3 size={12} className="text-purple-300" />
                </button>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Mail size={12} className="text-white/40" />
                <p className="text-white/50 text-xs truncate">{currentUser.email}</p>
              </div>
              <p className="text-white/30 text-[10px] mt-0.5">
                {t('settings.memberSince', 'Membro dal')} {new Date(currentUser.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (groupIndex + 1) * 0.1 }}
          >
            <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2 px-1">
              {group.title}
            </h3>
            <div className="bg-slate-900/50 border border-white/10 rounded-xl overflow-hidden">
              {group.items.map((item, itemIndex) => (
                <div key={item.label}>
                  {itemIndex > 0 && <div className="h-px bg-white/5" />}
                  <div
                    className={`p-4 flex items-center justify-between ${
                      item.type === 'nav' || item.type === 'action'
                        ? 'cursor-pointer hover:bg-white/5 transition-colors'
                        : ''
                    } ${'disabled' in item && item.disabled ? 'opacity-50' : ''}`}
                    onClick={
                      item.type === 'nav' || item.type === 'action'
                        ? () => { if ('onAction' in item) item.onAction?.(); }
                        : undefined
                    }
                    role={item.type === 'nav' || item.type === 'action' ? 'button' : undefined}
                    tabIndex={item.type === 'nav' || item.type === 'action' ? 0 : undefined}
                    onKeyDown={
                      item.type === 'nav' || item.type === 'action'
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              if ('onAction' in item) item.onAction?.();
                            }
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <item.icon size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{item.label}</p>
                        <p className="text-xs text-white/50">{item.description}</p>
                      </div>
                    </div>

                    {item.type === 'toggle' && 'onToggle' in item ? (
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
                    ) : item.type === 'language' ? (
                      <LanguageSwitcher compact />
                    ) : item.type === 'nav' ? (
                      <ChevronRight size={18} className="text-white/30" />
                    ) : item.type === 'info' ? (
                      <span className="text-[10px] text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
                        Soon
                      </span>
                    ) : null}
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
          transition={{ delay: 0.5 }}
          className="bg-slate-900/50 border border-white/10 rounded-xl p-4"
        >
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">
            {t('settings.selectLanguage', 'Seleziona Lingua')}
          </h3>
          <LanguageSwitcher />
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center gap-3 hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={18} className="text-red-400" />
            <span className="text-red-400 font-semibold text-sm">
              {t('settings.logout', 'Esci dall\'account')}
            </span>
          </button>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-center"
        >
          <p className="text-xs text-white/40">VYRO GPU v2.0</p>
          <p className="text-[10px] text-white/30 mt-1">&copy; 2025 VYRO Cloud Computing</p>
        </motion.div>
      </div>

      {/* Nickname Modal */}
      <NicknameModal
        isOpen={nicknameModalOpen}
        currentNickname={currentUser.username}
        onClose={() => setNicknameModalOpen(false)}
        onSave={(nickname) => {
          setNicknameModalOpen(false);
          void updateNickname(nickname).then((result) => {
            pushNotice(result.success ? 'success' : 'error', result.message);
          });
        }}
      />

      {/* Avatar Modal */}
      <AvatarModal
        isOpen={avatarModalOpen}
        currentAvatarUrl={currentUser.avatar_url}
        onClose={() => setAvatarModalOpen(false)}
        onSave={async (file) => {
          const result = await updateAvatar(file);
          pushNotice(result.success ? 'success' : 'error', result.message);
          return result;
        }}
      />

      {/* Logout Confirmation */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="glass-dark rounded-2xl p-6 w-full max-w-sm border border-red-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <LogOut size={24} className="text-red-400" />
                </div>
                <h3 className="text-white font-bold text-lg">
                  {t('settings.logoutConfirmTitle', 'Conferma logout')}
                </h3>
                <p className="text-white/50 text-sm mt-2">
                  {t('settings.logoutConfirmMsg', 'Sei sicuro di voler uscire dal tuo account?')}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-semibold text-sm hover:bg-white/20 transition-colors"
                >
                  {t('common.cancel', 'Annulla')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
                >
                  {t('settings.logout', 'Esci')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
