import React from 'react';
import { X, Crown, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from './context/AppContext';
import { SUBSCRIPTION_PLANS } from './data/initialData';
import { formatToman } from './utils/formatters';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { setActiveTab, isAuthenticated, openAuthGuard } = useApp();

  if (!isOpen) return null;

  const handleGoToSubscription = () => {
    onClose();
    if (!isAuthenticated) {
      openAuthGuard('برای خرید اشتراک و استفاده از امکانات، لطفاً ابتدا ثبت‌نام کنید یا وارد حساب خود شوید.');
    } else {
      setActiveTab('subscription');
    }
  };

  const proPlan = SUBSCRIPTION_PLANS.find((p) => p.isPopular) || SUBSCRIPTION_PLANS[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-cairo">
      <div className="w-full max-w-md bg-[#0D1310] rounded-3xl shadow-2xl border border-amber-500/40 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-right" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="font-bahman text-xl font-bold text-white">
            ارتقا به اشتراک طلایی <span className="text-amber-400 font-brand">چندبوم پرو</span>
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            برای استفاده از هوش مصنوعی چندبوم جهت تحلیل ۳ ماه آینده، ثبت نامحدود تراکنش‌ها و پشتیبانی VIP، اشتراک خود را ارتقا دهید.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
          <div className="flex justify-between items-center text-xs font-cairo">
            <span className="font-bold text-amber-200">{proPlan.nameFa}</span>
            <span className="font-black text-amber-400 text-sm">
              {formatToman(proPlan.price)}
            </span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-zinc-300">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> تحلیل هوشمند ۳ ماه آینده با هوش مصنوعی چندبوم
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> هشدار پیش‌بینی اتمام سقف بودجه
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> پرداخت مستقیم و ثبت کارت به کارت بانکی
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-cairo font-bold text-zinc-400 hover:bg-zinc-900 transition cursor-pointer"
          >
            فعلاً نه
          </button>
          <button
            onClick={handleGoToSubscription}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 text-xs font-cairo font-black shadow-md shadow-amber-950/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>مشاهده پلن‌ها و خرید</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
