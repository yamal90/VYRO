import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, ImageUp, X } from 'lucide-react';
import type { ActionResult } from '../../types';

interface AvatarModalProps {
  isOpen: boolean;
  currentAvatarUrl?: string;
  onClose: () => void;
  onSave: (file: File) => Promise<ActionResult>;
}

interface AvatarModalContentProps {
  currentAvatarUrl?: string;
  onClose: () => void;
  onSave: (file: File) => Promise<ActionResult>;
}

const AvatarModalContent: React.FC<AvatarModalContentProps> = ({ currentAvatarUrl, onClose, onSave }) => {
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatarUrl ?? '');

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived preview from file selection
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Seleziona un\'immagine.');
      return;
    }

    setSaving(true);
    const result = await onSave(file);
    setSaving(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="glass-dark rounded-2xl p-6 w-full max-w-sm border border-purple-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Camera size={18} className="text-cyan-300" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Cambia avatar</h3>
              <p className="text-slate-400 text-xs">Formato consigliato: JPG/PNG/WebP, max 5MB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-4 mb-4">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border border-cyan-400/40 mx-auto mb-3 bg-slate-900">
              {previewUrl ? (
                <img src={previewUrl} alt="Anteprima avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <Camera size={20} />
                </div>
              )}
            </div>

            <label className="w-full cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
              <ImageUp size={15} />
              Seleziona foto
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  setFile(selected);
                  setError('');
                }}
              />
            </label>
          </div>

          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl gradient-primary text-white font-semibold text-sm disabled:opacity-60"
            >
              {saving ? 'Salvataggio...' : 'Salva avatar'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, currentAvatarUrl, onClose, onSave }) => (
  <AnimatePresence>
    {isOpen && (
      <AvatarModalContent
        key="avatar-modal"
        currentAvatarUrl={currentAvatarUrl}
        onClose={onClose}
        onSave={onSave}
      />
    )}
  </AnimatePresence>
);

export default AvatarModal;
