import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Languages, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
        >
          <span className="text-lg">{currentLang.flag}</span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-12 right-0 bg-slate-900 border border-white/20 rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px]"
            >
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/10 transition-colors ${
                    i18n.language === lang.code ? 'bg-amber-500/12' : ''
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm text-white flex-1 text-left">{lang.name}</span>
                  {i18n.language === lang.code && (
                    <Check size={14} className="text-amber-400" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Languages size={18} className="text-amber-400" />
          <div className="text-left">
            <p className="text-xs text-white/50">{t('settings.language')}</p>
            <p className="text-sm text-white font-medium">{currentLang.flag} {currentLang.name}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden"
          >
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-white/10 transition-colors ${
                  i18n.language === lang.code ? 'bg-amber-500/12' : ''
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm text-white flex-1 text-left">{lang.name}</span>
                {i18n.language === lang.code && (
                  <Check size={16} className="text-amber-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
