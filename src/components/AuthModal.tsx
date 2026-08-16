import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  MailCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEFAULT_AVATARS, MALE_AVATAR_SVG } from '../utils/avatars';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithEmail, registerWithEmail } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(MALE_AVATAR_SVG);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validateEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setConfirmationNotice(false);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('لطفاً آدرس ایمیل خود را وارد نمایید.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setError('فرمت آدرس ایمیل وارد شده معتبر نمی‌باشد (مثال: user@example.com).');
      return;
    }

    if (!password || password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (mode === 'register' && !fullName.trim()) {
      setError('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await loginWithEmail(cleanEmail, password);
        if (res.success) {
          setSuccessMsg('با موفقیت وارد حساب کاربری خود شدید.');
          setTimeout(() => {
            setLoading(false);
            onClose();
          }, 800);
        } else {
          setError(res.error || 'ورود ناموفق بود. لطفاً ایمیل و رمز عبور را بررسی نمایید.');
          setLoading(false);
        }
      } else {
        const res = await registerWithEmail(cleanEmail, fullName.trim(), password, selectedAvatar);
        if (res.success) {
          if (res.requiresEmailConfirmation) {
            setConfirmationNotice(true);
            setSuccessMsg('ایمیل تایید برای شما ارسال شد. لطفاً صندوق ورودی ایمیل خود را بررسی فرمایید.');
            setLoading(false);
          } else {
            setSuccessMsg('حساب کاربری شما در سوپابیس با موفقیت ساخته شد و وارد شدید.');
            setTimeout(() => {
              setLoading(false);
              onClose();
            }, 800);
          }
        } else {
          setError(res.error || 'خطایی در ثبت‌نام رخ داد. لطفاً مجدداً تلاش کنید.');
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'خطایی در پردازش اطلاعات رخ داد.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto font-vazir">
      <div
        id="auth-modal-card"
        className="relative my-auto w-full max-w-md bg-white dark:bg-[#0F1512] rounded-2xl shadow-2xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#1A2621] bg-emerald-50/40 dark:bg-[#121F19] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-800 text-white dark:bg-emerald-600">
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {mode === 'login' ? 'ورود به حساب کاربری' : 'ایجاد حساب کاربری جدید'}
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-vazir">
                سامانه مدیریت مالی <span className="font-brand text-emerald-800 dark:text-emerald-400">کیفیار</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E2E8E4] dark:border-[#1A2621] p-1.5 bg-zinc-50 dark:bg-[#0D1411] shrink-0">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMsg(null);
              setConfirmationNotice(false);
            }}
            className={`flex-1 py-2 text-xs font-cairo font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white dark:bg-[#15241C] text-emerald-900 dark:text-emerald-300 shadow-xs border border-[#E2E8E4] dark:border-[#1F3127]'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>ورود با ایمیل</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setSuccessMsg(null);
              setConfirmationNotice(false);
            }}
            className={`flex-1 py-2 text-xs font-cairo font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white dark:bg-[#15241C] text-emerald-900 dark:text-emerald-300 shadow-xs border border-[#E2E8E4] dark:border-[#1F3127]'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>ثبت‌نام در کیفیار</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && !confirmationNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {confirmationNotice && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-cairo font-bold text-sm text-emerald-800 dark:text-emerald-300">
                <MailCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>ایمیل تایید ارسال شد</span>
              </div>
              <p className="leading-relaxed font-vazir">
                لینک تایید حساب کاربری به ایمیل <strong>{email}</strong> ارسال شد. لطفاً صندوق ورودی (یا پوشه Spam) ایمیل خود را بررسی نموده و روی لینک تایید کلیک کنید، سپس می‌توانید وارد شوید.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setConfirmationNotice(false);
                  setError(null);
                }}
                className="mt-2 w-full py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs transition cursor-pointer"
              >
                رفتن به صفحه ورود
              </button>
            </div>
          )}

          {!confirmationNotice && (
            <>
              {mode === 'register' && (
                <>
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      نام و نام خانوادگی *
                    </label>
                    <input
                      id="auth-name-input"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: علی رضایی"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
                      required
                    />
                  </div>

                  {/* Avatar Selection */}
                  <div>
                    <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      انتخاب آواتار وکتور پیش‌فرض:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {DEFAULT_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatar(av.url)}
                          className={`p-2 rounded-xl border flex items-center gap-2 text-right transition cursor-pointer ${
                            selectedAvatar === av.url
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-[#162B21] dark:text-emerald-200 ring-1 ring-emerald-600'
                              : 'border-[#E2E8E4] dark:border-[#1F2E27] bg-zinc-50 dark:bg-[#141E1A] text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-white">
                            <img src={av.url} alt={av.label} className="w-full h-full" />
                          </div>
                          <span className="text-xs font-cairo font-bold">{av.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  آدرس ایمیل *
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none text-left dir-ltr font-vazir"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  رمز عبور (حداقل ۶ کاراکتر) *
                </label>
                <input
                  id="auth-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none text-left dir-ltr"
                  required
                />
              </div>

              <div className="p-3 bg-emerald-50/50 dark:bg-[#121F19] rounded-xl border border-emerald-200/40 dark:border-emerald-900/40 text-[11px] text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>احراز هویت و ذخیره‌سازی داده‌ها مستقیماً با دیتابیس Supabase انجام می‌شود.</span>
              </div>

              {/* Submit Button */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-cairo font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>در حال برقراری ارتباط با سوپابیس...</span>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ورود به حساب کاربری</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>ثبت‌نام در کیفیار</span>
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
