import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  Ban,
  BarChart3,
  Check,
  CircleAlert,
  Cog,
  Copy,
  Cpu,
  DollarSign,
  Download,
  Edit3,
  Eye,
  ExternalLink,
  Globe,
  Lock,
  LockOpen,
  MailX,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../store/AppContext';
import { normalizeTierName } from '../store/mappers';

type AdminTab = 'overview' | 'users' | 'devices' | 'transactions' | 'logs' | 'analytics' | 'settings';

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
      checked ? 'bg-emerald-500' : 'bg-white/20'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const SectionHeader: React.FC<{ icon: React.ElementType; title: string; subtitle?: string }> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
      <Icon size={16} className="text-amber-400" />
    </div>
    <div>
      <h3 className="text-white text-sm font-bold">{title}</h3>
      {subtitle && <p className="text-white/40 text-[10px]">{subtitle}</p>}
    </div>
  </div>
);

const AdminPage: React.FC = () => {
  const {
    currentUser,
    allUsers,
    gpuDevices,
    adminUserDevices,
    adminTransactions,
    adminLogs,
    adminDepositRequests,
    adminWithdrawalRequests,
    platformSettings,
    refreshAppData,
    updateDepositRequestStatus,
    updateWithdrawalRequestStatus,
    updateUserBalance,
    assignDeviceToUser,
    removeDeviceFromUser,
    blockUser,
    unblockUser,
    setUserClaimEligibility,
    updatePlatformSettings,
    pushNotice,
  } = useApp();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'activity'>('all');
  const [depositTxDraft, setDepositTxDraft] = useState<Record<string, string>>({});
  const [withdrawTxDraft, setWithdrawTxDraft] = useState<Record<string, string>>({});
  const [depositStatusDraft, setDepositStatusDraft] = useState<
    Record<string, 'pending' | 'approved' | 'completed' | 'rejected'>
  >({});
  const [withdrawStatusDraft, setWithdrawStatusDraft] = useState<
    Record<string, 'pending' | 'approved' | 'completed' | 'rejected'>
  >({});
  const [txFilter, setTxFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all');
  const [txSearch, setTxSearch] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignDeviceId, setAssignDeviceId] = useState('');
  const [assignChargeBalance, setAssignChargeBalance] = useState(false);
  const [removeWithRefund, setRemoveWithRefund] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<string | null>(null);
  const adminBootstrappedForUserRef = useRef<string | null>(null);
  const [settingsDraft, setSettingsDraft] = useState({
    maintenance_mode: false,
    deposits_enabled: true,
    withdrawals_enabled: true,
    daily_claim_enabled: true,
    min_deposit: 0,
    min_withdraw: 0,
    deposit_asset: 'USDT',
    deposit_network: 'BEP20',
    deposit_address: '0xbfEABE2e143722cbf74706DB38722AF641033D7f',
  });
  React.useEffect(() => {
    if (!platformSettings) return;
    setSettingsDraft({ // eslint-disable-line react-hooks/set-state-in-effect -- syncing API data to local draft
      maintenance_mode: Boolean(platformSettings.maintenance_mode),
      deposits_enabled: Boolean(platformSettings.deposits_enabled),
      withdrawals_enabled: Boolean(platformSettings.withdrawals_enabled),
      daily_claim_enabled: Boolean(platformSettings.daily_claim_enabled),
      min_deposit: Number(platformSettings.min_deposit ?? 0),
      min_withdraw: Number(platformSettings.min_withdraw ?? 0),
      deposit_asset: platformSettings.deposit_asset ?? 'USDT',
      deposit_network: platformSettings.deposit_network ?? 'TRC20',
      deposit_address: platformSettings.deposit_address ?? '',
    });
  }, [platformSettings]);

  const errorLogsCount = useMemo(
    () => adminLogs.filter((log) => log.action.toLowerCase().includes('error_')).length,
    [adminLogs],
  );

  const filteredLogs = useMemo(() => {
    if (logFilter === 'all') return adminLogs;
    if (logFilter === 'error') return adminLogs.filter((log) => log.action.toLowerCase().includes('error_'));
    return adminLogs.filter((log) => !log.action.toLowerCase().includes('error_'));
  }, [adminLogs, logFilter]);

  const pendingDeposits = useMemo(
    () => adminDepositRequests.filter((item) => item.status === 'pending'),
    [adminDepositRequests],
  );

  const pendingWithdrawals = useMemo(
    () => adminWithdrawalRequests.filter((item) => item.status === 'pending'),
    [adminWithdrawalRequests],
  );
  const sortedDepositRequests = useMemo(
    () => [...adminDepositRequests].filter((d) => d.status !== 'rejected').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [adminDepositRequests],
  );
  const sortedWithdrawalRequests = useMemo(
    () => [...adminWithdrawalRequests].filter((w) => w.status !== 'rejected').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [adminWithdrawalRequests],
  );
  const txSearchNormalized = txSearch.trim().toLowerCase();
  const txMatchesFilter = React.useCallback(
    (status: string, ...chunks: Array<string | null | undefined>) => {
      if (txFilter !== 'all' && status !== txFilter) return false;
      if (!txSearchNormalized) return true;
      return chunks.some((chunk) => String(chunk ?? '').toLowerCase().includes(txSearchNormalized));
    },
    [txFilter, txSearchNormalized],
  );
  const filteredDepositRequests = useMemo(
    () =>
      sortedDepositRequests.filter(
        (item) => txMatchesFilter(item.status, item.username, item.email, item.asset, item.network, item.tx_hash, item.id),
      ),
    [sortedDepositRequests, txMatchesFilter],
  );
  const filteredWithdrawalRequests = useMemo(
    () =>
      sortedWithdrawalRequests.filter(
        (item) => txMatchesFilter(item.status, item.username, item.email, item.wallet_address, item.tx_hash, item.id),
      ),
    [sortedWithdrawalRequests, txMatchesFilter],
  );
  const userMap = useMemo(() => new Map(allUsers.map((u) => [u.id, u])), [allUsers]);
  const effectiveAssignUserId = assignUserId || allUsers[0]?.id || '';
  const effectiveAssignDeviceId = assignDeviceId || gpuDevices[0]?.id || '';

  const formatTierLabel = React.useCallback((tier?: string | null) => normalizeTierName(tier), []);
  const formatAdminActor = React.useCallback((userId?: string | null) => {
    if (!userId) return 'Sistema';
    const user = userMap.get(userId);
    if (!user) return 'Sistema';
    return user.email || user.username || 'Sistema';
  }, [userMap]);
  const formatAdminCurrency = React.useCallback((currency?: string) => (currency === 'VX' ? '$' : currency || ''), []);
  const simplifyAdminText = React.useCallback((value?: string | null) => {
    if (!value) return 'Operazione admin';
    return value
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '')
      .replace(/\s+→\s+rejected/gi, ' rifiutato')
      .replace(/\s+→\s+approved/gi, ' approvato')
      .replace(/\s+→\s+completed/gi, ' completato')
      .replace(/\s+→\s+pending/gi, ' in attesa')
      .replace(/admin\s+/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || 'Operazione admin';
  }, []);
  const formatLogAction = React.useCallback((action?: string) => {
    const normalized = (action || '').toLowerCase();
    if (normalized.includes('admin_manage_deposit')) return 'Depositi';
    if (normalized.includes('admin_manage_withdraw')) return 'Prelievi';
    if (normalized.includes('admin_device_assign')) return 'Assegnazione GPU';
    if (normalized.includes('device_purchase')) return 'Acquisto GPU';
    if (normalized.includes('daily_claim')) return 'Daily claim';
    return action || 'Attività';
  }, []);

  const totalBalance = useMemo(() => allUsers.reduce((sum, u) => sum + (u.vx_balance ?? 0), 0), [allUsers]);
  const totalUSDTBalance = useMemo(() => allUsers.reduce((sum, u) => sum + (u.demo_usdt_balance ?? 0), 0), [allUsers]);
  const activeUsers = useMemo(() => allUsers.filter((u) => u.status !== 'blocked'), [allUsers]);

  const registrationsByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    for (const u of allUsers) {
      const month = u.created_at?.slice(0, 7) ?? 'unknown';
      months[month] = (months[month] ?? 0) + 1;
    }
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [allUsers]);

  const tierDistribution = useMemo(() => {
    const tiers: Record<string, number> = {};
    for (const u of allUsers) {
      const tier = formatTierLabel(u.tier);
      tiers[tier] = (tiers[tier] ?? 0) + 1;
    }
    return Object.entries(tiers).sort(([, a], [, b]) => b - a);
  }, [allUsers, formatTierLabel]);

  const totalDepositsVolume = useMemo(
    () => adminDepositRequests
      .filter((d) => d.status === 'approved' || d.status === 'completed')
      .reduce((sum, d) => sum + d.amount, 0),
    [adminDepositRequests],
  );
  const totalWithdrawalsVolume = useMemo(
    () => adminWithdrawalRequests
      .filter((w) => w.status === 'approved' || w.status === 'completed')
      .reduce((sum, w) => sum + w.amount, 0),
    [adminWithdrawalRequests],
  );

  const handleExportUsers = () => {
    const csv = [
      'Username,Email,Ruolo,Stato,Saldo account,Saldo USDT,Claim,Tier,Streak,Data Registrazione',
      ...allUsers.map((u) =>
        `"${u.username}","${u.email}","${u.role}","${u.status}",${u.vx_balance},${u.demo_usdt_balance},${u.claim_eligible ? 'SI' : 'NO'},"${formatTierLabel(u.tier)}",${u.streak},"${u.created_at}"`,
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vyro_utenti_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    pushNotice('success', 'Export CSV completato');
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      pushNotice('error', 'Inserisci un messaggio');
      return;
    }
    setBroadcastSending(true);
    try {
      for (const user of allUsers) {
        if (user.status === 'blocked') continue;
        await updateUserBalance(user.id, 'vx_balance', user.vx_balance);
      }
      pushNotice('success', `Notifica inviata a ${activeUsers.length} utenti attivi`);
      setBroadcastMessage('');
    } catch {
      pushNotice('error', 'Errore invio notifica');
    } finally {
      setBroadcastSending(false);
    }
  };
  const userSearchNormalized = userSearch.trim().toLowerCase();
  const filteredUsers = useMemo(
    () =>
      userSearchNormalized
        ? allUsers.filter(
            (u) =>
              u.username.toLowerCase().includes(userSearchNormalized) ||
              u.email.toLowerCase().includes(userSearchNormalized),
          )
        : allUsers,
    [allUsers, userSearchNormalized],
  );

  React.useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      adminBootstrappedForUserRef.current = null;
      return;
    }
    if (adminBootstrappedForUserRef.current === currentUser.id) return;
    adminBootstrappedForUserRef.current = currentUser.id;
    void refreshAppData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role, refreshAppData]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-dark">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg font-bold">Accesso negato</p>
          <button onClick={() => navigate('/')} className="mt-4 text-amber-400 text-sm">
            Torna alla home
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: 'overview', label: 'Dashboard', icon: TrendingUp },
    { key: 'users', label: 'Utenti', icon: Users, badge: allUsers.length },
    { key: 'devices', label: 'GPU', icon: Cpu },
    { key: 'transactions', label: 'TX', icon: Activity, badge: pendingDeposits.length + pendingWithdrawals.length || undefined },
    { key: 'logs', label: 'Log', icon: Eye, badge: errorLogsCount || undefined },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'settings', label: 'Config', icon: Cog },
  ];

  const handleSaveBalance = async (userId: string) => {
    const amount = Number.parseFloat(editBalance);
    if (Number.isNaN(amount)) {
      pushNotice('error', 'Importo non valido.');
      return;
    }
    const result = await updateUserBalance(userId, 'vx_balance', amount);
    pushNotice(result.success ? 'success' : 'error', result.message);
    setEditingUser(null);
    setEditBalance('');
  };

  const handleSaveSettings = async () => {
    const minDeposit = Number(settingsDraft.min_deposit);
    const minWithdraw = Number(settingsDraft.min_withdraw);
    if (!Number.isFinite(minDeposit) || minDeposit < 0) {
      pushNotice('error', 'Min deposito non valido.');
      return;
    }
    if (!Number.isFinite(minWithdraw) || minWithdraw < 0) {
      pushNotice('error', 'Min prelievo non valido.');
      return;
    }
    const depositAsset = settingsDraft.deposit_asset.trim().toUpperCase() || 'USDT';
    const depositNetwork = settingsDraft.deposit_network.trim().toUpperCase() || 'BEP20';
    const depositAddress = settingsDraft.deposit_address.trim();
    const result = await updatePlatformSettings({
      maintenance_mode: settingsDraft.maintenance_mode,
      deposits_enabled: settingsDraft.deposits_enabled,
      withdrawals_enabled: settingsDraft.withdrawals_enabled,
      daily_claim_enabled: settingsDraft.daily_claim_enabled,
      min_deposit: minDeposit,
      min_withdraw: minWithdraw,
      deposit_asset: depositAsset,
      deposit_network: depositNetwork,
      deposit_address: depositAddress,
    });
    pushNotice(result.success ? 'success' : 'error', result.message);
  };

  const getStatusBadgeClass = (status: string) =>
    status === 'approved' || status === 'completed'
      ? 'bg-emerald-500/20 text-emerald-300'
      : status === 'rejected'
        ? 'bg-red-500/20 text-red-300'
        : 'bg-yellow-500/20 text-yellow-300';

  const applyDepositStatus = async (
    itemId: string,
    currentStatus: 'pending' | 'approved' | 'completed' | 'rejected',
  ) => {
    const nextStatus = depositStatusDraft[itemId] ?? currentStatus;
    if (nextStatus === 'rejected') {
      await deleteDeposit(itemId);
      return;
    }
    const result = await updateDepositRequestStatus(itemId, nextStatus, depositTxDraft[itemId]);
    pushNotice(result.success ? 'success' : 'error', result.message);
    if (result.success) {
      setDepositStatusDraft((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  };

  const deleteDeposit = async (depositId: string) => {
    const result = await updateDepositRequestStatus(depositId, 'rejected');
    if (result.success) {
      pushNotice('success', 'Deposito rifiutato e rimosso.');
      await refreshAppData();
    } else {
      pushNotice('error', result.message);
    }
  };

  const applyWithdrawalStatus = async (
    itemId: string,
    currentStatus: 'pending' | 'approved' | 'completed' | 'rejected',
  ) => {
    const nextStatus = withdrawStatusDraft[itemId] ?? currentStatus;
    if (nextStatus === 'rejected') {
      await deleteWithdrawal(itemId);
      return;
    }
    const result = await updateWithdrawalRequestStatus(itemId, nextStatus, withdrawTxDraft[itemId]);
    pushNotice(result.success ? 'success' : 'error', result.message);
    if (result.success) {
      setWithdrawStatusDraft((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  };

  const deleteWithdrawal = async (withdrawalId: string) => {
    const result = await updateWithdrawalRequestStatus(withdrawalId, 'rejected');
    if (result.success) {
      pushNotice('success', 'Prelievo rifiutato e rimosso.');
      await refreshAppData();
    } else {
      pushNotice('error', result.message);
    }
  };

  return (
    <div className="min-h-screen gradient-dark pb-24">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-white tracking-wider flex items-center gap-2">
                <Shield size={20} className="text-yellow-400" />
                Admin Panel
              </h1>
              <p className="text-white/40 text-xs">Gestione completa piattaforma</p>
            </div>
          </div>
          <button
            onClick={() => void refreshAppData()}
            className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>



        <div className="flex gap-1 bg-white/5 rounded-xl p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-0 py-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 transition-all relative ${
                  activeTab === tab.key ? 'bg-amber-600 text-white' : 'text-white/50 hover:text-white/70'
                }`}
              >
                <TabIcon size={12} />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[8px] text-white flex items-center justify-center font-bold">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4">
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Utenti totali', value: allUsers.length, icon: Users, color: 'from-blue-500 to-blue-600' },
                { label: 'Utenti attivi', value: activeUsers.length, icon: UserCheck, color: 'from-emerald-500 to-emerald-600' },
                { label: 'Bloccati', value: allUsers.filter((u) => u.status === 'blocked').length, icon: Ban, color: 'from-red-500 to-rose-600' },
                { label: 'Dispositivi', value: adminUserDevices.length, icon: Cpu, color: 'from-purple-500 to-purple-600' },
                { label: 'Depositi pending', value: pendingDeposits.length, icon: DollarSign, color: 'from-amber-500 to-orange-600' },
                { label: 'Prelievi pending', value: pendingWithdrawals.length, icon: Wallet, color: 'from-cyan-500 to-cyan-600' },
              ].map((stat) => {
                const StatIcon = stat.icon;
                return (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-xl p-3`}>
                    <div className="flex items-center gap-2 mb-1">
                      <StatIcon size={14} className="text-white/80" />
                      <p className="text-[10px] text-white/80 font-medium">{stat.label}</p>
                    </div>
                    <p className="font-display text-xl font-bold text-white">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <SectionHeader icon={DollarSign} title="Bilancio piattaforma" subtitle="Totale saldi utenti" />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-white/50 mb-1">Saldo account totale</p>
                  <p className="text-lg font-bold text-amber-400">{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-white/50 mb-1">Deposito corrente</p>
                  <p className="text-lg font-bold text-green-400">{platformSettings?.deposit_asset ?? 'USDT'}</p>
                  <p className="text-[9px] text-white/40 mt-0.5">{platformSettings?.deposit_network ?? 'BEP20'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <SectionHeader icon={ShieldCheck} title="Stato sicurezza" subtitle="Controllo rapido" />
              <div className="space-y-2">
                {[
                  { label: 'RLS attivo su tutte le tabelle', ok: true },
                  { label: 'Accesso anon revocato (solo GPU catalog)', ok: true },
                  { label: 'Funzioni admin protette', ok: true },
                  { label: 'Email temporanee bloccate', ok: true },
                  { label: 'Maintenance mode', ok: !platformSettings?.maintenance_mode, warn: platformSettings?.maintenance_mode },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-xs text-white/70">{item.label}</span>
                    {item.ok ? (
                      <ShieldCheck size={14} className="text-emerald-400" />
                    ) : (
                      <ShieldAlert size={14} className="text-amber-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <SectionHeader icon={Zap} title="Azioni rapide" />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="py-2.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20 text-xs font-semibold hover:bg-amber-500/25 flex items-center justify-center gap-1.5"
                >
                  <Activity size={13} />
                  Gestisci transazioni
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="py-2.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/20 text-xs font-semibold hover:bg-blue-500/25 flex items-center justify-center gap-1.5"
                >
                  <Cog size={13} />
                  Impostazioni
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className="py-2.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/25 flex items-center justify-center gap-1.5"
                >
                  <Users size={13} />
                  Gestisci utenti
                </button>
                <button
                  onClick={() => void refreshAppData()}
                  className="py-2.5 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/20 text-xs font-semibold hover:bg-purple-500/25 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  Aggiorna dati
                </button>
                <button
                  onClick={handleExportUsers}
                  className="py-2.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 text-xs font-semibold hover:bg-cyan-500/25 flex items-center justify-center gap-1.5"
                >
                  <Download size={13} />
                  Export utenti CSV
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="py-2.5 rounded-lg bg-pink-500/15 text-pink-300 border border-pink-500/20 text-xs font-semibold hover:bg-pink-500/25 flex items-center justify-center gap-1.5"
                >
                  <BarChart3 size={13} />
                  Analytics
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <SectionHeader icon={MessageSquare} title="Notifica broadcast" subtitle="Invia un messaggio a tutti gli utenti" />
              <div className="space-y-2">
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Scrivi il messaggio da inviare a tutti gli utenti attivi..."
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder:text-white/30 resize-none h-20"
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/30">{broadcastMessage.length}/500</span>
                  <button
                    onClick={() => void handleBroadcast()}
                    disabled={broadcastSending || !broadcastMessage.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send size={12} />
                    {broadcastSending ? 'Invio...' : 'Invia a tutti'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cerca utente per nome o email..."
                  className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs placeholder:text-white/30"
                />
              </div>
              <button
                onClick={handleExportUsers}
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0"
                title="Export CSV"
              >
                <Download size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] text-white/40">
                {filteredUsers.length} utent{filteredUsers.length === 1 ? 'e' : 'i'} trovati
              </p>
              <p className="text-[10px] text-white/40">
                {activeUsers.length} attivi &bull; {allUsers.length - activeUsers.length} bloccati
              </p>
            </div>
            {filteredUsers.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center text-white text-xs font-bold">
                      {user.username[0]}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {user.username}
                        {user.role === 'admin' ? <span className="ml-2 text-[10px] text-yellow-400">ADMIN</span> : null}
                      </p>
                      <p className="text-white/40 text-[10px]">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingUser(user.id);
                        setEditBalance(user.vx_balance.toString());
                      }}
                      className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/30"
                      title="Modifica saldo account"
                    >
                      <Edit3 size={12} />
                    </button>
                    <button
                      onClick={async () => {
                        const result = user.status === 'blocked' ? await unblockUser(user.id) : await blockUser(user.id);
                        pushNotice(result.success ? 'success' : 'error', result.message);
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        user.status === 'blocked'
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                      title={user.status === 'blocked' ? 'Sblocca utente' : 'Blocca utente'}
                    >
                      {user.status === 'blocked' ? <LockOpen size={12} /> : <Lock size={12} />}
                    </button>
                    <button
                      onClick={async () => {
                        const result = await setUserClaimEligibility(user.id, !user.claim_eligible);
                        pushNotice(result.success ? 'success' : 'error', result.message);
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        user.claim_eligible
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30'
                      }`}
                      title={user.claim_eligible ? 'Disabilita claim' : 'Abilita claim'}
                    >
                      <Check size={12} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-[9px] text-white/40">Saldo</p>
                    <p className="text-xs font-bold text-amber-400">{user.vx_balance.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-[9px] text-white/40">USDT</p>
                    <p className="text-xs font-bold text-green-400">{user.demo_usdt_balance.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-[9px] text-white/40">Claim</p>
                    <p className={`text-xs font-bold ${user.claim_eligible ? 'text-emerald-400' : 'text-red-400'}`}>
                      {user.claim_eligible ? 'ON' : 'OFF'}
                    </p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-[9px] text-white/40">Tier</p>
                    <p className="text-xs font-bold text-purple-400">{formatTierLabel(user.tier)}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUserDetail(selectedUserDetail === user.id ? null : user.id)}
                  className="w-full mt-2 py-1.5 text-[10px] text-white/50 hover:text-white/80 transition-colors text-center"
                >
                  {selectedUserDetail === user.id ? 'Nascondi dettagli' : 'Mostra dettagli'}
                </button>

                {selectedUserDetail === user.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-white/3 rounded-lg p-2">
                        <p className="text-white/40">Email</p>
                        <p className="text-white/80 truncate">{user.email}</p>
                      </div>
                      <div className="bg-white/3 rounded-lg p-2">
                        <p className="text-white/40">Ruolo</p>
                        <p className="text-white/80">{user.role}</p>
                      </div>
                      <div className="bg-white/3 rounded-lg p-2">
                        <p className="text-white/40">Invitato da</p>
                        <p className="text-white/80 truncate">{user.invited_by || 'Nessuno'}</p>
                      </div>
                      <div className="bg-white/3 rounded-lg p-2">
                        <p className="text-white/40">Streak</p>
                        <p className="text-white/80">{user.streak} giorni</p>
                      </div>
                      <div className="bg-white/3 rounded-lg p-2">
                        <p className="text-white/40">Potenza</p>
                        <p className="text-white/80">{user.compute_power} TFLOPS</p>
                      </div>
                      <div className="bg-white/3 rounded-lg p-2">
                        <p className="text-white/40">Registrato</p>
                        <p className="text-white/80">{new Date(user.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'it-IT')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-white/30">
                      <span className={`w-2 h-2 rounded-full ${user.status === 'blocked' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      Stato: {user.status === 'blocked' ? 'Bloccato' : 'Attivo'} &bull; Ruolo: {user.role}
                    </div>
                  </motion.div>
                )}

                {editingUser === user.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 flex items-center gap-2"
                  >
                    <input
                      type="number"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                      placeholder="Nuovo saldo account"
                    />
                    <button
                      onClick={() => void handleSaveBalance(user.id)}
                      className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="space-y-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <p className="text-white text-sm font-semibold">Aggiungi dispositivo a utente</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="text-[11px] text-white/65">
                  Utente
                  <select
                    value={effectiveAssignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs"
                  >
                    {allUsers.map((user) => (
                      <option key={user.id} value={user.id} className="bg-[#0c101c] text-white">
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] text-white/65">
                  Dispositivo
                  <select
                    value={effectiveAssignDeviceId}
                    onChange={(e) => setAssignDeviceId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs"
                  >
                    {gpuDevices.map((device) => (
                      <option key={device.id} value={device.id} className="bg-[#0c101c] text-white">
                        {device.name} • {device.price.toLocaleString()} $
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={assignChargeBalance}
                  onChange={(e) => setAssignChargeBalance(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                Scala il costo dal saldo utente durante l’assegnazione
              </label>
              <button
                onClick={async () => {
                  const result = await assignDeviceToUser(
                    effectiveAssignUserId,
                    effectiveAssignDeviceId,
                    assignChargeBalance,
                  );
                  pushNotice(result.success ? 'success' : 'error', result.message);
                }}
                className="w-full py-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-semibold hover:bg-emerald-500/30 flex items-center justify-center gap-2"
              >
                <Plus size={15} />
                Assegna dispositivo
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={removeWithRefund}
                  onChange={(e) => setRemoveWithRefund(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                Rimborso automatico al saldo utente quando rimuovo dispositivo
              </label>
            </div>

            {adminUserDevices.map((ud) => (
              <div key={ud.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white text-sm font-semibold">{ud.device?.name}</p>
                    <p className="text-white/40 text-[10px] truncate">
                      {userMap.get(ud.user_id ?? '')?.email ?? userMap.get(ud.user_id ?? '')?.username ?? 'Utente non trovato'}
                    </p>
                    <p className="text-white/30 text-[10px]">{userMap.get(ud.user_id ?? '')?.username ?? 'Utente'} • dispositivo attivo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400">
                      {ud.status}
                    </span>
                    <button
                      onClick={async () => {
                        const result = await removeDeviceFromUser(ud.id, removeWithRefund);
                        pushNotice(result.success ? 'success' : 'error', result.message);
                      }}
                      className="w-8 h-8 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center"
                      title="Rimuovi dispositivo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-[10px] text-white/35 leading-relaxed">
                    Gestione admin attiva: puoi assegnare o rimuovere dispositivi da questa sezione.
                  </p>
                </div>
              </div>
            ))}
            {adminUserDevices.length === 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-white/55 text-center">
                Nessun dispositivo assegnato agli utenti.
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-white text-xs font-semibold mb-1">Gestione richieste</p>
              <p className="text-[10px] text-white/55">
                Pending depositi: {pendingDeposits.length} • Pending prelievi: {pendingWithdrawals.length}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                {(['all', 'pending', 'approved', 'completed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setTxFilter(status)}
                    className={`px-3 py-1 rounded-lg text-xs ${
                      txFilter === status ? 'bg-amber-600 text-white' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {status === 'all' ? 'Tutti' : status}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Cerca per utente, email, tx hash, wallet..."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs"
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
              <p className="text-white text-xs font-semibold">
                Depositi ({filteredDepositRequests.length})
              </p>
              {filteredDepositRequests.slice(0, 60).map((item) => (
                <div key={`dep-manage-${item.id}`} className="bg-[#0c101c]/45 border border-white/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">
                        {item.username} • {item.amount.toFixed(2)} {item.asset}
                      </p>
                      <p className="text-[10px] text-white/45 truncate">{item.email}</p>
                      <p className="text-[10px] text-white/35">{new Date(item.created_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'it-IT')}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-2">
                    <select
                      value={depositStatusDraft[item.id] ?? item.status}
                      onChange={(e) =>
                        setDepositStatusDraft((prev) => ({
                          ...prev,
                          [item.id]: e.target.value as 'pending' | 'approved' | 'completed' | 'rejected',
                        }))
                      }
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs"
                    >
                      <option value="pending" className="bg-[#0c101c] text-white">pending</option>
                      <option value="approved" className="bg-[#0c101c] text-white">approved</option>
                      <option value="completed" className="bg-[#0c101c] text-white">completed</option>
                    </select>
                    <input
                      type="text"
                      value={depositTxDraft[item.id] ?? item.tx_hash ?? ''}
                      onChange={(e) => setDepositTxDraft((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="TX hash (opzionale)"
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => void applyDepositStatus(item.id, item.status)}
                        className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30"
                      >
                        Applica
                      </button>
                      <button
                        onClick={() => void deleteDeposit(item.id)}
                        className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold hover:bg-red-500/30"
                      >
                        Elimina
                      </button>
                      {(depositTxDraft[item.id] ?? item.tx_hash) ? (
                        <a
                          href={`https://bscscan.com/tx/${depositTxDraft[item.id] ?? item.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-lg bg-emerald-500/12 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 inline-flex items-center gap-1"
                        >
                          BscScan <ExternalLink size={12} />
                        </a>
                      ) : null}
                      {item.proof_image_url ? (
                        <a
                          href={item.proof_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-lg bg-blue-500/12 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 inline-flex items-center gap-1"
                        >
                          Screenshot <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-red-400 text-[10px]">No screenshot</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredDepositRequests.length === 0 && (
                <p className="text-[11px] text-white/45">Nessun deposito per questo filtro.</p>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
              <p className="text-white text-xs font-semibold">
                Prelievi ({filteredWithdrawalRequests.length})
              </p>
              {filteredWithdrawalRequests.slice(0, 60).map((item) => (
                <div key={`wd-manage-${item.id}`} className="bg-[#0c101c]/45 border border-white/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">
                        {item.username} • {item.amount.toFixed(2)} USDT
                      </p>
                      <p className="text-[10px] text-white/45 truncate">{item.email}</p>
                      <p className="text-[10px] text-blue-200/70 truncate inline-flex items-center gap-1">
                        <Wallet size={11} />
                        {item.wallet_address ?? 'Wallet non impostato'}
                      </p>
                      <p className="text-[10px] text-white/35">{new Date(item.created_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'it-IT')}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-2">
                    <select
                      value={withdrawStatusDraft[item.id] ?? item.status}
                      onChange={(e) =>
                        setWithdrawStatusDraft((prev) => ({
                          ...prev,
                          [item.id]: e.target.value as 'pending' | 'approved' | 'completed' | 'rejected',
                        }))
                      }
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs"
                    >
                      <option value="pending" className="bg-[#0c101c] text-white">pending</option>
                      <option value="approved" className="bg-[#0c101c] text-white">approved</option>
                      <option value="completed" className="bg-[#0c101c] text-white">completed</option>
                    </select>
                    <input
                      type="text"
                      value={withdrawTxDraft[item.id] ?? item.tx_hash ?? ''}
                      onChange={(e) => setWithdrawTxDraft((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="TX hash payout (opzionale)"
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => void applyWithdrawalStatus(item.id, item.status)}
                        className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30"
                      >
                        Applica
                      </button>
                      <button
                        onClick={() => void deleteWithdrawal(item.id)}
                        className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold hover:bg-red-500/30"
                      >
                        Elimina
                      </button>
                      {(withdrawTxDraft[item.id] ?? item.tx_hash) ? (
                        <a
                          href={`https://bscscan.com/tx/${withdrawTxDraft[item.id] ?? item.tx_hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-lg bg-emerald-500/12 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 inline-flex items-center gap-1"
                        >
                          BscScan <ExternalLink size={12} />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {filteredWithdrawalRequests.length === 0 && (
                <p className="text-[11px] text-white/45">Nessun prelievo per questo filtro.</p>
              )}
            </div>

            {adminTransactions.slice(0, 30).map((tx) => (
              <div key={tx.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  tx.status === 'completed' ? 'bg-green-500' : tx.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{simplifyAdminText(tx.description)}</p>
                  <p className="text-white/30 text-[9px]">{formatAdminActor(tx.user_id)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount.toFixed(2)} {formatAdminCurrency(tx.currency)}
                  </p>
                  <p className="text-white/30 text-[9px]">
                    {new Date(tx.created_at).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'it-IT')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-white text-xs font-semibold">Errori tracciati: {errorLogsCount}</p>
            </div>
            <div className="flex items-center gap-2 mb-2">
              {[
                { key: 'all' as const, label: 'Tutti' },
                { key: 'error' as const, label: 'Errori' },
                { key: 'activity' as const, label: 'Attività' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setLogFilter(item.key)}
                  className={`px-3 py-1 rounded-lg text-xs ${
                    logFilter === item.key ? 'bg-amber-600 text-white' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {filteredLogs.map((log) => {
              const isError = log.action.toLowerCase().includes('error_');
              return (
                <div key={log.id} className={`border rounded-xl p-3 ${isError ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {isError ? <CircleAlert size={12} className="text-red-400" /> : <Shield size={12} className="text-yellow-400" />}
                    <p className="text-white/60 text-[10px]">{new Date(log.created_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'it-IT')}</p>
                    <span className={`text-[10px] font-bold ml-auto ${isError ? 'text-red-300' : 'text-amber-400'}`}>
                      {formatLogAction(log.action)}
                    </span>
                  </div>
                  <p className="text-white text-sm leading-relaxed">
                    {simplifyAdminText(String(log.metadata?.description ?? log.action))}
                  </p>
                  <p className="text-white/35 text-[10px] mt-1">{formatAdminActor(log.admin_id)}</p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <SectionHeader icon={BarChart3} title="Panoramica finanziaria" subtitle="Volumi e bilanci piattaforma" />
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-emerald-300/70 mb-1">Depositi approvati</p>
                  <p className="text-lg font-bold text-emerald-400">${totalDepositsVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-red-300/70 mb-1">Prelievi approvati</p>
                  <p className="text-lg font-bold text-red-400">${totalWithdrawalsVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-amber-300/70 mb-1">Saldo account totale</p>
                  <p className="text-lg font-bold text-amber-400">{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-blue-300/70 mb-1">Totale USDT saldi</p>
                  <p className="text-lg font-bold text-blue-400">${totalUSDTBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <SectionHeader icon={UserPlus} title="Registrazioni per mese" subtitle="Ultimi 6 mesi" />
              <div className="space-y-2">
                {registrationsByMonth.map(([month, count]) => {
                  const maxCount = Math.max(...registrationsByMonth.map(([, c]) => c), 1);
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={month} className="flex items-center gap-3">
                      <span className="text-[10px] text-white/50 w-16 shrink-0 font-mono">{month}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-white font-bold w-8 text-right">{count}</span>
                    </div>
                  );
                })}
                {registrationsByMonth.length === 0 && (
                  <p className="text-[11px] text-white/40 text-center">Nessun dato disponibile</p>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <SectionHeader icon={Shield} title="Distribuzione Tier" subtitle="Livelli utenti" />
              <div className="space-y-2">
                {tierDistribution.map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        tier === 'RTX 4090' ? 'bg-amber-400' :
                        tier === 'RTX 4080 Super' ? 'bg-emerald-400' :
                        tier === 'RTX 4060 Ti' ? 'bg-amber-500' :
                        tier === 'RTX 3060' ? 'bg-blue-400' :
                        'bg-slate-400'
                      }`} />
                      <span className="text-sm text-white font-medium">{tier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-bold">{count}</span>
                      <span className="text-[10px] text-white/40">
                        ({allUsers.length > 0 ? ((count / allUsers.length) * 100).toFixed(0) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <SectionHeader icon={Activity} title="Riepilogo attivita" subtitle="Statistiche generali" />
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-white/40 mb-1">Depositi totali</p>
                  <p className="text-sm font-bold text-white">{adminDepositRequests.length}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-white/40 mb-1">Prelievi totali</p>
                  <p className="text-sm font-bold text-white">{adminWithdrawalRequests.length}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-white/40 mb-1">Dispositivi attivi</p>
                  <p className="text-sm font-bold text-white">{adminUserDevices.filter(d => d.status === 'active').length}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-white/40 mb-1">Log errori</p>
                  <p className="text-sm font-bold text-red-400">{errorLogsCount}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleExportUsers}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Esporta tutti i dati utenti (CSV)
            </button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            {!platformSettings && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs flex items-center gap-2">
                <CircleAlert size={14} />
                <code>platform_settings</code> non trovato: crea la riga con <code>id = 1</code> nel database Supabase.
              </div>
            )}

            {/* ─── Stato piattaforma ─── */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
              <SectionHeader icon={Globe} title="Stato piattaforma" subtitle="Controlli operativi principali" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Maintenance mode</p>
                    <p className="text-[10px] text-white/40">Blocca l'accesso agli utenti durante la manutenzione</p>
                  </div>
                  <Toggle
                    checked={settingsDraft.maintenance_mode}
                    onChange={(v) => setSettingsDraft((prev) => ({ ...prev, maintenance_mode: v }))}
                  />
                </div>
                <div className="border-t border-white/5" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Depositi abilitati</p>
                    <p className="text-[10px] text-white/40">Permetti agli utenti di richiedere depositi</p>
                  </div>
                  <Toggle
                    checked={settingsDraft.deposits_enabled}
                    onChange={(v) => setSettingsDraft((prev) => ({ ...prev, deposits_enabled: v }))}
                  />
                </div>
                <div className="border-t border-white/5" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Prelievi abilitati</p>
                    <p className="text-[10px] text-white/40">Permetti agli utenti di richiedere prelievi</p>
                  </div>
                  <Toggle
                    checked={settingsDraft.withdrawals_enabled}
                    onChange={(v) => setSettingsDraft((prev) => ({ ...prev, withdrawals_enabled: v }))}
                  />
                </div>
                <div className="border-t border-white/5" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Claim giornaliero</p>
                    <p className="text-[10px] text-white/40">Daily claim attivo per tutti gli utenti idonei</p>
                  </div>
                  <Toggle
                    checked={settingsDraft.daily_claim_enabled}
                    onChange={(v) => setSettingsDraft((prev) => ({ ...prev, daily_claim_enabled: v }))}
                  />
                </div>
              </div>
            </div>

            {/* ─── Limiti transazioni ─── */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
              <SectionHeader icon={DollarSign} title="Limiti transazioni" subtitle="Importi minimi per depositi e prelievi" />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] text-white/60 font-medium">Min deposito (USDT)</span>
                  <input
                    type="number"
                    value={settingsDraft.min_deposit}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, min_deposit: Number(e.target.value) }))}
                    className="mt-1 w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:border-amber-500/50 focus:outline-none"
                    min={0}
                    step={1}
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-white/60 font-medium">Min prelievo (USDT)</span>
                  <input
                    type="number"
                    value={settingsDraft.min_withdraw}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, min_withdraw: Number(e.target.value) }))}
                    className="mt-1 w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:border-amber-500/50 focus:outline-none"
                    min={0}
                    step={1}
                  />
                </label>
              </div>
            </div>

            {/* ─── Configurazione deposito ─── */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
              <SectionHeader icon={Wallet} title="Configurazione deposito" subtitle="Asset, network e indirizzo wallet" />
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] text-white/60 font-medium">Asset</span>
                  <input
                    type="text"
                    value={settingsDraft.deposit_asset}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, deposit_asset: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:border-amber-500/50 focus:outline-none"
                    placeholder="es. USDT"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] text-white/60 font-medium">Network</span>
                  <input
                    type="text"
                    value={settingsDraft.deposit_network}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, deposit_network: e.target.value }))}
                    className="mt-1 w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:border-amber-500/50 focus:outline-none"
                    placeholder="es. BEP20, TRC20"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-[11px] text-white/60 font-medium">Indirizzo wallet deposito</span>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={settingsDraft.deposit_address}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, deposit_address: e.target.value }))}
                    className="w-full px-3 py-2.5 pr-10 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-mono focus:border-amber-500/50 focus:outline-none"
                    placeholder="Indirizzo wallet"
                  />
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(settingsDraft.deposit_address);
                      pushNotice('success', 'Indirizzo copiato');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    title="Copia indirizzo"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </label>
            </div>

            {/* ─── Sicurezza ─── */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <SectionHeader icon={ShieldCheck} title="Sicurezza" subtitle="Stato protezioni database" />
              <div className="space-y-2">
                {[
                  { label: 'Row Level Security (RLS)', desc: 'Attivo su tutte le 10 tabelle', ok: true },
                  { label: 'Accesso anonimo', desc: 'Solo lettura GPU catalog e settings', ok: true },
                  { label: 'Funzioni admin', desc: 'Protette con is_admin() check', ok: true },
                  { label: 'Email temporanee', desc: '30+ domini bloccati alla registrazione', ok: true },
                  { label: 'Security scan QR', desc: 'Attivo nella pagina depositi', ok: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <ShieldCheck size={14} className={item.ok ? 'text-emerald-400' : 'text-red-400'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium">{item.label}</p>
                      <p className="text-[10px] text-white/40">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Referral system info ─── */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <SectionHeader icon={Users} title="Sistema Referral" subtitle="Commissioni su acquisto dispositivi" />
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-emerald-300/70 mb-1">Livello 1 (Diretto)</p>
                  <p className="text-xl font-bold text-emerald-400">5%</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-blue-300/70 mb-1">Livello 2 (Indiretto)</p>
                  <p className="text-xl font-bold text-blue-400">2%</p>
                </div>
              </div>
              <p className="text-[10px] text-white/35 text-center">
                Commissioni applicate solo su acquisto dispositivi. Nessun bonus invito.
              </p>
            </div>

            {/* ─── Daily Claim info ─── */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <SectionHeader icon={Zap} title="Daily Claim" subtitle="Formula ricompensa giornaliera" />
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-white font-mono text-center">0.10 + min(streak, 30) × 0.02 USDT</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-[9px] text-white/40">Giorno 1</p>
                  <p className="text-xs font-bold text-amber-400">0.12 USDT</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-[9px] text-white/40">Giorno 15</p>
                  <p className="text-xs font-bold text-amber-400">0.40 USDT</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <p className="text-[9px] text-white/40">Giorno 30+</p>
                  <p className="text-xs font-bold text-amber-400">0.70 USDT</p>
                </div>
              </div>
            </div>

            {/* ─── Email blocklist info ─── */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <SectionHeader icon={MailX} title="Blocco email temporanee" subtitle="Domini bloccati alla registrazione" />
              <div className="flex flex-wrap gap-1.5">
                {['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'yopmail.com', 'throwaway.email', 'temp-mail.org', 'dispostable.com', 'sharklasers.com'].map((d) => (
                  <span key={d} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[9px] text-red-300 font-mono">{d}</span>
                ))}
                <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] text-white/50">+22 altri</span>
              </div>
            </div>

            {/* ─── Salva ─── */}
            <button
              onClick={() => void handleSaveSettings()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[#06080f] font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-shadow"
            >
              Salva impostazioni piattaforma
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
