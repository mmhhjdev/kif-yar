import React, { useState } from 'react';
import { X, Mail, Lock, User, CheckCircle2, KeyRound, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Language, translations } from '../data/translations';
import { AuthUser } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  lang: Language;
}

type EmailMode = 'login' | 'register';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  lang,
}) => {
  const t = translations[lang];
  const isFa = lang === 'fa';

  const [emailMode, setEmailMode] = useState<EmailMode>('login');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI status
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle Email Auth (Login / Register)
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg(isFa ? 'لطفاً یک آدرس ایمیل معتبر وارد کنید.' : 'Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg(isFa ? 'رمز عبور باید حداقل ۶ کاراکتر باشد.' : 'Password must be at least 6 characters.');
      return;
    }

    if (emailMode === 'register') {
      if (!fullName.trim()) {
        setErrorMsg(isFa ? 'لطفاً نام و نام خانوادگی خود را وارد کنید.' : 'Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(isFa ? 'تکرار رمز عبور با رمز عبور اصلی مطابقت ندارد.' : 'Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const authenticatedUser: AuthUser = {
        id: `usr-email-${Date.now()}`,
        email: email,
        name: fullName || email.split('@')[0],
        provider: 'email',
        isAuthenticated: true,
      };

      setSuccessMsg(
        emailMode === 'register'
          ? (isFa ? 'حساب کاربری جدید با موفقیت ایجاد شد!' : 'Account created successfully!')
          : (isFa ? 'ورود با موفقیت انجام شد.' : 'Logged in successfully.')
      );

      setTimeout(() => {
        onLoginSuccess(authenticatedUser);
        onClose();
      }, 700);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md my-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 sm:space-y-5 text-start max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 rtl:left-4 ltr:right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-all z-10"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Modal Header */}
        <div className="rtl:pr-1 ltr:pl-1">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600 shrink-0" />
            {isFa ? (
              <span className="flex items-center gap-1.5">
                ورود و ثبت‌نام در <span className="font-walletyar text-2xl text-emerald-600 dark:text-emerald-400">کیف یار</span>
              </span>
            ) : (
              <span>Sign In & Register - <span className="font-berlin text-emerald-600">Kifyar</span></span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isFa
              ? 'ورود امن با ایمیل و رمز عبور برای مدیریت هوشمند هزینه‌ها'
              : 'Secure sign in with email and password for smart budgeting'}
          </p>
        </div>

        {/* Status Alert Messages */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* EMAIL & PASSWORD AUTH FORM */}
        <div className="space-y-4">
          {/* Mode Selector (Login vs Register) */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 gap-2">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
              {emailMode === 'login'
                ? (isFa ? 'ورود با حساب کاربری' : 'Sign In with Email')
                : (isFa ? 'ثبت‌نام و ایجاد حساب جدید' : 'Create New Account')}
            </span>

            <button
              type="button"
              onClick={() => {
                setEmailMode(emailMode === 'login' ? 'register' : 'login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 underline shrink-0"
            >
              {emailMode === 'login'
                ? (isFa ? 'ایجاد حساب جدید' : 'Create an account')
                : (isFa ? 'قبلاً ثبت‌نام کرده‌اید؟' : 'Already registered?')}
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {emailMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isFa ? 'نام و نام خانوادگی:' : 'Full Name:'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isFa ? 'علی محمدی' : 'Ali Mohammadi'}
                    className="w-full rtl:pr-3 rtl:pl-9 ltr:pl-3 ltr:pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute rtl:left-2.5 ltr:right-2.5 top-2.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isFa ? 'پست الکترونیکی (ایمیل):' : 'Email Address:'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@kifyar.ir"
                  dir="ltr"
                  className="w-full rtl:pr-3 rtl:pl-9 ltr:pl-9 ltr:pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none text-start"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute rtl:left-2.5 ltr:left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isFa ? 'رمز عبور:' : 'Password:'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full rtl:pr-9 rtl:pl-9 ltr:pl-9 ltr:pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none text-start"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute rtl:right-2.5 ltr:left-2.5 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute rtl:left-2.5 ltr:right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {emailMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isFa ? 'تکرار رمز عبور:' : 'Confirm Password:'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none text-start"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute rtl:right-2.5 ltr:left-2.5 top-2.5" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-1 cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>
                  {emailMode === 'login'
                    ? (isFa ? 'ورود به حساب کاربری' : 'Sign In')
                    : (isFa ? 'ثبت‌نام و ورود' : 'Register & Enter')}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
