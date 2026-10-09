import React, { useState } from 'react';
import {
  Wallet,
  Shield,
  Crown,
  Moon,
  Sun,
  LogIn,
  LogOut,
  Bell,
  Sparkles,
  ChevronDown,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatToman } from '../utils/formatters';

interface HeaderProps {
  onOpenAdminModal: () => void;
  onOpenAvatarModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdminModal,
  onOpenAvatarModal,
}) => {
  const {
    user,
    isAuthenticated,
    setIsAuthModalOpen,
    logout,
    theme,
    toggleTheme,
    isProUser,
    openSubscriptionModal,
    requestSubscription,
    isAdmin,
    metrics,
    reminders,
    setActiveTab,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unpaidRemindersCount = reminders.filter((r) => !r.is_paid).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A100D]/95 backdrop-blur-md border-b border-[#E2E8E4] dark:border-[#1A2621] transition-colors font-cairo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group text-right"
            title="مشاهده داشبورد چندبوم"
          >
            <div className="w-10 h-10 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <img
                src="/assets/logo.png"
                alt="لوگوی رسمی چندبوم"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-brand font-bold text-2xl text-black dark:text-white tracking-tight select-none">
                چندبوم
              </span>
              <span className="text-[10px] font-cairo font-bold text-emerald-700 dark:text-emerald-400 -mt-1 select-none">
                سامانه هوشمند مالی و بودجه
              </span>
            </div>
          </button>
        </div>

        {/* Center Quick Balance Capsule (Desktop) */}
        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-100/80 dark:bg-[#111A16] border border-[#E2E8E4] dark:border-[#1E2C25] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">موجودی خالص:</span>
            <span
              className={`font-cairo font-bold ${
                metrics.balance >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatToman(metrics.balance)}
            </span>
          </div>

          <span className="text-zinc-300 dark:text-zinc-700">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">هزینه‌های ماه:</span>
            <span className="font-cairo font-bold text-zinc-900 dark:text-white">
              {formatToman(metrics.totalExpense)}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Panel Button strictly if admin */}
          {isAdmin && (
            <button
              id="open-admin-dashboard-btn"
              onClick={onOpenAdminModal}
              title="ورود به پنل مدیریت ارشد"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-[#20152B] text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60 font-cairo font-bold text-xs hover:bg-purple-100 dark:hover:bg-[#2C1C3D] transition cursor-pointer shadow-xs"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden sm:inline">پنل مدیریت</span>
            </button>
          )}

          {/* Golden Pro Subscription Button / Active Badge in Header */}
          {isAuthenticated && isProUser ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-400/50 text-xs font-cairo font-bold shadow-xs">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>حساب طلایی فعال</span>
            </div>
          ) : (
            <button
              id="header-buy-pro-btn"
              onClick={requestSubscription}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-cairo font-black text-xs transition cursor-pointer shadow-md hover:shadow-lg active:scale-95 shrink-0"
            >
              <Crown className="w-4 h-4 text-zinc-950" />
              <span>خرید اشتراک طلایی</span>
            </button>
          )}

          {/* Reminders Bell with Badge */}
          <button
            onClick={() => setActiveTab('reminders')}
            title="یادآورهای سررسید"
            className="relative p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#141F1A] transition cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unpaidRemindersCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600" />
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'حالت روز' : 'حالت شب'}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#141F1A] transition cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-emerald-700" />
            )}
          </button>

          {/* User Account / Auth Dropdown */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-[#141F1A] transition cursor-pointer"
              >
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-8 h-8 rounded-xl object-cover border border-emerald-600 shadow-xs"
                />
                <span className="text-xs font-cairo font-bold text-zinc-800 dark:text-zinc-200 hidden lg:inline">
                  {user.full_name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {isUserMenuOpen && (
                <div
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                  className="absolute left-0 mt-2 w-52 bg-white dark:bg-[#0F1512] rounded-2xl shadow-xl border border-[#E2E8E4] dark:border-[#1A2621] p-1.5 text-xs font-cairo font-bold space-y-1 z-50 animate-in fade-in zoom-in-95"
                >
                  <div className="px-3 py-2 border-b border-[#E2E8E4] dark:border-[#1A2621]">
                    <p className="text-zinc-900 dark:text-white truncate">{user.full_name}</p>
                    <p className="text-[11px] text-zinc-400 font-mono truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenAvatarModal();
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-emerald-600" />
                    <span>تغییر تصویر نمایه</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('settings');
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition flex items-center gap-2 cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>تنظیمات حساب کاربری</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>خروج از حساب</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="open-auth-modal-header-btn"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>ورود / ثبت‌نام</span>
            </button>
          )}
        </div>
      </div>
    </header>



  );
};