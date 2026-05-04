import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle, Check, Copy, X, Wallet, Shield, Camera, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ActionResult } from '../../types';
import { supabase } from '../../lib/supabase';

type TransferMode = 'deposit' | 'withdrawal';

interface TransferModalProps {
  isOpen: boolean;
  mode: TransferMode;
  onClose: () => void;
  onSubmit: (payload: { amount: number; txHash?: string; walletAddress?: string; proofImageUrl?: string }) => Promise<ActionResult>;
  depositAddress?: string;
  depositAsset?: string;
  depositNetwork?: string;
  minDeposit?: number;
  minWithdraw?: number;
  availableBalance?: number;
}

interface TransferModalContentProps {
  mode: TransferMode;
  onClose: () => void;
  onSubmit: (payload: { amount: number; txHash?: string; walletAddress?: string; proofImageUrl?: string }) => Promise<ActionResult>;
  depositAddress: string;
  depositAsset: string;
  depositNetwork: string;
  minDeposit: number;
  minWithdraw: number;
  availableBalance: number;
}

const TransferModalContent: React.FC<TransferModalContentProps> = ({
  mode,
  onClose,
  onSubmit,
  depositAddress,
  depositAsset,
  depositNetwork,
  minDeposit,
  minWithdraw,
  availableBalance,
}) => {
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Seleziona un file immagine (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Immagine troppo grande (max 5MB).');
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
    setError('');
  };

  const submitLabel = mode === 'deposit' ? 'Salva deposito' : 'Salva prelievo';
  const title = mode === 'deposit' ? 'Ricarica account' : 'Richiedi prelievo';
  const Icon = mode === 'deposit' ? ArrowDownCircle : ArrowUpCircle;

  const handleCopy = async () => {
    if (!depositAddress) return;
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Copia non riuscita.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      setError('Inserisci un importo valido.');
      return;
    }

    if (mode === 'deposit') {
      if (minDeposit > 0 && normalizedAmount < minDeposit) {
        setError(`Importo minimo deposito: ${minDeposit.toFixed(2)}.`);
        return;
      }
      if (!depositAddress) {
        setError('Indirizzo deposito non configurato dall\'admin.');
        return;
      }
      if (!txHash.trim()) {
        setError('Hash transazione obbligatorio. Inserisci l\'hash TX della transazione.');
        return;
      }
      if (txHash.trim().length < 10) {
        setError('Hash transazione non valido. Controlla e riprova.');
        return;
      }
      if (!proofFile) {
        setError('Screenshot dell\'hash obbligatorio. Carica la foto della transazione.');
        return;
      }
    } else {
      if (!walletAddress.trim()) {
        setError('Inserisci il tuo wallet di prelievo.');
        return;
      }
      if (walletAddress.trim().length < 20) {
        setError('Wallet non valido.');
        return;
      }
      if (minWithdraw > 0 && normalizedAmount < minWithdraw) {
        setError(`Importo minimo prelievo: ${minWithdraw.toFixed(2)}.`);
        return;
      }
      if (normalizedAmount > availableBalance) {
        setError('Saldo USDT insufficiente.');
        return;
      }
    }

    setLoading(true);

    let proofImageUrl: string | undefined;
    if (mode === 'deposit' && proofFile) {
      try {
        setUploadingProof(true);
        if (!supabase) throw new Error('Supabase non configurato');
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        if (!userId) throw new Error('Non autenticato');
        const ext = (proofFile.name.split('.').pop() || 'jpg').toLowerCase();
        const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
        const path = `${userId}/${Date.now()}-proof-${Math.random().toString(36).slice(2, 9)}.${safeExt}`;
        const { error: upErr } = await supabase.storage.from('avatars').upload(path, proofFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(path);
        proofImageUrl = pubData.publicUrl;
      } catch {
        setError('Upload screenshot fallito. Riprova.');
        setLoading(false);
        setUploadingProof(false);
        return;
      }
      setUploadingProof(false);
    }

    const result = await onSubmit({
      amount: normalizedAmount,
      txHash: mode === 'deposit' ? txHash.trim() || undefined : undefined,
      walletAddress: mode === 'withdrawal' ? walletAddress.trim() : undefined,
      proofImageUrl,
    });
    setLoading(false);

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
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 pt-8 pb-24 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="glass-dark rounded-2xl p-6 w-full max-w-md border border-amber-500/25"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              mode === 'deposit' ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              <Icon size={20} className={mode === 'deposit' ? 'text-green-400' : 'text-red-400'} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{title}</h3>
              <p className="text-slate-400 text-xs">
                {mode === 'deposit'
                  ? `Salva la tua ricarica e segnala il TX su ${depositAsset}/${depositNetwork}.`
                  : 'Salva il tuo wallet di prelievo e la richiesta rimane nello storico.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Chiudi"
          >
            <X size={16} />
          </button>
        </div>

        {mode === 'deposit' && (
          <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
            {/* Security Scan QR Code */}
            {depositAddress && (
              <div className="flex flex-col items-center mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield size={12} className="text-green-400" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-green-300 font-semibold">Security Scan</p>
                </div>
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={depositAddress} size={160} level="H" />
                </div>
                <p className="text-[9px] text-green-200/60 mt-2">Scansiona per verificare l'indirizzo</p>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-green-200/80">Wallet deposito</p>
                <p className="text-sm text-white break-all mt-1 font-mono">{depositAddress || 'Non configurato'}</p>
                <p className="text-[11px] text-green-100/70 mt-2">
                  {depositAsset} • {depositNetwork}
                  {minDeposit > 0 ? ` • Minimo ${minDeposit.toFixed(2)}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!depositAddress}
                className="shrink-0 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiato' : 'Copia'}
              </button>
            </div>
          </div>
        )}

        {mode === 'withdrawal' && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-200/80">Saldo disponibile</p>
            <p className="text-lg font-bold text-white mt-1">{availableBalance.toFixed(2)} USDT</p>
            <p className="text-[11px] text-red-100/70 mt-2">
              Il wallet inserito viene salvato nella richiesta di prelievo.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-400 mb-2">
            Importo {mode === 'deposit' ? 'deposito' : 'prelievo'}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-amber-500/25 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
            placeholder="0.00"
            autoFocus
          />

          {mode === 'deposit' ? (
            <>
              {/* Warning banner */}
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-300 text-xs font-bold">Obbligatorio: Hash + Screenshot</p>
                  <p className="text-amber-200/70 text-[10px] mt-0.5">
                    Ad ogni deposito devi caricare l'hash della transazione E la foto/screenshot dell'hash. Senza entrambi il deposito non verrà accettato.
                  </p>
                </div>
              </div>

              {/* TX Hash - REQUIRED */}
              <label className="block text-sm text-slate-400 mt-4">
                Hash transazione <span className="text-red-400">*</span>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="mt-2 w-full px-4 py-3 rounded-xl bg-white/10 border border-amber-500/25 text-white placeholder-white/30 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  placeholder="Inserisci l'hash TX della transazione"
                />
              </label>

              {/* Proof screenshot - REQUIRED */}
              <label className="block text-sm text-slate-400 mt-4">
                Screenshot dell'hash <span className="text-red-400">*</span>
              </label>
              <div
                className={`mt-2 relative rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                  proofFile
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-amber-500/25 bg-white/5 hover:border-amber-400/50 hover:bg-white/10'
                }`}
                onClick={() => document.getElementById('proof-upload')?.click()}
              >
                <input
                  id="proof-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProofSelect}
                />
                {proofPreview ? (
                  <div className="flex items-center gap-3">
                    <img src={proofPreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-white/10" />
                    <div className="text-left flex-1">
                      <p className="text-emerald-400 text-xs font-semibold">Screenshot caricato</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">{proofFile?.name}</p>
                      <p className="text-slate-500 text-[10px]">Tocca per cambiare</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Camera size={24} className="text-amber-400" />
                    <p className="text-white/70 text-xs font-semibold">Carica la foto dell'hash</p>
                    <p className="text-slate-500 text-[10px]">JPG, PNG, WEBP — max 5MB</p>
                  </div>
                )}
              </div>
              {uploadingProof && (
                <p className="text-amber-400 text-[10px] mt-1 animate-pulse">Caricamento screenshot...</p>
              )}
            </>
          ) : (
            <label className="block text-sm text-slate-400 mt-4">
              Il tuo wallet di prelievo
              <div className="mt-2 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-amber-500/25">
                <Wallet size={16} className="text-amber-300 shrink-0" />
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-white/30 focus:outline-none"
                  placeholder="Inserisci il wallet..."
                />
              </div>
            </label>
          )}

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

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
              disabled={loading}
              className="flex-1 py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Salvataggio...' : submitLabel}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  mode,
  onClose,
  onSubmit,
  depositAddress = '',
  depositAsset = 'USDT',
  depositNetwork = 'TRC20',
  minDeposit = 0,
  minWithdraw = 0,
  availableBalance = 0,
}) => (
  <AnimatePresence>
    {isOpen && (
      <TransferModalContent
        key={`transfer-${mode}`}
        mode={mode}
        onClose={onClose}
        onSubmit={onSubmit}
        depositAddress={depositAddress}
        depositAsset={depositAsset}
        depositNetwork={depositNetwork}
        minDeposit={minDeposit}
        minWithdraw={minWithdraw}
        availableBalance={availableBalance}
      />
    )}
  </AnimatePresence>
);

export default TransferModal;
