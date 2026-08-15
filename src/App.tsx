/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AnalyticsView } from './components/AnalyticsView';
import { RemindersView } from './components/RemindersView';
import { SupportView } from './components/SupportView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { ReminderModal } from './components/ReminderModal';
import { TicketModal } from './components/TicketModal';
import { AvatarModal } from './components/AvatarModal';
import { AuthModal } from './components/AuthModal';
import { Transaction } from './types';
import { Plus, ShieldCheck, Lock } from 'lucide-react';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    addTransaction,
    updateTransaction,
    addNotification,
    createTicket,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isAuthenticated, // استفاده از متغیر صحیح احراز هویت
  } = useApp();

  // Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const handleOpenAddTxModal = () => {
    setEditingTx(null);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTxModal = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  const handleTxSubmit = (txData: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (editingTx) {
      updateTransaction(editingTx.id, txData);
    } else {
      addTransaction(txData);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] dark:bg-[#0A0F0D] text-zinc-900 dark:text-zinc-100 font-vazir transition-colors duration-200">
      {/* Top Application Header */}
      <Header
        onOpenTransactionModal={handleOpenAddTxModal}
        onOpenReminderModal={() => setIsReminderModalOpen(true)}
      />

      {/* Primary Navigation Tabs */}
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenTransactionModal={handleOpenAddTxModal}
            onOpenReminderModal={() => setIsReminderModalOpen(true)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            onOpenAddModal={handleOpenAddTxModal}
            onOpenEditModal={handleOpenEditTxModal}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'reminders' && (
          <RemindersView onOpenAddReminderModal={() => setIsReminderModalOpen(true)} />
        )}

        {activeTab === 'support' && (
          isAuthenticated ? (
            <SupportView onOpenTicketModal={() => setIsTicketModalOpen(true)} />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] p-6 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
                دسترسی به مرکز پشتیبانی نیازمند ورود است
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
                برای ارسال و پیگیری تیکت‌ها و ارتباط با تیم پشتیبانی کیفیار، لطفاً ابتدا وارد حساب کاربری خود شوید.
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-cairo font-bold transition shadow-xs cursor-pointer"
              >
                ورود / ثبت‌نام در کیفیار
              </button>
            </div>
          )
        )}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-6 left-6 z-40">
        <button
          id="mobile-fab-add-btn"
          onClick={handleOpenAddTxModal}
          aria-label="ثبت تراکنش جدید"
          className="w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/30 flex items-center justify-center active:scale-90 transition cursor-pointer"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Standard Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSubmit={handleTxSubmit}
        editingTransaction={editingTx}
      />

      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onSubmit={(data) => addNotification(data)}
      />

      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSubmit={(data) => createTicket(data)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-[#E2E8E4] dark:border-[#1A2621] bg-white dark:bg-[#0C120F] py-6 text-xs text-zinc-500 dark:text-zinc-400 font-vazir">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-brand font-bold text-base text-emerald-800 dark:text-emerald-400">
              کیفیار
            </span>
            <span className="text-zinc-400 dark:text-zinc-600 font-sans text-xs">kifyar</span>
            <span>•</span>
            <span className="font-vazir">سامانه هوشمند مدیریت مالی و حسابداری شخصی</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 font-vazir">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              حفظ حریم خصوصی، بدون نیاز به شماره تماس و ذخیره‌سازی امن اطلاعات
            </span>
          </div>
        </div>
      </footer>

      {/* Global Overlays & Modals */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}