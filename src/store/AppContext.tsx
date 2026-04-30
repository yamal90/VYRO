import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserDevice, Transaction, TeamMember, DailyClaim, Page, GPUDevice } from '../types';
import {
  DEMO_USER, ADMIN_USER, DEMO_USER_DEVICES, DEMO_TRANSACTIONS,
  DEMO_TEAM_MEMBERS, DEMO_DAILY_CLAIMS, GPU_DEVICES, ALL_USERS, uid
} from './data';

interface AppState {
  currentUser: User | null;
  isLoggedIn: boolean;
  currentPage: Page;
  userDevices: UserDevice[];
  transactions: Transaction[];
  teamMembers: TeamMember[];
  dailyClaims: DailyClaim[];
  gpuDevices: GPUDevice[];
  allUsers: User[];
  balanceVisible: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setPage: (page: Page) => void;
  toggleBalanceVisibility: () => void;
  activateDevice: (deviceId: string) => { success: boolean; message: string };
  claimDailyReward: () => { success: boolean; message: string };
  updateUserBalance: (userId: string, field: 'vx_balance' | 'demo_usdt_balance', amount: number) => void;
  updateDeviceStatus: (userDeviceId: string, status: UserDevice['status']) => void;
  blockUser: (userId: string) => void;
}

const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [userDevices, setUserDevices] = useState<UserDevice[]>(DEMO_USER_DEVICES);
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS);
  const [teamMembers] = useState<TeamMember[]>(DEMO_TEAM_MEMBERS);
  const [dailyClaims, setDailyClaims] = useState<DailyClaim[]>(DEMO_DAILY_CLAIMS);
  const [gpuDevices] = useState<GPUDevice[]>(GPU_DEVICES);
  const [allUsers, setAllUsers] = useState<User[]>(ALL_USERS);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const login = useCallback((email: string, _password: string) => {
    if (email === 'admin@vyrogpu.com') {
      setCurrentUser({ ...ADMIN_USER });
      setIsLoggedIn(true);
      setCurrentPage('home');
      return true;
    }
    setCurrentUser({ ...DEMO_USER });
    setIsLoggedIn(true);
    setCurrentPage('home');
    return true;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage('login');
  }, []);

  const setPage = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const toggleBalanceVisibility = useCallback(() => {
    setBalanceVisible(v => !v);
  }, []);

  const activateDevice = useCallback((deviceId: string): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Non autenticato' };
    const device = gpuDevices.find(d => d.id === deviceId);
    if (!device) return { success: false, message: 'Dispositivo non trovato' };
    if (currentUser.vx_balance < device.price) return { success: false, message: 'Saldo VX insufficiente' };

    const newBalance = currentUser.vx_balance - device.price;
    const newPower = currentUser.compute_power + device.compute_power;
    setCurrentUser(u => u ? { ...u, vx_balance: newBalance, compute_power: newPower } : null);

    const newUserDevice: UserDevice = {
      id: uid(),
      user_id: currentUser.id,
      device_id: deviceId,
      device: device,
      status: 'pending',
      start_date: new Date().toISOString(),
      end_date: null,
      total_generated: 0,
      created_at: new Date().toISOString(),
    };
    setUserDevices(prev => [newUserDevice, ...prev]);

    const tx: Transaction = {
      id: uid(),
      user_id: currentUser.id,
      type: 'device_purchase',
      amount: -device.price,
      currency: 'VX',
      status: 'completed',
      description: `Attivazione ${device.name}`,
      created_at: new Date().toISOString(),
    };
    setTransactions(prev => [tx, ...prev]);

    return { success: true, message: `${device.name} attivato con successo!` };
  }, [currentUser, gpuDevices]);

  const claimDailyReward = useCallback((): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'Non autenticato' };
    const today = new Date().toISOString().slice(0, 10);
    const alreadyClaimed = dailyClaims.some(c => c.claim_date === today && c.user_id === currentUser.id);
    if (alreadyClaimed) return { success: false, message: 'Già riscosso oggi!' };

    const amount = 2.5;
    setCurrentUser(u => u ? { ...u, vx_balance: u.vx_balance + amount } : null);

    const claim: DailyClaim = {
      id: uid(),
      user_id: currentUser.id,
      amount,
      claim_date: today,
      created_at: new Date().toISOString(),
    };
    setDailyClaims(prev => [claim, ...prev]);

    const tx: Transaction = {
      id: uid(),
      user_id: currentUser.id,
      type: 'daily_claim',
      amount,
      currency: 'VX',
      status: 'completed',
      description: 'Claim giornaliero VX token',
      created_at: new Date().toISOString(),
    };
    setTransactions(prev => [tx, ...prev]);

    return { success: true, message: `+${amount} VX token riscossi!` };
  }, [currentUser, dailyClaims]);

  const updateUserBalance = useCallback((userId: string, field: 'vx_balance' | 'demo_usdt_balance', amount: number) => {
    if (currentUser?.role !== 'admin') return;
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: amount } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(u => u ? { ...u, [field]: amount } : null);
    }
  }, [currentUser]);

  const updateDeviceStatus = useCallback((userDeviceId: string, status: UserDevice['status']) => {
    if (currentUser?.role !== 'admin') return;
    setUserDevices(prev => prev.map(d => d.id === userDeviceId ? { ...d, status } : d));
  }, [currentUser]);

  const blockUser = useCallback((_userId: string) => {
    if (currentUser?.role !== 'admin') return;
    // In demo, just remove from list
    setAllUsers(prev => prev.filter(u => u.id !== _userId));
  }, [currentUser]);

  return (
    <AppContext.Provider value={{
      currentUser, isLoggedIn, currentPage, userDevices, transactions,
      teamMembers, dailyClaims, gpuDevices, allUsers, balanceVisible,
      login, logout, setPage, toggleBalanceVisibility,
      activateDevice, claimDailyReward,
      updateUserBalance, updateDeviceStatus, blockUser,
    }}>
      {children}
    </AppContext.Provider>
  );
};
