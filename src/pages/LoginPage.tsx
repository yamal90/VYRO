import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Eye, EyeOff, Zap } from 'lucide-react';
import { useApp } from '../store/AppContext';

const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [email, setEmail] = useState('demo@vyrogpu.com');
  const [password, setPassword] = useState('demo123');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const ok = login(email, password);
      if (!ok) setError('Credenziali non valide');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=1200&fit=crop')" }}
        />
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary glow-purple mb-4"
          >
            <Cpu className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wider">VYRO GPU</h1>
          <p className="text-slate-400 mt-2 text-sm">Cloud Computing Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Accedi al tuo account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="email@esempio.com"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 gradient-primary rounded-xl text-white font-semibold text-base glow-purple hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap size={18} />
                  Accedi
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-xs">Demo: qualsiasi email/password</p>
            <p className="text-slate-500 text-xs mt-1">Admin: admin@vyrogpu.com</p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
            <p className="text-slate-400 text-sm">
              Non hai un account?{' '}
              <button className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                Registrati
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-[10px] mt-6 leading-relaxed">
          Piattaforma demo con crediti virtuali interni.<br />
          Nessun rendimento finanziario reale garantito.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
