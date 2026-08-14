import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Target,
  LogOut,
  Save,
  CheckCircle2,
  HardDrive,
  Sun,
  Moon,
  Globe,
  Database,
  Lock,
  Sparkles,
} from 'lucide-react';
import { UserProfile, AuthUser } from '../types';
import { Language, translations } from '../data/translations';
import { isSupabaseConfigured, signOutUser, supabase } from '../lib/supabase';
import { KeyRound, Mail } from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  authUser?: AuthUser | null;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  netSavings: number;
  theme: 'light' | 'dark';
  onToggleTheme: (newTheme: 'light' | 'dark') => void;
  lang: Language;
  onToggleLang: (newLang: Language) => void;
}

const AVATAR_OPTIONS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="%23059669"/><path d="M33 36 C33 22 67 22 67 36 C60 26 40 26 33 36 Z" fill="%23022c22"/><circle cx="50" cy="42" r="17" fill="%23a7f3d0"/><path d="M33 40 C33 58 40 64 50 64 C60 64 67 58 67 40 C65 57 35 57 33 40 Z" fill="%23022c22"/><path d="M42 47 Q50 51 58 47 Q50 49 42 47 Z" fill="%23022c22"/><path d="M20 88 C25 66 36 62 50 62 C64 62 75 66 80 88 Z" fill="%23d1fae5"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="%2310b981"/><path d="M28 32 C28 16 72 16 72 32 C74 52 68 62 68 62 C68 62 62 48 50 48 C38 48 32 62 32 62 C32 62 26 52 28 32 Z" fill="%23064e3b"/><circle cx="50" cy="40" r="16" fill="%23a7f3d0"/><path d="M20 88 C24 68 36 63 50 63 C64 63 76 68 80 88 Z" fill="%23ecfdf5"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="%23047857"/><path d="M32 34 C32 20 68 20 68 34 Z" fill="%23022c22"/><circle cx="50" cy="42" r="17" fill="%23a7f3d0"/><path d="M33 42 C33 60 41 65 50 65 C59 65 67 60 67 42 C64 58 36 58 33 42 Z" fill="%23022c22"/><circle cx="42" cy="38" r="4.5" fill="none" stroke="%23022c22" stroke-width="2"/><circle cx="58" cy="38" r="4.5" fill="none" stroke="%23022c22" stroke-width="2"/><line x1="46.5" y1="38" x2="53.5" y2="38" stroke="%23022c22" stroke-width="2"/><path d="M20 88 C25 67 36 63 50 63 C64 63 75 67 80 88 Z" fill="%23d1fae5"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="%230d9488"/><path d="M34 32 C34 20 44 16 50 16 C56 16 66 20 66 32 C60 26 40 26 34 32 Z" fill="%23115e59"/><circle cx="50" cy="41" r="17" fill="%23ccfbf1"/><path d="M20 88 C24 67 36 62 50 62 C64 62 76 67 80 88 Z" fill="%23f0fdf4"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="%230f766e"/><path d="M30 30 C30 16 70 16 70 30 C72 45 68 56 68 56 C68 56 62 46 50 46 C38 46 32 56 32 56 Z" fill="%23042f2e"/><circle cx="50" cy="41" r="16" fill="%2399f6e4"/><path d="M20 88 C25 68 36 63 50 63 C64 63 75 68 80 88 Z" fill="%23f0fdf4"/></svg>',
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  authUser: propAuthUser,
  onUpdateProfile,
  onOpenAuthModal,
  onLogout,
  netSavings,
  theme,
  onToggleTheme,
  lang,
  onToggleLang,
}) => {
  const t = translations[lang];
  const isFa = lang === 'fa';
  const initialName =
    lang === 'en' && (profile.name === 'کاربر ولتیار' || !profile.name)
      ? 'WalletYar User'
      : profile.name;
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(profile.email);
  const [goalAmount, setGoalAmount] = useState(profile.monthlyGoal.toString());
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [isSaved, setIsSaved] = useState(false);
  const [supaAuthUser, setSupaAuthUser] = useState<any>(null);

  const currentAuthUser = propAuthUser?.isAuthenticated ? propAuthUser : (supaAuthUser ? {
    id: supaAuthUser.id,
    email: supaAuthUser.email,
    name: supaAuthUser.user_metadata?.full_name || supaAuthUser.email?.split('@')[0],
    provider: 'google' as const,
    isAuthenticated: true
  } : null);

  useEffect(() => {
    if (lang === 'en' && name === 'کاربر ولتیار') {
      setName('WalletYar User');
    } else if (lang === 'fa' && name === 'WalletYar User') {
      setName('کاربر ولتیار');
    }
  }, [lang]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) setSupaAuthUser(data.user);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSupaAuthUser(session?.user || null);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const numGoal = parseFloat(goalAmount.replace(/,/g, ''));
    onUpdateProfile({
      name,
      email,
      avatarUrl,
      monthlyGoal: isNaN(numGoal) || numGoal <= 0 ? 20000000 : numGoal,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const goalPercent = Math.min(Math.round((netSavings / profile.monthlyGoal) * 100), 100);
  const formatNum = (num: number) => num.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');

  const membershipText =
    lang === 'fa'
      ? profile.membershipTier || 'کاربر ولتیار'
      : profile.membershipTier === 'کاربر ولتیار' || profile.membershipTier === 'کاربر سطح طلایی VIP'
      ? 'WalletYar User'
      : profile.membershipTier;

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-5xl mx-auto transition-colors">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            {lang === 'fa' ? (
              <span>پنل تنظیمات پیشرفته <span className="font-walletyar font-normal text-2xl text-emerald-600 dark:text-emerald-400 mx-1">ولتیار</span></span>
            ) : (
              t.settingsPanelTitle
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.settingsPanelDesc}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          {membershipText}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 columns: Settings Controls & Profile */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ADVANCED SETTINGS PANEL */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              {t.settingsTitle}
            </h3>

            {/* 1. Dark / Light Mode Switcher */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-teal-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  {t.themeMode}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {theme === 'dark' ? t.darkMode : t.lightMode}
                </div>
              </div>

              <div className="flex items-center p-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onToggleTheme('light')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    theme === 'light'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  {t.lightMode}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleTheme('dark')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    theme === 'dark'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  {t.darkMode}
                </button>
              </div>
            </div>

            {/* 2. Language Switcher (Persian / English) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  {t.languageSwitch}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'fa' ? 'فارسی (RTL)' : 'English (LTR)'}
                </div>
              </div>

              <div className="flex items-center p-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onToggleLang('fa')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    lang === 'fa'
                      ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  فارسی
                </button>

                <button
                  type="button"
                  onClick={() => onToggleLang('en')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    lang === 'en'
                      ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* 3. Authentication Panel (Email & Password) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" />
                    {isFa ? (
                      <span>احراز هویت و حساب کاربری <span className="font-walletyar font-normal text-lg text-emerald-600 dark:text-emerald-400 mx-1">ولتیار</span></span>
                    ) : (
                      'WalletYar Account Authentication'
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isFa
                      ? 'ورود و ثبت‌نام سریع و امن با آدرس ایمیل و رمز عبور'
                      : 'Sign in or register securely via Email & Password'}
                  </div>
                </div>

                {currentAuthUser ? (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold dir-ltr self-start sm:self-auto max-w-[200px] truncate">
                    {currentAuthUser.email || currentAuthUser.name}
                  </span>
                ) : null}
              </div>

              <div>
                {currentAuthUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onLogout) onLogout();
                      signOutUser();
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all flex items-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-900/60 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.logout}
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={onOpenAuthModal}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>{isFa ? 'ورود و ثبت‌نام با ایمیل' : 'Sign In with Email'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Profile Details Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              {t.userProfileDetails}
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  {t.chooseAvatar}
                </label>
                <div className="flex items-center gap-3">
                  {AVATAR_OPTIONS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative rounded-full overflow-hidden transition-all ${
                        avatarUrl === url
                          ? 'ring-2 ring-emerald-600 scale-105'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${idx}`} className="w-11 h-11 object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.fullName}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.savingsGoalInput}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white font-bold font-tabular text-sm outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {t.toman}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                {isSaved && (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {t.savedSuccessfully}
                  </span>
                )}
                <button
                  type="submit"
                  className="mr-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>

          {/* Monthly Savings Progress Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                {t.savingsProgress}
              </h3>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-tabular">% {formatNum(goalPercent)}</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${goalPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">{lang === 'fa' ? 'پس‌انداز محقق‌شده:' : 'Achieved Savings:'}</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 font-tabular text-sm">
                  {formatNum(netSavings)} {t.toman}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">{lang === 'fa' ? 'هدف تعیین‌شده:' : 'Set Target:'}</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 font-tabular text-sm">
                  {formatNum(profile.monthlyGoal)} {t.toman}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Legal Copyright */}
        <div className="space-y-6">
          {/* Legal Copyright Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              {lang === 'fa' ? 'حقوق مالکیت معنوی (Copyright)' : 'Intellectual Property (Copyright)'}
            </h3>

            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-2">
              <p dir="rtl" className="font-extrabold text-slate-800 dark:text-slate-200">
                {lang === 'fa' ? (
                  <span>تمامی حقوق مادی و معنوی این سایت متعلق به <span className="font-walletyar text-base text-emerald-600 dark:text-emerald-400 mx-1">ولتیار</span> (wallet-yar) است.</span>
                ) : (
                  t.copyrightFa
                )}
              </p>
              <p dir="ltr" className="font-sans text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                {t.copyrightEn}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
