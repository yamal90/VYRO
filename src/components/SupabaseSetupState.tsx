import React from 'react';
import { Database, KeyRound, ShieldCheck } from 'lucide-react';

const steps = [
  'Copia .env.example in .env e inserisci URL e publishable key di Supabase.',
  "Esegui nell'ordine: /supabase/schema.sql, /supabase/migrations/001_rpc_and_rls.sql e /supabase/migrations/002_enhanced_features.sql nel tuo progetto Supabase.",
  "Ricarica l'app: registrazione, referral, claim, acquisti, staking, leaderboard e admin useranno il database reale.",
];

const SupabaseSetupState: React.FC = () => {
  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0c101c]/80 border border-white/10 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center justify-center w-18 h-18 mx-auto mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-400/20">
          <Database className="w-9 h-9 text-emerald-400" />
        </div>
        <h1 className="font-display text-2xl font-bold text-center tracking-wider">Configura Supabase</h1>
        <p className="text-slate-300 text-sm text-center mt-3 leading-relaxed">
          L&apos;app ora usa autenticazione, referral e dati reali via Supabase. Mancano solo le variabili ambiente del progetto.
        </p>

        <div className="mt-6 grid gap-3">
          {steps.map((step, index) => (
            <div key={step} className="flex items-start gap-3 rounded-2xl bg-white/5 border border-white/8 p-4">
              <div className="w-7 h-7 shrink-0 rounded-full bg-amber-500/12 text-amber-200 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/5 border border-white/8 p-4">
            <div className="flex items-center gap-2 text-emerald-300 mb-2">
              <KeyRound size={16} />
              <span className="text-sm font-semibold">Env richieste</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <code>VITE_SUPABASE_URL</code><br />
              <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/8 p-4">
            <div className="flex items-center gap-2 text-emerald-200 mb-2">
              <ShieldCheck size={16} />
              <span className="text-sm font-semibold">Schema incluso</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Lo schema è diviso tra tabelle base, migrazione RPC/RLS e feature avanzate: tutti e tre i file SQL sono necessari per il comportamento completo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSetupState;
