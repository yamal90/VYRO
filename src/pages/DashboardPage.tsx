import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, RefreshCw, Headphones,
  ArrowDownCircle, ArrowUpCircle, Repeat, FileText,
  Zap, TrendingUp, Users, Activity, ChevronRight, Shield, Sparkles, LogOut, Settings
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../store/AppContext';
import NicknameModal from '../components/ui/NicknameModal';
import TransferModal from '../components/ui/TransferModal';
import AvatarModal from '../components/ui/AvatarModal';

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const CYCLE_DAYS = 30;
const CYCLE_MS = CYCLE_DAYS * 24 * 60 * 60 * 1000;

const DashboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const {
    currentUser,
    balanceVisible,
    toggleBalanceVisibility,
    transactions,
    userDevices,
    teamMembers,
    refreshAppData,
    pushNotice,
    updateNickname,
    logout,
    platformSettings,
    requestDeposit,
    requestWithdrawal,
    updateAvatar,
  } = useApp();
  const navigate = useNavigate();
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [transferModal, setTransferModal] = useState<'deposit' | 'withdrawal' | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const todayIncome = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return transactions
      .filter((t) => t.amount > 0 && t.status === 'completed' && t.created_at.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const personalProd = useMemo(() => {
    return userDevices
      .filter((d) => d.status === 'active')
      .reduce((sum, d) => {
        const cycleTarget = Number(d.device?.reward_7_days ?? 0);
        const startMs = Date.parse(d.start_date);
        if (!Number.isFinite(cycleTarget) || cycleTarget <= 0 || !Number.isFinite(startMs) || startMs <= 0) {
          return sum + Number(d.total_generated ?? 0);
        }
        const elapsedMs = Math.max(0, nowMs - startMs);
        const progress = Math.min(elapsedMs / CYCLE_MS, 1);
        return sum + cycleTarget * progress;
      }, 0);
  }, [userDevices, nowMs]);

  const teamProd = useMemo(() => {
    return teamMembers.reduce((sum, m) => sum + m.production * (m.level === 1 ? 0.05 : 0.02), 0);
  }, [teamMembers]);

  const recentTx = transactions.slice(0, 4);
  const profileAvatar = currentUser?.avatar_url || (currentUser ? `https://i.pravatar.cc/160?u=${currentUser.id}` : '');
  const actionButtons = [
    {
      icon: ArrowDownCircle,
      label: t('dashboard.deposit'),
      color: 'bg-amber-500/12 text-amber-400 border border-amber-500/25',
      onClick: () => setTransferModal('deposit'),
    },
    {
      icon: ArrowUpCircle,
      label: t('dashboard.withdrawal'),
      color: 'bg-blue-500/12 text-blue-400 border border-blue-500/25',
      onClick: () => setTransferModal('withdrawal'),
    },
    {
      icon: Repeat,
      label: t('dashboard.exchange'),
      color: 'bg-emerald-500/12 text-emerald-400 border border-emerald-500/25',
      onClick: () => {
        navigate('/devices');
        pushNotice('info', t('dashboard.exchangeNotice'));
      },
    },
    {
      icon: FileText,
      label: t('dashboard.invoice'),
      color: 'bg-green-500/12 text-green-400 border border-green-500/25',
      onClick: () => {
        navigate('/transactions');
        pushNotice('info', t('dashboard.invoiceNotice'));
      },
    },
  ];

  const mask = (v: number) => balanceVisible ? v.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '••••••';

  const productionBars = useMemo(() => {
    const activeDevices = userDevices.filter((d) => d.status === 'active');
    const barsCount = 14;
    if (activeDevices.length === 0) {
      return Array.from({ length: barsCount }, (_, index) => 8 + (index % 3) * 2);
    }

    const totalCycleTarget = activeDevices.reduce(
      (sum, d) => sum + Math.max(Number(d.device?.reward_7_days ?? 0), 0),
      0,
    );
    if (totalCycleTarget <= 0) {
      return Array.from({ length: barsCount }, () => 8);
    }

    return Array.from({ length: barsCount }, (_, index) => {
      const hoursAgo = barsCount - 1 - index;
      const pointTimeMs = nowMs - hoursAgo * 60 * 60 * 1000;
      const generatedAtPoint = activeDevices.reduce((sum, device) => {
        const cycleTarget = Math.max(Number(device.device?.reward_7_days ?? 0), 0);
        const startMs = Date.parse(device.start_date);
        if (cycleTarget <= 0 || !Number.isFinite(startMs) || startMs <= 0) return sum;
        const elapsedMs = Math.max(0, pointTimeMs - startMs);
        const progress = Math.min(elapsedMs / CYCLE_MS, 1);
        return sum + cycleTarget * progress;
      }, 0);

      const percent = Math.min(100, (generatedAtPoint / totalCycleTarget) * 100);
      return Math.max(8, Number(percent.toFixed(2)));
    });
  }, [userDevices, nowMs]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#06080f] pb-32 pt-16">
      {/* Header with background */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-[#06080f]/60" />
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 hidden md:block">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.2, 0.12] }}
            transition={{ duration: 12, repeat: Infinity }}
            className="absolute top-0 right-0 w-56 h-56 bg-amber-500/12 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.08, 0.16, 0.08] }}
            transition={{ duration: 14, repeat: Infinity, delay: 1 }}
            className="absolute top-20 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"
          />
        </div>
        
        <div className="px-4 pt-6 pb-24 relative z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c101c]/85 via-[#0a0e1a]/80 to-[#06080f]/90" />
          <div className="absolute inset-0 opacity-6">
            <div className="absolute top-4 right-4 w-40 h-40 border border-amber-400/20 rounded-full" />
            <div className="absolute top-20 right-20 w-20 h-20 border border-amber-400/10 rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 border border-amber-400/10 rounded-full" />
          </div>

          <div className="relative z-10 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-lg shadow-amber-500/15 relative shrink-0">
                <img
                  src={profileAvatar}
                  alt={currentUser.username}
                  className="w-full h-full object-cover object-center bg-slate-900"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900" />
              </div>
              <button
                onClick={() => setAvatarModalOpen(true)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-white/6 text-xs font-semibold text-amber-200 border border-amber-400/25 hover:bg-white/10 transition-colors"
              >
                {t('common.photo')}
              </button>
              <div className="min-w-0">
                <p className="text-white font-bold text-base flex items-center gap-2">
                  {currentUser.username}
                  <Sparkles size={14} className="text-yellow-400" />
                </p>
                <p className="text-white/50 text-xs md:text-[13px]" title={currentUser.id}>
                  <span className="md:hidden">ID: {currentUser.id.slice(0, 8)}...{currentUser.id.slice(-6)}</span>
                  <span className="hidden md:inline break-all">ID: {currentUser.id}</span>
                </p>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:justify-end">
              <button
                onClick={() => void refreshAppData()}
                className="w-11 h-11 md:w-10 md:h-10 rounded-full glass-dark flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <RefreshCw size={16} className="text-slate-300" />
              </button>
              <button
                onClick={() => navigate('/support')}
                className="w-11 h-11 md:w-10 md:h-10 rounded-full glass-dark flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <Headphones size={16} className="text-slate-300" />
              </button>
              <button
                onClick={() => setNicknameModalOpen(true)}
                className="w-11 h-11 md:w-10 md:h-10 rounded-full glass-dark flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Modifica nickname"
              >
                <Settings size={16} className="text-slate-300" />
              </button>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-11 h-11 md:w-10 md:h-10 rounded-full glass-dark flex items-center justify-center hover:bg-white/20 transition-colors border border-yellow-500/30"
                >
                  <Shield size={16} className="text-yellow-400" />
                </button>
              )}
              <button
                onClick={() => { void logout(); }}
                className="w-11 h-11 md:w-10 md:h-10 rounded-full glass-dark flex items-center justify-center hover:bg-white/20 transition-colors border border-red-500/30"
              >
                <LogOut size={16} className="text-red-300" />
              </button>
            </div>
          </div>

          <div className="relative z-10 mb-5 rounded-2xl border border-white/6 bg-[#0c101c]/80 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <img src="/vyro-wow-logo.svg" alt="VYRO" className="h-10 w-10 rounded-xl border border-amber-400/20" />
              <div>
                <p className="text-xs text-amber-400/90 uppercase tracking-[0.22em]">Realtime Control Center</p>
                <p className="text-sm text-white/90">{t('dashboard.controlCenterDesc')}</p>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/80 text-sm font-medium">{t('dashboard.totalActivities')}</span>
              <button onClick={toggleBalanceVisibility} className="text-white/60 hover:text-white transition-colors">
                {balanceVisible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>

            <div className="flex items-end gap-6">
              <div>
                <p className="text-white/50 text-[11px] uppercase tracking-wider mb-0.5">{t('common.dollar')}</p>
                <p className="text-white font-display text-3xl font-bold tracking-wide">
                  {mask(currentUser.vx_balance)}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-[11px] uppercase tracking-wider mb-0.5">USDT Balance</p>
                <p className="text-white font-display text-xl font-semibold tracking-wide">
                  {mask(currentUser.demo_usdt_balance)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="-mt-12 px-4 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="surface-card rounded-2xl p-5 grid grid-cols-4 gap-3"
        >
          {actionButtons.map((item, i) => (
            <motion.button
              key={item.label}
              custom={i}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              whileTap={{ scale: 0.92 }}
              onClick={item.onClick}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}>
                <item.icon size={22} />
              </div>
              <span className="text-xs font-medium text-slate-300">{item.label}</span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* My Earnings */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-amber-400" />
          {t('dashboard.myEarnings')}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('dashboard.todayIncome'), value: todayIncome, icon: Zap, gradient: 'from-amber-600/80 to-amber-700/80' },
            { label: t('dashboard.production'), value: personalProd, icon: Activity, gradient: 'from-emerald-600/80 to-emerald-700/80' },
            { label: t('dashboard.teamToday'), value: teamProd, icon: Users, gradient: 'from-blue-600/80 to-blue-700/80' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              custom={i + 4}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className={`rounded-2xl p-4 text-white relative overflow-hidden border border-white/10 bg-gradient-to-br ${item.gradient} shadow-[0_10px_24px_rgba(2,6,23,0.35)]`}
            >
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
              <item.icon size={18} className="mb-2 opacity-80" />
              <p className="font-display text-xl font-bold">{mask(item.value)}</p>
              <p className="text-[10px] text-white/70 mt-1 leading-tight">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="surface-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">{t('dashboard.operationalSnapshot')}</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-center">
              <p className="text-[10px] text-emerald-200/80">{t('dashboard.node')}</p>
              <p className="text-sm font-bold text-emerald-300">{t('common.online')}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/8 p-3 text-center">
              <p className="text-[10px] text-emerald-200/80">{t('dashboard.latency')}</p>
              <p className="text-sm font-bold text-emerald-400">9 ms</p>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-500/8 p-3 text-center">
              <p className="text-[10px] text-amber-200/80">{t('dashboard.quality')}</p>
              <p className="text-sm font-bold text-amber-400">Ultra</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Earnings */}
      <div className="px-4 mt-6">
        <div className="surface-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">{t('dashboard.personalEarnings')}</h3>
            <span className="px-3 py-1.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full flex items-center gap-1.5 border border-green-500/30">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {t('dashboard.inProgress')}
            </span>
          </div>

          {/* Mini Chart */}
          <div className="flex items-end gap-1 h-24 mb-4">
            {productionBars.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.3 + i * 0.03, duration: 0.3 }}
                className={`flex-1 rounded-sm ${i >= productionBars.length - 2 ? 'bg-gradient-to-t from-amber-500 to-emerald-500' : 'bg-amber-900/30'}`}
              />
            ))}
          </div>

          {/* Compute Power */}
          <div className="soft-divider mb-3" />
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-slate-400">{t('dashboard.computePower')}</span>
            <span className="text-sm font-bold text-amber-400 font-display">{currentUser.compute_power} TFLOPS</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 mt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">{t('dashboard.recentActivity')}</h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-amber-400 text-xs font-semibold flex items-center gap-0.5 hover:text-amber-300 transition-colors"
          >
            {t('common.seeAll')} <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-2">
          {recentTx.map((tx, i) => (
            <motion.div
              key={tx.id}
              custom={i + 7}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="surface-card-soft rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                tx.amount > 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {tx.amount > 0 ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{tx.description}</p>
                <p className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'it-IT')}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold font-display ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                </p>
                <p className="text-[10px] text-slate-400">{tx.currency}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 mb-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-[10px] text-amber-300 leading-relaxed text-center">
            {t('dashboard.disclaimer')}
          </p>
        </div>
      </div>

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

      <TransferModal
        isOpen={transferModal === 'deposit'}
        mode="deposit"
        onClose={() => setTransferModal(null)}
        depositAddress={platformSettings?.deposit_address || '0xbfEABE2e143722cbf74706DB38722AF641033D7f'}
        depositAsset={platformSettings?.deposit_asset ?? 'USDT'}
        depositNetwork={platformSettings?.deposit_network ?? 'BEP20'}
        minDeposit={Number(platformSettings?.min_deposit ?? 0)}
        onSubmit={async ({ amount, txHash, proofImageUrl }) => {
          const result = await requestDeposit(amount, txHash, proofImageUrl);
          pushNotice(result.success ? 'success' : 'error', result.message);
          return result;
        }}
      />

      <TransferModal
        isOpen={transferModal === 'withdrawal'}
        mode="withdrawal"
        onClose={() => setTransferModal(null)}
        availableBalance={currentUser.demo_usdt_balance}
        minWithdraw={Number(platformSettings?.min_withdraw ?? 0)}
        onSubmit={async ({ amount, walletAddress }) => {
          const result = await requestWithdrawal(amount, walletAddress ?? '');
          pushNotice(result.success ? 'success' : 'error', result.message);
          return result;
        }}
      />
    </div>
  );
};

export default DashboardPage;
