import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AnalyticsView } from './components/AnalyticsView';
import { DongView } from './components/DongView';
import { GoalsView } from './components/GoalsView';
import { RemindersView } from './components/RemindersView';
import { SubscriptionView } from './components/SubscriptionView';
import { SupportView } from './components/SupportView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { TicketModal } from './components/TicketModal';
import { AuthModal } from './components/AuthModal';
import { AvatarModal } from './components/AvatarModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { FloatingAIAssistant } from './components/FloatingAIAssistant';
import { LandingPage } from './components/LandingPage';
import { AuthGuardModal } from './components/AuthGuardModal';
import { Transaction } from './types';
import { ShieldCheck, Heart, Sparkles, ShieldAlert } from 'lucide-react';
import { initSecurityProtection } from './utils/devtoolsProtection';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsAuthModalOpen,
    isSubscriptionModalOpen,
    closeSubscriptionModal,
    isAuthGuardOpen,
    authGuardMessage,
    closeAuthGuard,
    addTicket,
  } = useApp();

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);

  // اطمینان از اینکه در اولین بارگذاری اگر تب مشخص نشده بود، لندینگ بیود
  useEffect(() => {
    if (!activeTab) {
      setActiveTab('landing');
    }
  }, [activeTab, setActiveTab]);

  useEffect(() => {
    const cleanup = initSecurityProtection(() => {
      setShowSecurityNotice(true);
      setTimeout(() => setShowSecurityNotice(false), 3000);
    });
    return cleanup;
  }, []);

  const handleOpenTransactionModal = (tx?: Transaction) => {
    setEditingTx(tx || null);
    setIsTxModalOpen(true);
  };

  const handleTicketSubmit = (data: {
    subject: string;
    department: any;
    priority: any;
    initialMessage: string;
  }) => {
    addTicket(data.subject, data.department, data.priority, data.initialMessage);
  };

  if (activeTab === 'landing' || !activeTab) {
    return (
      <>
        {/* Security Shield Toast for Inspector/DevTools Attempts */}
        {showSecurityNotice && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-rose-950/90 border border-rose-500/70 text-rose-200 text-xs font-cairo font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>کدهای منبع سامانه جهت حفظ امنیت حساب‌های مالی رمزنگاری و حفاظت شده‌اند.</span>
          </div>
        )}

        <LandingPage
          onEnterApp={() => setActiveTab('dashboard')}
          onOpenAuth={() => {
            setIsAuthModalOpen(true);
            setActiveTab('dashboard');
          }}
          onOpenSubscription={() => setActiveTab('subscription')}
        />

        <AuthModal />
        <AuthGuardModal
          isOpen={isAuthGuardOpen}
          onClose={closeAuthGuard}
          message={authGuardMessage}
        />
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={closeSubscriptionModal}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#070B09] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200 font-cairo" dir="rtl">
      {/* Security Shield Toast for Inspector/DevTools Attempts */}
      {showSecurityNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-rose-950/90 border border-rose-500/70 text-rose-200 text-xs font-cairo font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>کدهای منبع سامانه جهت حفظ امنیت حساب‌های مالی رمزنگاری و حفاظت شده‌اند.</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
      />

      {/* Navigation Bar (Desktop and Mobile) */}
      <Navigation />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView onOpenTransactionModal={() => handleOpenTransactionModal()} />
        )}
        {activeTab === 'transactions' && (
          <TransactionsView onOpenTransactionModal={handleOpenTransactionModal} />
        )}
        {activeTab === 'goals' && <GoalsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'dong' && <DongView />}
        {activeTab === 'reminders' && <RemindersView />}
        {activeTab === 'subscription' && <SubscriptionView />}
        {activeTab === 'support' && (
          <SupportView onOpenTicketModal={() => setIsTicketModalOpen(true)} />
        )}
        {activeTab === 'settings' && (
          <SettingsView onOpenAvatarModal={() => setIsAvatarModalOpen(true)} />
        )}
      </main>

      {/* Application Footer */}
      <footer className="border-t border-[#E2E8E4] dark:border-[#1A2621] py-6 mb-18 md:mb-0 text-xs text-zinc-500 dark:text-zinc-400 bg-white/50 dark:bg-[#0A100D]/50 font-cairo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-brand font-bold text-sm text-zinc-800 dark:text-zinc-200">
              چندبوم (Chandboom)
            </span>
            <span>• تمامی حقوق برای سامانه مدیریت مالی «چندبوم» محفوظ است.</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono" dir="ltr">
            Chandboom © {new Date().getFullYear()}
          </div>
        </div>
      </footer>

      {/* Floating Bottom-Left AI Assistant */}
      <FloatingAIAssistant />

      {/* Global Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        editingTransaction={editingTx}
      />

      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSubmit={handleTicketSubmit}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />

      <AuthModal />

      <AuthGuardModal
        isOpen={isAuthGuardOpen}
        onClose={closeAuthGuard}
        message={authGuardMessage}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={closeSubscriptionModal}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}