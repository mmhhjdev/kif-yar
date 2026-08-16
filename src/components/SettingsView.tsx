import React, { useState, useEffect } from 'react';
import {
  User,
  Settings as SettingsIcon,
  LifeBuoy,
  Moon,
  Sun,
  Check,
  Save,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  Camera,
  Upload,
  LogIn,
  LogOut,
  Mail,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatToman } from '../utils/formatters';
import { MALE_AVATAR_SVG, FEMALE_AVATAR_SVG } from '../utils/avatars';
import { AvatarModal } from './AvatarModal';

export const SettingsView: React.FC = () => {
  const {
    user,
    updateUserProfile,
    isAuthenticated,
    setIsAuthModalOpen,
    logout,
    isDarkMode,
    toggleDarkMode,
    navigateToSupportWithTicket,
    resetToInitialData,
    tickets,
  } = useApp();

  // Profile Edit State (Strictly NO phone field)
  const [fullName, setFullName] = useState(user.full_name);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || MALE_AVATAR_SVG);
  const [budgetCap, setBudgetCap] = useState(user.monthly_budget_cap.toString());
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    setFullName(user.full_name);
    setEmail(user.email);
    setBudgetCap(user.monthly_budget_cap.toString());
    if (user.avatar_url) {
      setAvatarUrl(user.avatar_url);
    }
  }, [user]);

  // Save Profile Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const capNum = parseInt(budgetCap, 10) || 0;
    updateUserProfile({
      full_name: fullName.trim(),
      email: email.trim(),
      avatar_url: avatarUrl.trim() || undefined,
      monthly_budget_cap: capNum,
    });
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Card */}
      <div className="bg-white dark:bg-[#0F1512] p-6 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            تنظیمات و حساب کاربری کیفیار
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-vazir">
            مدیریت اطلاعات کاربری، نشست‌های فعال، سقف بودجه و شخصی‌سازی سامانه
          </p>
        </div>

        {/* Quick Ticket Support Link */}
        <button
          id="settings-support-link-btn"
          onClick={() => navigateToSupportWithTicket()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-[#14231C] dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-[#1B2F25] text-xs font-cairo font-bold transition border border-emerald-200/50 dark:border-emerald-900/40 cursor-pointer self-start md:self-auto"
        >
          <LifeBuoy className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span>مرکز پشتیبانی و تیکت‌ها ({tickets.length})</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 2. User Profile Card */}
      <div className="bg-white dark:bg-[#0F1512] p-6 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E2E8E4] dark:border-[#1A2621] pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
              مشخصات کاربری و تصویر پروفایل
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-[#162D22] dark:text-emerald-300 font-cairo font-bold">
            {user.role === 'admin' ? 'مدیر سیستم' : 'کاربر کیفیار'}
          </span>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-zinc-50 dark:bg-[#121A16] border border-[#E2E8E4] dark:border-[#1A2621]">
          <div
            onClick={() => setIsAvatarModalOpen(true)}
            className="relative w-20 h-20 rounded-full ring-3 ring-emerald-600/40 hover:ring-emerald-500 overflow-hidden bg-emerald-100 dark:bg-[#162B21] shrink-0 cursor-pointer group shadow-sm transition"
            title="کلیک برای انتخاب یا آپلود عکس پروفایل"
          >
            <img
              src={avatarUrl}
              alt={user.full_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition">
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-cairo font-bold">تغییر عکس</span>
            </div>
          </div>

          <div className="flex-1 text-center sm:text-right space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300">
                آواتارهای وکتور پیش‌فرض:
              </span>
              <button
                type="button"
                onClick={() => {
                  setAvatarUrl(MALE_AVATAR_SVG);
                  updateUserProfile({ avatar_url: MALE_AVATAR_SVG });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-cairo font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  user.avatar_url === MALE_AVATAR_SVG
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-600 dark:bg-[#162D22] dark:text-emerald-300 ring-1 ring-emerald-600'
                    : 'bg-white dark:bg-[#0F1512] text-zinc-700 dark:text-zinc-300 border-[#E2E8E4] dark:border-[#1F2E27] hover:border-zinc-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                  <img src={MALE_AVATAR_SVG} alt="مرد" className="w-full h-full" />
                </div>
                <span>وکتور مرد</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAvatarUrl(FEMALE_AVATAR_SVG);
                  updateUserProfile({ avatar_url: FEMALE_AVATAR_SVG });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-cairo font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  user.avatar_url === FEMALE_AVATAR_SVG
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-600 dark:bg-[#162D22] dark:text-emerald-300 ring-1 ring-emerald-600'
                    : 'bg-white dark:bg-[#0F1512] text-zinc-700 dark:text-zinc-300 border-[#E2E8E4] dark:border-[#1F2E27] hover:border-zinc-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                  <img src={FEMALE_AVATAR_SVG} alt="زن" className="w-full h-full" />
                </div>
                <span>وکتور زن</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-cairo font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>آپلود تصویر شخصی</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-vazir">
              برای بارگذاری عکس دلخواه از کامپیوتر یا گوشی خود، روی آواتار یا دکمه آپلود کلیک کنید.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                نام و نام خانوادگی *
              </label>
              <input
                id="profile-name-input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                آدرس ایمیل حساب کاربری *
              </label>
              <input
                id="profile-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none text-left dir-ltr"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly Budget Cap */}
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                سقف بودجه ماهانه (تومان) *
              </label>
              <input
                id="profile-budget-input"
                type="number"
                value={budgetCap}
                onChange={(e) => setBudgetCap(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none text-left dir-ltr font-vazir"
                required
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block font-vazir">
                معادل: {formatToman(parseInt(budgetCap, 10) || 0)}
              </span>
            </div>

            {/* Currency (Read only) */}
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                واحد پول سیستم
              </label>
              <input
                type="text"
                value="تومان ایران"
                disabled
                className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-[#111815] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-600 dark:text-zinc-400 cursor-not-allowed font-vazir"
              />
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/60 dark:bg-[#121F19] rounded-xl border border-emerald-200/50 dark:border-emerald-900/40 text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>حریم خصوصی کامل:</strong> در سامانه کیفیار نیازی به ثبت شماره تلفن همراه نیست و احراز هویت مستقیماً با ایمیل کاربری انجام می‌شود.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSavedToast ? (
              <span className="text-xs font-cairo font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" />
                اطلاعات پروفایل با موفقیت ذخیره شد.
              </span>
            ) : <span />}

            <button
              id="save-profile-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-cairo font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>ذخیره تغییرات پروفایل</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Account & Session Management (Login / Logout / Switch) */}
      <div className="bg-white dark:bg-[#0F1512] p-6 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8E4] dark:border-[#1A2621] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
              مدیریت نشست و امنیت حساب کاربری
            </h3>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-cairo font-bold ${
              isAuthenticated
                ? 'bg-emerald-100 text-emerald-900 dark:bg-[#162D22] dark:text-emerald-300'
                : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
            }`}
          >
            {isAuthenticated ? 'نشست فعال' : 'خروج از حساب'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-[#121A16] border border-[#E2E8E4] dark:border-[#1A2621]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300">
                ایمیل حساب متصل:
              </span>
              <span className="text-xs font-vazir text-zinc-900 dark:text-zinc-100 font-semibold dir-ltr">
                {user.email}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-vazir">
              وضعیت: {isAuthenticated ? 'وارد شده و دسترسی کامل به پنل' : 'کاربر مهمان'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="switch-account-btn"
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-cairo font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>{isAuthenticated ? 'ورود با ایمیل دیگر' : 'ورود به حساب کاربری'}</span>
            </button>

            {isAuthenticated && (
              <button
                id="logout-btn-settings"
                type="button"
                onClick={() => {
                  if (confirm('آیا از خروج از حساب کاربری اطمینان دارید؟')) {
                    logout();
                  }
                }}
                className="px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 font-cairo font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از حساب کاربری</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Appearance & System Reset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <div className="bg-white dark:bg-[#0F1512] p-6 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E8E4] dark:border-[#1A2621] pb-3">
            <SettingsIcon className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
              تنظیمات تم و ظاهر رابط کاربری
            </h3>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            انتخاب تم روشن (سفید/سبز) یا تاریک (مشکی/سبز) با ذخیره‌سازی خودکار در مرورگر
          </p>

          <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#141E1A] rounded-xl border border-[#E2E8E4] dark:border-[#1F2E27]">
            <span className="text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300">
              حالت تم: {isDarkMode ? 'تاریک (مشکی و سبز)' : 'روشن (سفید و سبز)'}
            </span>
            <button
              onClick={toggleDarkMode}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-cairo font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>تغییر حالت تم</span>
            </button>
          </div>
        </div>

        {/* Data Reset */}
        <div className="bg-white dark:bg-[#0F1512] p-6 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E8E4] dark:border-[#1A2621] pb-3">
            <RotateCcw className="w-5 h-5 text-zinc-500" />
            <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
              بازنشانی داده‌های نمونه
            </h3>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            در صورت نیاز می‌توانید داده‌های مالی، تیکت‌ها و یادآورها را به حالت اولیه بازنشانی فرمایید.
          </p>

          <button
            id="reset-sample-data-btn"
            onClick={() => {
              if (confirm('آیا از بازنشانی داده‌های نمونه مطمئن هستید؟')) {
                resetToInitialData();
              }
            }}
            className="w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#16221D] text-xs font-cairo font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>بازنشانی به داده‌های اولیه کیفیار</span>
          </button>
        </div>
      </div>

      {/* Avatar Modal */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />
    </div>
  );
};
