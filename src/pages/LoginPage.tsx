import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, KeyRound, Ticket, UserPlus, Zap, ShieldCheck, Sparkles, Loader2, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../store/AppContext';

type AuthStep = 'auth' | 'forgot' | 'reset';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    authMode,
    setAuthMode,
    login,
    loginWithGoogle,
    requestPasswordReset,
    completePasswordReset,
    register,
    authLoading,
  } = useApp();
  const [authStep, setAuthStep] = useState<AuthStep>('auth');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    return ref ? ref.toUpperCase() : '';
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleRedirecting, setGoogleRedirecting] = useState(false);
  const isRegister = authMode === 'register';

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const ref = queryParams.get('ref');
    const recoveryMode = queryParams.get('mode') === 'reset' || hashParams.get('type') === 'recovery';

    if (ref) {
      setAuthMode('register');
    }
    if (recoveryMode) {
      setAuthMode('login');
      setAuthStep('reset'); // eslint-disable-line react-hooks/set-state-in-effect -- URL param sync on mount
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const toggleMode = () => {
    setAuthMode(isRegister ? 'login' : 'register');
    setError('');
    setSuccess('');
    if (!isRegister) {
      setReferralCode((value) => value.trim().toUpperCase());
    }
  };

  const submitLabel = useMemo(() => {
    if (authStep === 'forgot') return t('auth.sendResetEmail');
    if (authStep === 'reset') return t('auth.updatePassword');
    return isRegister ? t('auth.createAccount') : t('auth.login');
  }, [authStep, isRegister, t]);

  const googleReferralMissing = isRegister && !referralCode.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (authStep === 'forgot') {
      const result = await requestPasswordReset(email);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSuccess(result.message);
      return;
    }

    if (authStep === 'reset') {
      const result = await completePasswordReset(password, confirmPassword);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSuccess(result.message);
      setAuthMode('login');
      setAuthStep('auth');
      setPassword('');
      setConfirmPassword('');
      return;
    }

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
      setSuccess(t('auth.registrationComplete'));
    }
  };

  return (
    <div className="min-h-screen gradient-dark flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatePresence>
        {googleRedirecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#06080f]/98 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                <img src="/vyro-wow-logo.svg" alt="VYRO" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.7 12 2.7 6.9 2.7 2.8 6.8 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12z" />
                  <path fill="#34A853" d="M3.9 7.6l3.2 2.4c.9-1.8 2.8-3 4.9-3 1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.7 12 2.7 8.4 2.7 5.3 4.7 3.9 7.6z" />
                  <path fill="#FBBC05" d="M12 21.3c2.5 0 4.6-.8 6.2-2.3l-2.9-2.3c-.8.5-1.8.9-3.3.9-2.4 0-4.5-1.6-5.2-3.8L3.5 16c1.4 3.1 4.6 5.3 8.5 5.3z" />
                  <path fill="#4285F4" d="M20.8 12.4c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.4-1.2 2.6-2.5 3.4l2.9 2.3c1.7-1.5 3-4 3-7z" />
                </svg>
                <Loader2 size={20} className="text-white/60 animate-spin" />
              </div>
              <h2 className="text-white text-lg font-bold mb-2">Connessione sicura</h2>
              <p className="text-white/60 text-sm max-w-xs mx-auto">
                Stai per essere reindirizzato a Google per l'accesso al tuo account VYRO
              </p>
              <div className="mt-6 flex items-center justify-center gap-2">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span className="text-emerald-400/80 text-[11px]">Connessione protetta e crittografata</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06080f]/80 via-[#06080f]/65 to-[#06080f]/90" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/6 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-[#0c101c]/80 border border-white/15 shadow-[0_14px_34px_rgba(2,6,23,0.5)] mb-4 overflow-hidden"
          >
            <img src="/vyro-wow-logo.svg" alt="VYRO logo" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wider">VYRO GPU</h1>
          <p className="text-amber-400/90 mt-1 text-[11px] uppercase tracking-[0.34em]">Experience</p>
          <p className="text-slate-400 mt-2 text-sm">
            {authStep === 'forgot'
              ? t('auth.recoverPassword')
              : authStep === 'reset'
                ? t('auth.setNewPassword')
                : isRegister
                  ? t('auth.createAccountReferral')
                  : t('auth.loginToAccount')}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[11px] text-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(240,180,41,0.9)]" />
            {t('auth.secureAccess')}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-300/90">
            <ShieldCheck size={13} className="text-emerald-300" />
            {t('auth.accountProtection')}
          </div>
        </div>

        <div className="relative bg-[#0c101c]/92 backdrop-blur-xl rounded-3xl p-8 border border-white/6 shadow-2xl overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-amber-400/8 to-transparent" />
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-amber-500/8 blur-2xl" />
          {authStep === 'auth' ? (
            <div className="flex gap-2 bg-white/3 p-1 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  !isRegister ? 'bg-amber-500 text-[#06080f]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('auth.login')}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  isRegister ? 'bg-amber-500 text-[#06080f]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('auth.register')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthStep('auth');
                setError('');
                setSuccess('');
              }}
              className="mb-6 inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              {t('auth.backToLogin')}
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authStep === 'auth' && isRegister && (
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/3 border border-white/6 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all"
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
                className="w-full px-4 py-3 bg-white/3 border border-white/6 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all"
                placeholder="email@esempio.com"
                required
              />
            </div>

            {authStep !== 'forgot' && (
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                  {authStep === 'reset' ? t('auth.newPassword') : t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/3 border border-white/6 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all pr-12"
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
            )}

            {(authStep === 'reset' || (authStep === 'auth' && isRegister)) && (
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                  {authStep === 'reset' ? t('auth.confirmNewPassword') : t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/3 border border-white/6 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all pr-12"
                    placeholder="••••••••"
                    required
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
            )}

            {authStep === 'auth' && isRegister && (
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Referral code</label>
                <div className="relative">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-white/3 border border-white/6 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all pl-11"
                    placeholder="VYRO-XXXXXX"
                    required={isRegister}
                  />
                  <Ticket size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{t('auth.referralMandatory')}</p>
              </div>
            )}

            {authStep === 'auth' && !isRegister && (
              <button
                type="button"
                onClick={() => {
                  setAuthStep('forgot');
                  setError('');
                  setSuccess('');
                  setAuthMode('login');
                }}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
              >
                <KeyRound size={12} />
                {t('auth.forgotPassword')}
              </button>
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

            {success && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-emerald-400 text-sm text-center"
              >
                {success}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={authLoading}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-[#06080f] font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : authStep === 'forgot' ? (
                <>
                  <KeyRound size={18} />
                  {submitLabel}
                </>
              ) : authStep === 'reset' ? (
                <>
                  <KeyRound size={18} />
                  {submitLabel}
                </>
              ) : isRegister ? (
                <>
                  <UserPlus size={18} />
                  {submitLabel}
                </>
              ) : (
                <>
                  <Zap size={18} />
                  {submitLabel}
                </>
              )}
            </motion.button>

            {authStep === 'auth' && (
              <div className="space-y-2">
                <div className="relative flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider">{t('auth.orContinueWith', 'oppure')}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <button
                  type="button"
                  disabled={authLoading || googleReferralMissing || googleRedirecting}
                  onClick={async () => {
                    setError('');
                    setSuccess('');
                    if (isRegister && !referralCode.trim()) {
                      setError(t('auth.referralRequired'));
                      return;
                    }
                    setGoogleRedirecting(true);
                    const result = await loginWithGoogle(isRegister ? referralCode : undefined);
                    if (!result.success) {
                      setError(result.message);
                      setGoogleRedirecting(false);
                    }
                  }}
                  className="w-full py-3.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg shadow-white/5"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.7 12 2.7 6.9 2.7 2.8 6.8 2.8 12s4.1 9.3 9.2 9.3c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12z" />
                    <path fill="#34A853" d="M3.9 7.6l3.2 2.4c.9-1.8 2.8-3 4.9-3 1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 3.6 14.5 2.7 12 2.7 8.4 2.7 5.3 4.7 3.9 7.6z" />
                    <path fill="#FBBC05" d="M12 21.3c2.5 0 4.6-.8 6.2-2.3l-2.9-2.3c-.8.5-1.8.9-3.3.9-2.4 0-4.5-1.6-5.2-3.8L3.5 16c1.4 3.1 4.6 5.3 8.5 5.3z" />
                    <path fill="#4285F4" d="M20.8 12.4c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.4-1.2 2.6-2.5 3.4l2.9 2.3c1.7-1.5 3-4 3-7z" />
                  </svg>
                  {t('auth.continueWithGoogle')}
                </button>
                {googleReferralMissing && (
                  <p className="text-center text-[11px] text-amber-400">
                    {t('auth.enterReferralFirst')}
                  </p>
                )}
              </div>
            )}
          </form>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-white/6 bg-white/3 px-2 py-2">
              <p className="text-[10px] text-slate-400">Uptime</p>
              <p className="text-sm font-semibold text-emerald-400">99.98%</p>
            </div>
            <div className="rounded-xl border border-white/6 bg-white/3 px-2 py-2">
              <p className="text-[10px] text-slate-400">Shield</p>
              <p className="text-sm font-semibold text-emerald-400">{t('common.active')}</p>
            </div>
            <div className="rounded-xl border border-white/6 bg-white/3 px-2 py-2">
              <p className="text-[10px] text-slate-400">Cloud</p>
              <p className="text-sm font-semibold text-amber-400">Realtime</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <Zap size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 text-sm font-bold">Zero commissioni sui prelievi</p>
                <p className="text-slate-400 text-[10px] mt-0.5">Prelievi sempre gratuiti, senza costi nascosti</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <UserPlus size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400 text-sm font-bold">Facciamo crescere la community</p>
                <p className="text-slate-400 text-[10px] mt-0.5">Il nostro unico obiettivo: far crescere la community insieme</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="text-blue-400 text-sm font-bold">{t('auth.withdrawalScheduleInfo')}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">{t('auth.withdrawalScheduleDetail')}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/6 text-center">
            {authStep === 'auth' ? (
              <p className="text-slate-400 text-sm">
                {isRegister ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-amber-400 font-semibold hover:text-amber-300 transition-colors"
                >
                  {isRegister ? t('auth.goToLogin') : t('auth.register')}
                </button>
              </p>
            ) : (
              <p className="text-slate-500 text-xs">
                {authStep === 'forgot'
                  ? t('auth.resetLinkSent')
                  : t('auth.afterResetLogin')}
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-slate-600 text-[10px] mt-6 leading-relaxed">
          {t('auth.protectedAccess')}<br />
          {t('auth.referralAutoValidated')}
        </p>
        <p className="text-center text-slate-500 text-[10px] mt-2 flex items-center justify-center gap-1">
          <Sparkles size={10} />
          VYRO Experience
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
