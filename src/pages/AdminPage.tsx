import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  Check,
  CircleAlert,
  Cog,
  Cpu,
  Edit3,
  Eye,
  ExternalLink,
  Lock,
  LockOpen,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../store/AppContext';

type AdminTab = 'users' | 'devices' | 'transactions' | 'logs' | 'settings';

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
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
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
  const [txFilter, setTxFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'rejected'>('all');
  const [txSearch, setTxSearch] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignDeviceId, setAssignDeviceId] = useState('');
  const [assignChargeBalance, setAssignChargeBalance] = useState(false);
  const [removeWithRefund, setRemoveWithRefund] = useState(false);
  const adminBootstrappedForUserRef = useRef<string | null>(null);
  const [settingsDraft, setSettingsDraft] = useState({
    maintenance_mode: false,
    deposits_enabled: true,
    withdrawals_enabled: true,
    daily_claim_enabled: true,
    min_deposit: 0,
    min_withdraw: 0,
    deposit_asset: 'USDT',
    deposit_network: 'TRC20',
    deposit_address: '',
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
    () => [...adminDepositRequests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [adminDepositRequests],
  );
  const sortedWithdrawalRequests = useMemo(
    () => [...adminWithdrawalRequests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
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

  const tabs: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: 'users', label: 'Utenti', icon: Users },
    { key: 'devices', label: 'Dispositivi', icon: Cpu },
    { key: 'transactions', label: 'Transazioni', icon: Activity },
    { key: 'logs', label: 'Errori', icon: Eye },
    { key: 'settings', label: 'Settings', icon: Cog },
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

  const applyWithdrawalStatus = async (
    itemId: string,
    currentStatus: 'pending' | 'approved' | 'completed' | 'rejected',
  ) => {
    const nextStatus = withdrawStatusDraft[itemId] ?? currentStatus;
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

        <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Utenti', value: allUsers.length, color: 'from-amber-500 to-amber-600' },
              { label: 'Bloccati', value: allUsers.filter((u) => u.status === 'blocked').length, color: 'from-red-500 to-rose-600' },
              { label: 'Dispositivi', value: adminUserDevices.length, color: 'from-blue-500 to-indigo-600' },
              { label: 'Richieste', value: pendingDeposits.length + pendingWithdrawals.length, color: 'from-amber-500 to-orange-600' },
            ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-xl p-3 text-center`}>
              <p className="font-display text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[9px] text-white/75">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                  activeTab === tab.key ? 'bg-amber-600 text-white' : 'text-white/50 hover:text-white/70'
                }`}
              >
                <TabIcon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4">
        {activeTab === 'users' && (
          <div className="space-y-2">
            {allUsers.map((user) => (
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
                      title="Modifica saldo Dollaro"
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

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/5 rounded-lg p-2">
                    <p className="text-[9px] text-white/40">Dollaro</p>
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
                </div>

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
                      placeholder="Nuovo saldo Dollaro"
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
                    <p className="text-white/40 text-[10px]">
                      User: {userMap.get(ud.user_id ?? '')?.username ?? 'unknown'} ({userMap.get(ud.user_id ?? '')?.email ?? ud.user_id ?? 'n/a'})
                    </p>
                    <p className="text-white/30 text-[10px]">Entry ID: {ud.id}</p>
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
                {(['all', 'pending', 'approved', 'completed', 'rejected'] as const).map((status) => (
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
                      <p className="text-[10px] text-white/35">{new Date(item.created_at).toLocaleString('it-IT')}</p>
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
                      <option value="rejected" className="bg-[#0c101c] text-white">rejected</option>
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
                      <p className="text-[10px] text-white/35">{new Date(item.created_at).toLocaleString('it-IT')}</p>
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
                      <option value="rejected" className="bg-[#0c101c] text-white">rejected</option>
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
                  <p className="text-white text-xs font-medium truncate">{tx.description}</p>
                  <p className="text-white/30 text-[9px]">{tx.user_id}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}
                    {tx.amount.toFixed(2)} {tx.currency}
                  </p>
                  <p className="text-white/30 text-[9px]">
                    {new Date(tx.created_at).toLocaleDateString('it-IT')}
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
                    <p className="text-white/60 text-[10px]">{new Date(log.created_at).toLocaleString('it-IT')}</p>
                    <span className={`text-[10px] font-bold ml-auto ${isError ? 'text-red-300' : 'text-amber-400'}`}>
                      {log.action}
                    </span>
                  </div>
                  <p className="text-white text-xs">
                    {String(log.metadata?.description ?? log.action)}
                  </p>
                  <p className="text-white/35 text-[10px] mt-1">{log.admin_id}</p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-3">
            {!platformSettings && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs">
                `platform_settings` non trovato: crea la riga con `id = 1` nel database Supabase.
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              {[
                { key: 'maintenance_mode', label: 'Maintenance mode' },
                { key: 'deposits_enabled', label: 'Depositi abilitati' },
                { key: 'withdrawals_enabled', label: 'Prelievi abilitati' },
                { key: 'daily_claim_enabled', label: 'Claim giornaliero abilitato' },
              ].map((toggle) => (
                <label key={toggle.key} className="flex items-center justify-between text-sm text-white">
                  <span>{toggle.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(settingsDraft[toggle.key as keyof typeof settingsDraft])}
                    onChange={(e) =>
                      setSettingsDraft((prev) => ({ ...prev, [toggle.key]: e.target.checked }))
                    }
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>
              ))}

              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-white/70">
                  Min deposito
                  <input
                    type="number"
                    value={settingsDraft.min_deposit}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, min_deposit: Number(e.target.value) }))}
                    className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </label>
                <label className="text-xs text-white/70">
                  Min prelievo
                  <input
                    type="number"
                    value={settingsDraft.min_withdraw}
                    onChange={(e) => setSettingsDraft((prev) => ({ ...prev, min_withdraw: Number(e.target.value) }))}
                    className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </label>
              </div>

              <label className="text-xs text-white/70 block">
                Asset deposito
                <input
                  type="text"
                  value={settingsDraft.deposit_asset}
                  onChange={(e) => setSettingsDraft((prev) => ({ ...prev, deposit_asset: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </label>

              <label className="text-xs text-white/70 block">
                Network deposito
                <input
                  type="text"
                  value={settingsDraft.deposit_network}
                  onChange={(e) => setSettingsDraft((prev) => ({ ...prev, deposit_network: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </label>

              <label className="text-xs text-white/70 block">
                Indirizzo deposito
                <input
                  type="text"
                  value={settingsDraft.deposit_address}
                  onChange={(e) => setSettingsDraft((prev) => ({ ...prev, deposit_address: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </label>

              <button
                onClick={() => void handleSaveSettings()}
                className="w-full py-2.5 rounded-lg bg-amber-500 text-[#06080f] font-semibold text-sm"
              >
                Salva impostazioni piattaforma
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
