import React from 'react';
import { LogIn, UserPlus, X, Sparkles, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AuthGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const AuthGuardModal: React.FC<AuthGuardModalProps> = ({
  isOpen,
  onClose,
  message = 'برای خرید اشتراک و استفاده از امکانات، لطفاً ابتدا ثبت‌نام کنید یا وارد حساب خود شوید.',
}) => {
  const { setIsAuthModalOpen } = useApp();

  if (!isOpen) return null;

  const handleOpenAuth = () => {
    onClose();
    setIsAuthModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in font-cairo">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#090F0C] border border-amber-500/40 p-6 sm:p-7 shadow-2xl shadow-emerald-950/80 text-right"
        dir="rtl"
      >
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/40 flex items-center justify-center mb-5">
          <Sparkles className="w-7 h-7 text-amber-400" />
        </div>

        {/* Title with Bahman Font */}
        <h3 className="font-bahman text-xl sm:text-2xl font-black text-white mb-3">
          ورود یا ثبت‌نام در چندبوم
        </h3>

        {/* Required Message */}
        <p className="text-zinc-300 text-sm leading-relaxed mb-6 font-medium">
          {message}
        </p>

        {/* Trust Note */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/80 border border-emerald-900/40 text-xs text-emerald-400 mb-6">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>عضویت در چندبوم در کمتر از ۱ دقیقه و با امنیت کامل انجام می‌شود.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleOpenAuth}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>ثبت‌نام یا ورود به حساب کاربری</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition cursor-pointer"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
