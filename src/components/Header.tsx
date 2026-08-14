import React from 'react';
import { Plus, ShieldCheck, KeyRound, LogOut, User } from 'lucide-react';
import { UserProfile, AuthUser } from '../types';
import { Language, translations } from '../data/translations';

interface HeaderProps {
  profile: UserProfile;
  authUser?: AuthUser | null;
  onOpenNewTransaction: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  activeTab: string;
  lang: Language;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  authUser,
  onOpenNewTransaction,
  onOpenAuthModal,
  onLogout,
  activeTab,
  lang,
}) => {
  const t = translations[lang];
  const isFa = lang === 'fa';

  const membershipText =
    lang === 'fa'
      ? profile.membershipTier || 'کاربر کیف یار'
      : profile.membershipTier === 'کاربر ولتیار' || profile.membershipTier === 'کاربر کیف یار' || profile.membershipTier === 'کاربر سطح طلایی VIP'
      ? 'Kifyar User'
      : profile.membershipTier;

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return t.dashboardTitle;
      case 'analytics':
        return t.analyticsTitle;
      case 'transactions':
        return t.transactionsTitle;
      case 'dong':
        return t.dongTitle;
      case 'support':
        return isFa ? 'پشتیبانی، ارسال تیکت و پنل مدیریت تیکت‌ها' : 'Support Tickets & Management Panel';
      case 'profile':
        return t.profileTitle;
      default:
        return 'کیف یار | kifyar';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 lg:px-8 py-3 flex items-center justify-between transition-colors shadow-xs">
      {/* Brand & Current Tab Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold text-xl tracking-wider shadow-sm font-berlin">
          K
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base lg:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              {lang === 'fa' ? (
                <span className="font-walletyar text-2xl lg:text-3xl text-emerald-600 dark:text-emerald-400 font-normal leading-none drop-shadow-xs">
                  {t.appName}
                </span>
              ) : (
                <span className="font-berlin text-lg lg:text-xl text-slate-900 dark:text-white font-extrabold">
                  {t.appName}
                </span>
              )}
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-berlin tracking-wide">
                {t.appSubName}
              </span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {membershipText}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">{getTabTitle()}</p>
        </div>
      </div>

      {/* Actions, Auth & New Tx Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Auth Button or User Badge */}
        {authUser?.isAuthenticated ? (
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[90px] sm:max-w-[140px] truncate dir-ltr">
              {authUser.name || authUser.email}
            </span>
            {onLogout && (
              <button
                onClick={onLogout}
                title={isFa ? 'خروج' : 'Logout'}
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors mx-0.5"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all border border-slate-200 dark:border-slate-700"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">{isFa ? 'ورود / ثبت‌نام' : 'Sign In'}</span>
          </button>
        )}

        {/* Quick New Transaction Modal Button */}
        <button
          onClick={onOpenNewTransaction}
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all active:scale-95 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">{t.newTx}</span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 rtl:pr-1 rtl:border-r ltr:pl-1 ltr:border-l border-slate-200 dark:border-slate-800">
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-emerald-500/20 shrink-0"
          />
        </div>
      </div>
    </header>
  );
};
