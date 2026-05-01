import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User } from 'lucide-react';

interface NicknameModalProps {
  isOpen: boolean;
  currentNickname: string;
  onClose: () => void;
  onSave: (nickname: string) => void;
}

const NicknameModal: React.FC<NicknameModalProps> = ({
  isOpen,
  currentNickname,
  onClose,
  onSave,
}) => {
  const [value, setValue] = useState(currentNickname);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Il nickname non può essere vuoto.');
      return;
    }
    if (trimmed.length < 3) {
      setError('Minimo 3 caratteri.');
      return;
    }
    if (trimmed.length > 24) {
      setError('Massimo 24 caratteri.');
      return;
    }
    if (trimmed === currentNickname) {
      onClose();
      return;
    }
    onSave(trimmed);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Modifica nickname"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="glass-dark rounded-2xl p-6 w-full max-w-sm border border-purple-500/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <User size={20} className="text-purple-400" />
                </div>
                <h3 className="text-white font-bold text-lg">Modifica nickname</h3>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                aria-label="Chiudi"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor="nickname-input" className="block text-sm text-slate-400 mb-2">
                Nuovo nickname
              </label>
              <input
                id="nickname-input"
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError('');
                }}
                maxLength={24}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-purple-500/30 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="Inserisci nickname..."
              />
              {error && (
                <p className="text-red-400 text-xs mt-2">{error}</p>
              )}
              <p className="text-slate-500 text-xs mt-2">
                {value.trim().length}/24 caratteri
              </p>

              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-semibold text-sm hover:bg-white/20 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Salva
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NicknameModal;
