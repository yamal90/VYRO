import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Eye, EyeOff, Ticket, UserPlus, Zap } from 'lucide-react';
import { useApp } from '../store/AppContext';

const LoginPage: React.FC = () => {
  const { authMode, setAuthMode, login, loginWithGoogle, register, authLoading } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const isRegister = authMode === 'register';

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      setAuthMode('register');
      setReferralCode(ref.toUpperCase());
    }
  }, [setAuthMode]);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const toggleMode = () => {
    setAuthMode(isRegister ? 'login' : 'register');
    setError('');
    if (!isRegister) {
      setReferralCode((value) => value.trim().toUpperCase());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = isRegister
      ? await register({
          username,
          email,
          password,
          confirmPassword,
          referralCode,
        })
      : await login(email, password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (isRegister) {
      resetForm();
    }
  };

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=1200&fit=crop')" }}
        />
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary glow-purple mb-4"
          >
            <Cpu className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wider">VYRO GPU</h1>
          <p className="text-slate-400 mt-2 text-sm">
            {isRegister ? 'Crea un account con referral obbligatorio' : 'Accedi al tuo account'}
          </p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
          <div className="flex gap-2 bg-slate-900/50 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                !isRegister ? 'gradient-primary text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                isRegister ? 'gradient-primary text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrati
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="CyberNova"
                  required={isRegister}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-slate-300 mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1.5 block">Conferma password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all pr-12"
                      placeholder="••••••••"
                      required={isRegister}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1.5 block">Referral code</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all pl-11"
                      placeholder="VYRO-XXXXXX"
                      required={isRegister}
                    />
                    <Ticket size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Obbligatorio per creare il profilo.</p>
                </div>
              </>
            )}

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
              disabled={authLoading}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 gradient-primary rounded-xl text-white font-semibold text-base glow-purple hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isRegister ? (
                <>
                  <UserPlus size={18} />
                  Crea account
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Accedi
                </>
              )}
            </motion.button>

            <button
              type="button"
              disabled={authLoading}
              onClick={async () => {
                setError('');
                const result = await loginWithGoogle();
                if (!result.success) setError(result.message);
              }}
              className="w-full py-3 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Continua con Google
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
            <p className="text-slate-400 text-sm">
              {isRegister ? 'Hai già un account?' : 'Non hai un account?'}{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-purple-400 font-semibold hover:text-purple-300 transition-colors"
              >
                {isRegister ? 'Vai al login' : 'Registrati'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-[10px] mt-6 leading-relaxed">
          Accesso protetto e profilo persistito in piattaforma.<br />
          Il referral code viene validato automaticamente.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
