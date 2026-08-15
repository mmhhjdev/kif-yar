import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Sun,
  Moon,
  PlusCircle,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  Users,
  CalendarCheck,
  Receipt,
  Settings,
  ChevronDown,
  Sparkles,
  Wallet,
  Camera,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { AvatarModal } from './AvatarModal';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  onOpenTransactionModal: () => void;
  onOpenReminderModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTransactionModal, onOpenReminderModal }) => {
  const {
    user,
    isAuthenticated,
    isAuthModalOpen,
    setIsAuthModalOpen,
    logout,
    isDarkMode,
    toggleDarkMode,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    settleNotification,
    setActiveTab,
    navigateToSupportWithTicket,
    adminMode,
    setAdminMode,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'budget_alert':
        return <AlertTriangle className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />;
      case 'debt_reminder':
        return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'check_due':
        return <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'bill_reminder':
        return <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#090D0B]/95 backdrop-blur-md border-b border-[#E2E8E4] dark:border-[#1A2621] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Right side: Brand & Logo */}
        <div className="flex items-center gap-3">
          <button
            id="brand-logo-btn"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-right group focus:outline-none cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-800 dark:group-hover:bg-emerald-500 transition duration-200">
              <span className="font-brand font-bold text-xl select-none">ک</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-brand text-2xl font-bold tracking-tight text-[#090D0B] dark:text-[#F8FAF9]">
                  کیفیار
                </span>
                <span className="font-cairo text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 dark:bg-[#121F19] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
                  kifyar
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block -mt-1 font-vazir font-normal hidden sm:block">
                سامانه مدیریت مالی و حسابداری
              </span>
            </div>
          </button>
        </div>

        {/* Center / Left side: Quick actions, Notifications, Support shortcut & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Transaction Button */}
          <button
            id="quick-add-tx-btn"
            onClick={onOpenTransactionModal}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-cairo font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ثبت تراکنش</span>
          </button>

          {/* Support Shortcut Button */}
          <button
            id="header-support-shortcut-btn"
            onClick={() => navigateToSupportWithTicket()}
            title="مرکز پشتیبانی و تیکت‌ها"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-cairo font-bold bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 dark:bg-[#121F19] dark:hover:bg-[#1A2E25] dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/50 transition cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span className="hidden sm:inline">پشتیبانی</span>
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'}
            className="p-2.5 rounded-xl text-zinc-700 dark:text-zinc-200 bg-white hover:bg-emerald-50 dark:bg-[#0F1512] dark:hover:bg-[#16201B] border border-[#E2E8E4] dark:border-[#1A2621] transition cursor-pointer"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-emerald-400" />
            ) : (
              <Moon className="w-4 h-4 text-emerald-800" />
            )}
          </button>

          {/* Notifications Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              id="notifications-bell-btn"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              title="اعلان‌ها و یادآورهای هوشمند مالی"
              className="relative p-2.5 rounded-xl text-zinc-700 dark:text-zinc-200 bg-white hover:bg-emerald-50 dark:bg-[#0F1512] dark:hover:bg-[#16201B] border border-[#E2E8E4] dark:border-[#1A2621] transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold font-vazir flex items-center justify-center">
                  {toPersianDigits(unreadNotificationsCount)}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {isNotifOpen && (
              <div
                id="notifications-dropdown-menu"
                className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0F1512] rounded-2xl shadow-xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="p-3.5 bg-emerald-50/50 dark:bg-[#141C18] border-b border-[#E2E8E4] dark:border-[#1A2621] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <h4 className="font-cairo text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      اعلان‌ها و یادآورهای مالی ({toPersianDigits(unreadNotificationsCount)})
                    </h4>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] font-vazir font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      خواندن همه
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8E4] dark:divide-[#1A2621] p-1 font-vazir">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                      هیچ اعلانی ثبت نشده است.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-3 rounded-xl transition cursor-pointer text-right flex items-start gap-2.5 ${
                          !n.is_read
                            ? 'bg-emerald-50/40 dark:bg-[#131E19]'
                            : 'hover:bg-zinc-50 dark:hover:bg-[#131A16] opacity-80'
                        }`}
                      >
                        <div className="mt-0.5">{getNotifIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-cairo font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>

                          {/* Extra info for debt/check */}
                          {(n.amount || n.due_date || n.person_name) && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                              {n.amount && (
                                <span className="font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-[#121F19] px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-900/40">
                                  {formatToman(n.amount)}
                                </span>
                              )}
                              {n.due_date && (
                                <span className="text-zinc-500 dark:text-zinc-400">
                                  موعد: {toPersianDigits(n.due_date)}
                                </span>
                              )}
                              {n.person_name && (
                                <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                                  طرف حساب: {n.person_name}
                                </span>
                              )}
                              {n.status === 'pending' && n.type === 'debt_reminder' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    settleNotification(n.id);
                                  }}
                                  className="mr-auto text-[10px] font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded hover:bg-emerald-200 cursor-pointer"
                                >
                                  تسویه شد
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-emerald-50/50 dark:bg-[#141C18] border-t border-[#E2E8E4] dark:border-[#1A2621] flex items-center justify-between text-xs font-cairo">
                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      onOpenReminderModal();
                    }}
                    className="text-emerald-800 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    افزودن یادآور دنگ یا چک
                  </button>
                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      setActiveTab('reminders');
                    }}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
                  >
                    مشاهده همه
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Authentication Menu */}
          {isAuthenticated ? (
            <div className="relative" ref={profileRef}>
              <button
                id="profile-dropdown-btn"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-emerald-50 dark:hover:bg-[#121F19] transition cursor-pointer"
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAvatarModalOpen(true);
                    setIsProfileMenuOpen(false);
                  }}
                  title="تغییر تصویر پروفایل"
                  className="w-8 h-8 rounded-full ring-2 ring-emerald-600/40 hover:ring-emerald-500 overflow-hidden bg-emerald-100 dark:bg-[#121F19] flex items-center justify-center text-xs font-bold text-emerald-900 dark:text-emerald-300 font-cairo shadow-xs transition hover:scale-105"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    user.full_name.charAt(0)
                  )}
                </div>
                <span className="text-xs font-cairo font-semibold text-zinc-800 dark:text-zinc-200 hidden lg:inline max-w-[100px] truncate">
                  {user.full_name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden lg:inline" />
              </button>

              {isProfileMenuOpen && (
                <div
                  id="profile-dropdown-menu"
                  className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 bg-white dark:bg-[#0F1512] rounded-2xl shadow-xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="p-4 border-b border-[#E2E8E4] dark:border-[#1A2621] bg-emerald-50/30 dark:bg-[#121F19] flex items-center gap-3">
                    <div
                      onClick={() => {
                        setIsAvatarModalOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      title="تغییر تصویر پروفایل"
                      className="relative w-11 h-11 rounded-full ring-2 ring-emerald-600/30 overflow-hidden bg-emerald-100 dark:bg-[#15241C] shrink-0 cursor-pointer group"
                    >
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-cairo font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{user.full_name}</p>
                      <p className="text-xs font-vazir text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{user.email}</p>
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-[10px] font-bold font-cairo">
                        واحد پول: {user.currency}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 space-y-1 font-cairo">
                    <button
                      onClick={() => {
                        setIsAvatarModalOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#121F19] transition cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      تغییر و آپلود تصویر پروفایل
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setActiveTab('settings');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-[#121F19] transition cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      حساب کاربری و تنظیمات
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        navigateToSupportWithTicket();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-[#121F19] transition cursor-pointer"
                    >
                      <LifeBuoy className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      مرکز تیکت و پشتیبانی کیفیار
                    </button>

                    <button
                      onClick={() => {
                        setAdminMode(!adminMode);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-[#121F19] transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        پنل پشتیبان (Admin Mode)
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          adminMode
                            ? 'bg-emerald-700 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {adminMode ? 'فعال' : 'غیرفعال'}
                      </span>
                    </button>

                    <div className="border-t border-[#E2E8E4] dark:border-[#1A2621] my-1" />

                    {/* Logout Button */}
                    <button
                      id="logout-btn-header"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>خروج از حساب کاربری</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="login-btn-header"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-cairo font-bold shadow-xs transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>ورود / ثبت‌نام با ایمیل</span>
            </button>
          )}
        </div>
      </div>

      {/* Avatar Picker & Upload Modal */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </header>
  );
};
