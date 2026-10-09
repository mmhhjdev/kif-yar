import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  CreditCard,
  Clock,
  ArrowRight,
  Gift,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBSCRIPTION_PLANS, BANK_CARD_CONFIG } from '../data/initialData';
import { SubscriptionPlan } from '../types';
import { formatToman, formatShamsiDate } from '../utils/formatters';
import { calculateRemainingProDays } from '../utils/security';
import { CheckoutModal } from './CheckoutModal';

export const SubscriptionView: React.FC = () => {
  const { user, isProUser, manualPayments, isAuthenticated, openAuthGuard } = useApp();
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [activePlanId, setActivePlanId] = useState<string>('pro-3m');

  // Check user pending payment or pending_approval status
  const pendingPayment = manualPayments.find(
    (p) => (p.user_id === user.id || p.user_email === user.email) && p.status === 'pending'
  );
  const isPendingReview = user.subscription_status === 'pending_approval' || Boolean(pendingPayment);

  const remainingPro = calculateRemainingProDays(user.subscription_expires_at);

  return (
    <div className="space-y-8 animate-in fade-in duration-200 font-cairo pb-12">
      {/* Top Banner - Luxurious Golden & Dark Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1505] via-[#241D09] to-[#0A0D0B] border-2 border-amber-500/40 p-6 sm:p-10 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-cairo font-bold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>ارتقای اختصاصی به اشتراک طلایی چندبوم (پرو)</span>
          </div>

          <h2 className="font-cairo text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            حساب اختصاصی و اشتراک طلایی <span className="text-amber-400 font-brand">چندبوم پرو</span>
          </h2>

          <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed max-w-xl">
            با تهیه اشتراک طلایی، به هوش مصنوعی چندبوم جهت ثبت سریع تراکنش‌ها، تحلیل پیشرفته چندماهه بودجه، یادآورهای نامحدود اقساط و محاسبه نامحدود دنگ سفر دسترسی پیدا کنید.
          </p>

          {isProUser && remainingPro.isActive ? (
            <div className="inline-flex items-center gap-3.5 p-3.5 rounded-2xl bg-amber-500/15 backdrop-blur-xs border border-amber-400/50 text-xs">
              <Crown className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <p className="font-cairo font-bold text-amber-200">اشتراک طلایی شما فعال است</p>
                <p className="text-white font-cairo text-[11px] font-bold mt-0.5">
                  مانده حساب پرو: {remainingPro.humanText} (تا {remainingPro.formattedDate || formatShamsiDate(user.subscription_expires_at || '')})
                </p>
              </div>
            </div>
          ) : isPendingReview ? (
            <div className="inline-flex items-center gap-3 p-4 rounded-2xl bg-amber-500/25 backdrop-blur-xs border-2 border-amber-400 text-xs text-amber-200 shadow-lg">
              <Clock className="w-6 h-6 text-amber-300 shrink-0 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-cairo font-black text-sm text-amber-300">
                    حساب طلایی در حال بررسی
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-zinc-950 font-bold">
                    در صف تایید مدیریت
                  </span>
                </div>
                <p className="text-[11px] text-amber-100 mt-1">
                  {pendingPayment?.tracking_code
                    ? `کد پیگیری: ${pendingPayment.tracking_code} • فیش شما در حال راستی‌آزمایی با صورتحساب بانکی است.`
                    : 'درخواست ارتقای حساب شما ثبت شده و ظرف حداکثر ۱۵ دقیقه فعال خواهد شد.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-amber-200/90">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> کارت به کارت مستقیم به بانک سامان
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> ثبت فیش و صدور کد پیگیری اختصاصی
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> فعال‌سازی هوش مصنوعی تحلیلی
              </span>
            </div>
          )}
        </div>

        {/* Golden glow decorations */}
        <div className="absolute left-[-10%] top-[-30%] w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-[-10%] bottom-[-30%] w-96 h-96 rounded-full bg-yellow-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* Pricing Cards Grid (1m, 3m, 6m) - Dynamic Black-Gold on selected card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isSelected = activePlanId === plan.id;

          return (
            <div
              key={plan.id}
              onClick={() => setActivePlanId(plan.id)}
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-[#1C170A] via-[#241D09] to-[#120F06] border-2 border-amber-500 shadow-2xl shadow-amber-950/40 -translate-y-2 ring-2 ring-amber-400/40 text-white'
                  : 'bg-white dark:bg-[#0E1511] border border-[#E2E8E4] dark:border-[#1F2E27] shadow-sm hover:border-amber-400/60 text-zinc-900 dark:text-zinc-100 hover:-translate-y-1'
              }`}
            >
              {isSelected ? (
                <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full font-cairo font-bold text-[11px] shadow-sm flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black">
                  <Sparkles className="w-3 h-3" />
                  <span>پلن انتخابی شما</span>
                </div>
              ) : plan.badge ? (
                <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full font-cairo font-bold text-[11px] shadow-sm flex items-center gap-1 bg-zinc-800 text-amber-300 border border-amber-400/40">
                  <Sparkles className="w-3 h-3" />
                  <span>{plan.badge}</span>
                </div>
              ) : null}

              <div className="space-y-4">
                <div>
                  <h3 className={`font-cairo text-xl font-bold flex items-center gap-2 ${isSelected ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    <span>{plan.nameFa}</span>
                    {plan.id === 'pro-6m' && <Crown className="w-4 h-4 text-amber-500" />}
                  </h3>
                  <p className={`text-xs mt-1 ${isSelected ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className={`py-4 border-y ${isSelected ? 'border-amber-500/30' : 'border-[#E2E8E4] dark:border-[#22332B]'}`}>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-cairo text-3xl font-black text-amber-400">
                      {formatToman(plan.price)}
                    </span>
                    <span className={`text-xs font-medium ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      / {plan.durationMonths === 1 ? 'یک‌ماهه' : plan.durationMonths === 3 ? 'سه‌ماهه' : 'شش‌ماهه'}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <ul className={`space-y-3 text-xs ${isSelected ? 'text-zinc-200' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`pt-6 mt-6 border-t ${isSelected ? 'border-amber-500/30' : 'border-[#E2E8E4] dark:border-[#22332B]'}`}>
                {isPendingReview ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 rounded-2xl font-cairo font-bold text-xs sm:text-sm bg-amber-500/15 border-2 border-amber-400/60 text-amber-300 flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-sm"
                  >
                    <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>حساب طلایی در حال بررسی</span>
                  </button>
                ) : (
                  <button
                    id={`select-plan-${plan.id}-btn`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isAuthenticated) {
                        openAuthGuard('برای خرید اشتراک و استفاده از امکانات، لطفاً ابتدا ثبت‌نام کنید یا وارد حساب خود شوید.');
                        return;
                      }
                      setActivePlanId(plan.id);
                      setSelectedPlanForCheckout(plan);
                    }}
                    className={`w-full py-3 rounded-2xl font-cairo font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-zinc-950 font-black shadow-amber-950/20'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#14201A] dark:hover:bg-[#1A2C23] text-zinc-800 dark:text-zinc-200 border border-[#D7E0DA] dark:border-[#1F2E27]'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{isSelected ? 'تایید و پرداخت کارت به کارت' : 'انتخاب این پلن'}</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Table: Free vs Pro */}
      <div className="bg-white dark:bg-[#0E1511] rounded-3xl border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-cairo font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
            مقایسه شفاف سطوح دسترسی
          </span>
          <h3 className="font-cairo text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            تفاوت‌های اشتراک معمولی (رایگان) با اشتراک طلایی پرو
          </h3>
          <p className="text-xs text-zinc-500">
            جدول تفصیلی امکانات و دسترسی‌ها برای انتخابی آگاهانه و متناسب با نیاز مالی شما
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E2E8E4] dark:border-[#1F2E26]">
          <table className="w-full text-xs text-right">
            <thead className="bg-zinc-100/80 dark:bg-[#121B17] text-zinc-700 dark:text-zinc-300 font-cairo font-bold">
              <tr>
                <th className="p-3.5 sm:p-4">قابلیت و امکانات</th>
                <th className="p-3.5 sm:p-4 text-center">اشتراک عادی (رایگان)</th>
                <th className="p-3.5 sm:p-4 text-center text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20">
                  اشتراک طلایی پرو (چندبوم)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E4] dark:divide-[#1F2E26]">
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  دستیار هوش مصنوعی چندبوم (ثبت تراکنش با تایپ و چت)
                </td>
                <td className="p-3.5 text-center text-zinc-400">فقط پیش‌نمایش (غیرفعال)</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/20 dark:bg-amber-950/10">
                  دسترسی نامحدود ۲۴ ساعته
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  تحلیل مالی پیشرفته و پیش‌بینی ۳ و ۶ ماه آینده
                </td>
                <td className="p-3.5 text-center text-zinc-400">فقط آمار ماه جاری</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/20 dark:bg-amber-950/10">
                  پیش‌بینی دقیق تراز و هشدار کسری
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  سقف ثبت تراکنش‌های ماهانه
                </td>
                <td className="p-3.5 text-center text-zinc-500">محدود به ۲۰ تراکنش</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/20 dark:bg-amber-950/10">
                  نامحدود
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  ثبت یادآورهای چک و سررسید اقساط
                </td>
                <td className="p-3.5 text-center text-zinc-500">حداکثر ۲ یادآور</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/20 dark:bg-amber-950/10">
                  نامحدود با آلارم هوشمند
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  محاسبه دنگ سفر و تسویه دورهمی
                </td>
                <td className="p-3.5 text-center text-zinc-500">حداکثر ۱ گروه</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/20 dark:bg-amber-950/10">
                  نامحدود با گزارش تفکیکی
                </td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  اولویت تایید واریزی و پشتیبانی اختصاصی
                </td>
                <td className="p-3.5 text-center text-zinc-500">صف عادی</td>
                <td className="p-3.5 text-center font-bold text-amber-700 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/10">
                  VIP زیر ۱۵ دقیقه توسط مدیر سیستم
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pros & Cons Section (Honest Evaluation) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pros Card */}
        <div className="p-6 rounded-3xl bg-emerald-50/60 dark:bg-[#0D1C14] border border-emerald-200 dark:border-emerald-800/60 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <h4 className="font-cairo text-base font-bold">
              مزایای اصلی اشتراک طلایی پرو
            </h4>
          </div>

          <ul className="space-y-2.5 text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
              <span><strong>صرفه‌جویی چشمگیر در زمان:</strong> بدون نیاز به پر کردن فرم‌های طولانی، فقط با یک جمله کوتاه در هوش مصنوعی چندبوم تراکنش‌ها را ثبت کنید.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
              <span><strong>پیش‌بینی بحران‌های بودجه:</strong> الگوریتم‌های هوش مصنوعی ۳ ماه آینده را تحلیل کرده و قبل از اتمام پول به شما هشدار می‌دهند.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
              <span><strong>جلوگیری از جریمه دیرکرد:</strong> ثبت نامحدود یادآورهای چک و اقساط مانع فراموشی موعدهای مالی می‌شود.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
              <span><strong>تسویه راحت و شفاف دنگ‌ها:</strong> مناسب خانواده‌ها، مسافرت‌ها و زندگی‌های اشتراکی با تسویه خودکار.</span>
            </li>
          </ul>
        </div>

        {/* Considerations / Cons Card */}
        <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E27] space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-800 dark:text-zinc-200">
            <div className="p-2 rounded-xl bg-zinc-200/80 dark:bg-zinc-800">
              <HelpCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h4 className="font-cairo text-base font-bold">
              معایب و نکات قابل توجه (بررسی شفاف)
            </h4>
          </div>

          <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-bold text-zinc-400">•</span>
              <span><strong>پرداخت هزینه دوره‌ای:</strong> برای دسترسی مداوم به اشتراک طلایی نیاز به تمدید ماهانه، ۳ ماهه یا ۶ ماهه دارید.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-zinc-400">•</span>
              <span><strong>عدم توجیه برای افراد کم‌فعالیت:</strong> اگر در ماه تنها ۲ یا ۳ تراکنش ساده ثبت می‌کنید، امکانات اشتراک رایگان برای شما کاملاً کافی است و نیازی به ارتقا به پرو ندارید.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-zinc-400">•</span>
              <span><strong>وابستگی هوش مصنوعی به داده‌های ورودی:</strong> هرچه تراکنش‌ها را دقیق‌تر ثبت کنید، پیش‌بینی‌های ۳ ماهه هوش مصنوعی چندبوم اثربخش‌تر خواهد بود.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Manual Payment Explanation Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1511] border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-cairo font-bold text-base">
            <Shield className="w-5 h-5" />
            <span>فرآیند تسویه شفاف و بدون واسطه</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            مبالغ مستقیماً به کارت بانک سامان به شماره <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200" dir="ltr">{BANK_CARD_CONFIG.cardNumber}</span> به نام <span className="font-bold text-zinc-800 dark:text-zinc-200">{BANK_CARD_CONFIG.accountHolder}</span> واریز شده و با آپلود فیش، رسید فوراً در سیستم ذخیره می‌گردد.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-left text-xs font-cairo">
            <span className="text-zinc-400 block">پشتیبانی و تایید واریزی:</span>
            <span className="font-bold text-amber-700 dark:text-amber-400">سید ماهان هجرتی (مدیریت چندبوم)</span>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          isOpen={!!selectedPlanForCheckout}
          onClose={() => setSelectedPlanForCheckout(null)}
          selectedPlan={selectedPlanForCheckout}
        />
      )}
    </div>
  );
};

