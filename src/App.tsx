import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { TransactionsView } from './components/TransactionsView';
import { DongView } from './components/DongView';
import { SupportView } from './components/SupportView';
import { ProfileView } from './components/ProfileView';
import { NewTransactionModal } from './components/NewTransactionModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { Transaction, UserProfile, DongGroup, CategoryBudget, AuthUser, SupportTicket } from './types';
import { INITIAL_TRANSACTIONS, INITIAL_PROFILE, INITIAL_DONGS, INITIAL_CATEGORY_BUDGETS, INITIAL_TICKETS } from './data/initialData';
import { calculateTotals } from './utils/formatters';
import { Language } from './data/translations';
import {
  fetchTransactionsFromDB,
  saveTransactionToDB,
  deleteTransactionFromDB,
  fetchProfileFromDB,
  updateProfileInDB,
  fetchDongsFromDB,
  saveDongToDB,
  deleteDongFromDB,
  fetchBudgetsFromDB,
  updateBudgetInDB,
  fetchSupportTicketsFromDB,
  supabase,
  isSupabaseConfigured,
} from './lib/supabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Theme & Language state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [lang, setLang] = useState<Language>('fa');

  // Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('walletyar_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync Supabase Auth session on mount and OAuth redirects
  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const user: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: userMeta.full_name || userMeta.name || session.user.email?.split('@')[0] || 'کاربر ولتیار',
            provider: (session.user.app_metadata?.provider as any) || 'google',
            isAuthenticated: true,
          };
          setAuthUser(user);
          try {
            localStorage.setItem('walletyar_auth', JSON.stringify(user));
          } catch (e) {
            console.warn(e);
          }
        }
      });

      const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const user: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: userMeta.full_name || userMeta.name || session.user.email?.split('@')[0] || 'کاربر ولتیار',
            provider: (session.user.app_metadata?.provider as any) || 'google',
            isAuthenticated: true,
          };
          setAuthUser(user);
          try {
            localStorage.setItem('walletyar_auth', JSON.stringify(user));
          } catch (e) {
            console.warn(e);
          }
        } else if (_event === 'SIGNED_OUT') {
          setAuthUser(null);
          try {
            localStorage.removeItem('walletyar_auth');
          } catch (e) {
            console.warn(e);
          }
        }
      });

      return () => {
        authSubscription.subscription.unsubscribe();
      };
    }
  }, []);

  // Core Data States
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [dongs, setDongs] = useState<DongGroup[]>(INITIAL_DONGS);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>(INITIAL_CATEGORY_BUDGETS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [isLoadingDB, setIsLoadingDB] = useState<boolean>(true);

  // Modal visibility states
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Apply Theme & Direction to Document Element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Load All Initial Data From Database (Supabase)
  const loadDatabaseData = async () => {
    setIsLoadingDB(true);
    try {
      const [txs, prof, dgList, bdgList, tktList] = await Promise.all([
        fetchTransactionsFromDB(),
        fetchProfileFromDB(),
        fetchDongsFromDB(),
        fetchBudgetsFromDB(),
        fetchSupportTicketsFromDB(),
      ]);

      if (txs) setTransactions(txs);
      if (prof) setProfile(prof);
      if (dgList) setDongs(dgList);
      if (bdgList) setCategoryBudgets(bdgList);
      if (tktList) setTickets(tktList);
    } catch (err) {
      console.error('Error loading data from database:', err);
    } finally {
      setIsLoadingDB(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Handle Add / Edit Transaction in Database
  const handleSaveTransaction = async (data: Omit<Transaction, 'id'> & { id?: string }) => {
    const savedTx = await saveTransactionToDB(data);
    if (data.id) {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === data.id ? savedTx : tx))
      );
    } else {
      setTransactions((prev) => [savedTx, ...prev]);
    }
    setEditingTransaction(null);
  };

  // Handle Delete Transaction from Database
  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm(lang === 'fa' ? 'آیا از حذف این تراکنش اطمینان دارید؟' : 'Are you sure you want to delete this transaction?')) {
      await deleteTransactionFromDB(id);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    }
  };

  // Handle Edit Trigger
  const handleEditTrigger = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsNewTxModalOpen(true);
  };

  // Handle Profile Update in Database
  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    const newProfile = await updateProfileInDB(updated);
    setProfile(newProfile);
  };

  // Handle Dong Operations in Database
  const handleSaveDong = async (dong: DongGroup) => {
    const savedDong = await saveDongToDB(dong);
    setDongs((prev) => [savedDong, ...prev.filter((d) => d.id !== dong.id)]);
  };

  const handleDeleteDong = async (id: string) => {
    await deleteDongFromDB(id);
    setDongs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleToggleMemberSettled = async (dongId: string, memberId: string) => {
    const targetDong = dongs.find((d) => d.id === dongId);
    if (!targetDong) return;

    const updatedMembers = targetDong.members.map((m) =>
      m.id === memberId ? { ...m, isSettled: !m.isSettled } : m
    );

    const updatedDong: DongGroup = {
      ...targetDong,
      members: updatedMembers,
    };

    await saveDongToDB(updatedDong);
    setDongs((prev) =>
      prev.map((dong) => (dong.id === dongId ? updatedDong : dong))
    );
  };

  // Handle Budget Limit Update in Database
  const handleUpdateCategoryBudget = async (categoryId: string, newLimit: number) => {
    const updatedBudgets = await updateBudgetInDB(categoryId, newLimit);
    setCategoryBudgets(updatedBudgets);
  };

  // Handle Auth Login / Logout
  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    try {
      localStorage.setItem('walletyar_auth', JSON.stringify(user));
    } catch (e) {
      console.warn('Storage error:', e);
    }

    if (user.name || user.email) {
      handleUpdateProfile({
        name: user.name || profile.name,
        email: user.email || profile.email,
      });
    }
  };

  const handleLogout = () => {
    setAuthUser(null);
    try {
      localStorage.removeItem('walletyar_auth');
    } catch (e) {
      console.warn('Storage error:', e);
    }
  };

  // Calculate totals
  const { netSavings } = calculateTotals(transactions);
  const totalBalance = profile.currentBalance + netSavings;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Vazirmatn'] transition-colors">
      {/* Top Navigation Header */}
      <Header
        profile={profile}
        authUser={authUser}
        onOpenNewTransaction={() => {
          setEditingTransaction(null);
          setIsNewTxModalOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        lang={lang}
      />

      {/* Main Content Layout with Sidebar */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Navigation Bar / Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewTransaction={() => {
            setEditingTransaction(null);
            setIsNewTxModalOpen(true);
          }}
          totalBalance={totalBalance}
          lang={lang}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {isLoadingDB && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              {lang === 'fa' ? 'در حال دریافت آخرین اطلاعات متصل به دیتابیس...' : 'Fetching latest data from database...'}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              profile={profile}
              dongs={dongs}
              onOpenNewTransaction={() => {
                setEditingTransaction(null);
                setIsNewTxModalOpen(true);
              }}
              onEditTransaction={handleEditTrigger}
              onDeleteTransaction={handleDeleteTransaction}
              onNavigateToTransactions={() => setActiveTab('transactions')}
              onNavigateToAnalytics={() => setActiveTab('analytics')}
              onNavigateToDong={() => setActiveTab('dong')}
              lang={lang}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              transactions={transactions}
              categoryBudgets={categoryBudgets}
              onUpdateCategoryBudget={handleUpdateCategoryBudget}
              lang={lang}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              onOpenNewTransaction={() => {
                setEditingTransaction(null);
                setIsNewTxModalOpen(true);
              }}
              onEditTransaction={handleEditTrigger}
              onDeleteTransaction={handleDeleteTransaction}
              lang={lang}
            />
          )}

          {activeTab === 'dong' && (
            <DongView
              dongs={dongs}
              onSaveDong={handleSaveDong}
              onDeleteDong={handleDeleteDong}
              onToggleMemberSettled={handleToggleMemberSettled}
              lang={lang}
            />
          )}

          {activeTab === 'support' && (
            <SupportView
              authUser={authUser}
              profile={profile}
              tickets={tickets}
              onTicketsChange={setTickets}
              onRefreshTickets={loadDatabaseData}
              lang={lang}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              profile={profile}
              authUser={authUser}
              onUpdateProfile={handleUpdateProfile}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onLogout={handleLogout}
              netSavings={netSavings}
              theme={theme}
              onToggleTheme={setTheme}
              lang={lang}
              onToggleLang={setLang}
            />
          )}
        </main>
      </div>

      {/* Footer with Mandatory Legal Copyright in Persian & English */}
      <Footer lang={lang} />

      {/* Modal for Adding/Editing Transactions */}
      <NewTransactionModal
        isOpen={isNewTxModalOpen}
        onClose={() => {
          setIsNewTxModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
        lang={lang}
      />

      {/* Authentication Modal (Mobile OTP, Email, Google) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        lang={lang}
      />
    </div>
  );
}
