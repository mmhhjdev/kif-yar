import React from 'react';
import {
  PieChart,
  TrendingDown,
  TrendingUp,
  Percent,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Coins,
  ShieldAlert,
  Bot,
  Lock,
  Crown,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatToman, toPersianDigits } from '../utils/formatters';

export const AnalyticsView: React.FC = () => {
  const { metrics, budgetInsight, user, transactions, isProUser, setActiveTab } = useApp();

  const expenseBreakdown = metrics.categoryBreakdown;
  const totalExpense = metrics.totalExpense;

  // Calculate percentage of budget used
  const budgetUsagePercent =
    user.monthly_budget_cap > 0
      ? Math.min(Math.round((totalExpense / user.monthly_budget_cap) * 100), 100)
      : 0;

  // Savings rate
  const savingsRate =
    metrics.totalIncome > 0
      ? Math.max(Math.round(((metrics.totalIncome - totalExpense) / metrics.totalIncome) * 100), 0)
      : 0;

  // Top spending categories sorted
  const sortedCategories = (Object.entries(expenseBreakdown) as [string, number][]).sort(
    ([, a], [, b]) => b - a
  );

  // Future 3-month & 6-month projections
  const monthlyNet = metrics.totalIncome - totalExpense;
  const projected3m = metrics.balance + monthlyNet * 3;
  const projected6m = metrics.balance + monthlyNet * 6;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-cairo">
      {/* Top Header */}
      <div>
        <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          تحلیل هوشمند و نمودارهای مالی
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          بررسی نسبت پس‌انداز، تفکیک سهم دسته‌ها، وضعیت سقف بودجه و هشدارهای پیش‌بینی چندبوم
        </p>
      </div>

      {/* AI Predictive Insight Banner */}
      <div
        className={`p-5 rounded-2xl border flex items-start gap-3.5 ${
          budgetInsight.isWarning
            ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
            : 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
        }`}
      >
        <div
          className={`p-2 rounded-xl shrink-0 ${
            budgetInsight.isWarning
              ? 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
              : 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
          }`}
        >
          {budgetInsight.isWarning ? (
            <ShieldAlert className="w-5 h-5" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-cairo font-bold text-sm">
              تحلیل هوشمند چندبوم: {budgetInsight.isWarning ? 'هشدار اضافه مصرف' : 'وضعیت بودجه پایدار'}
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-cairo">
              میانگین روزانه: {formatToman(budgetInsight.dailyBurnRate)}
            </span>
          </div>
          <p className="text-xs leading-relaxed">{budgetInsight.message}</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Budget Cap Usage */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>مصرف از سقف بودجه ماه</span>
            <span className="font-cairo font-bold text-zinc-900 dark:text-white">
              {toPersianDigits(budgetUsagePercent)}٪
            </span>
          </div>

          <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsagePercent > 85
                  ? 'bg-rose-600'
                  : budgetUsagePercent > 65
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${budgetUsagePercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-zinc-400">
            <span>کل بودجه: {formatToman(user.monthly_budget_cap)}</span>
            <span>باقیمانده: {formatToman(Math.max(user.monthly_budget_cap - totalExpense, 0))}</span>
          </div>
        </div>

        {/* Card 2: Savings Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>نرخ پس‌انداز ماهانه</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="font-cairo text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {toPersianDigits(savingsRate)}٪
          </div>

          <p className="text-[11px] text-zinc-400">
            {savingsRate >= 20
              ? 'عالی! شما استانداردهای پس‌انداز ایمن را رعایت کرده‌اید.'
              : 'پیشنهاد می‌شود هزینه‌های غیرضروری را تعدیل کنید.'}
          </p>
        </div>

        {/* Card 3: Net Cashflow */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>تراز جریان مالی خالص</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>

          <div
            className={`font-cairo text-2xl font-black ${
              metrics.balance >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatToman(metrics.balance)}
          </div>

          <p className="text-[11px] text-zinc-400">
            درآمدها منهای هزینه‌های ثبت شده در این دوره
          </p>
        </div>
      </div>

      {/* Category Spending Breakdown */}
      <div className="bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <span>تفکیک هزینه‌ها به تفکیک دسته‌بندی (تحلیل عمومی)</span>
          </h3>
          <span className="text-xs text-zinc-500">
            کل هزینه‌ها: {formatToman(totalExpense)}
          </span>
        </div>

        {sortedCategories.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            هنوز هزینه‌ای برای ترسیم نمودار ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map(([category, amount]) => {
              const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-cairo font-bold text-zinc-800 dark:text-zinc-200">
                      {category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-cairo font-bold text-zinc-900 dark:text-white">
                        {formatToman(amount)}
                      </span>
                      <span className="text-zinc-400 text-[11px] font-mono">
                        ({toPersianDigits(percent)}٪)
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Financial Analysis & Multi-Month Projection (Pro Feature) */}
      <div className="bg-white dark:bg-[#0F1512] rounded-3xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs p-6 space-y-6 overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8E4] dark:border-[#1F2E27]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-zinc-950 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>تحلیل پیشرفته و پیش‌بینی چندماهه</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                  هوش مصنوعی چندبوم (Pro)
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                محاسبه پیش‌بینانه جریان نقدینگی، پیش‌بینی ۳ و ۶ ماه آینده و نظارت هوشمند
              </p>
            </div>
          </div>

          {!isProUser && (
            <button
              onClick={() => setActiveTab('subscription')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-cairo font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer shrink-0"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>خرید اشتراک طلایی پرو</span>
            </button>
          )}
        </div>

        {/* If Pro User: Full Interactive Forecast */}
        {isProUser ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 3-Month Projection */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C170A] via-[#241D09] to-[#120F05] text-white border border-amber-500/40 shadow-md space-y-2">
                <span className="text-xs text-amber-300 font-cairo block">
                  پیش‌بینی تراز دارایی تا ۳ ماه آینده
                </span>
                <div className="font-cairo text-2xl font-black text-white">
                  {formatToman(projected3m)}
                </div>
                <p className="text-[11px] text-amber-100/80 leading-relaxed">
                  بر اساس میانگین خالص ماهانه ({monthlyNet >= 0 ? '+' : ''}{formatToman(monthlyNet)})
                </p>
              </div>

              {/* 6-Month Projection */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121B16] via-[#15231D] to-[#0A100D] text-white border border-emerald-500/40 shadow-md space-y-2">
                <span className="text-xs text-emerald-300 font-cairo block">
                  پیش‌بینی تراز دارایی تا ۶ ماه آینده
                </span>
                <div className="font-cairo text-2xl font-black text-white">
                  {formatToman(projected6m)}
                </div>
                <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                  چشم‌انداز تاب‌آوری اقتصادی بلندمدت با ثبات الگوی مصرف
                </p>
              </div>
            </div>

            {/* Smart Strategic Recommendations */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E27] space-y-3">
              <h4 className="font-cairo font-bold text-xs text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>توصیه‌های تحلیلی هوش مصنوعی چندبوم:</span>
              </h4>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    سرعت سوزاندن بودجه ({formatToman(budgetInsight.dailyBurnRate)} در روز) با سقف بودجه مصوب شما همخوانی دارد.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    بیشترین صرفه‌جویی بالقوه در دسته‌بندی «{sortedCategories[0]?.[0] || 'خوراک و غذا'}» شناسایی شد.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* Non-Pro User: Attractive Golden Paywall Teaser */
          <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-[#1C170A] via-[#261E0A] to-[#120F05] text-white border-2 border-amber-500/60 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mx-auto shadow-inner border border-amber-400/40">
              <Lock className="w-7 h-7" />
            </div>

            <div className="max-w-lg mx-auto space-y-2">
              <h4 className="font-cairo text-lg font-bold text-amber-300">
                تحلیل مالی هوشمند و پیش‌بینی چندماهه ویژه مشترکین پرو است
              </h4>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                تحلیل هزینه‌های جاری برای همه کاربران رایگان است؛ اما دسترسی به پیش‌بینی ۳ و ۶ ماه آینده، تشخیص ریسک کسری بودجه، و مشاوره‌های اختصاصی هوش مصنوعی چندبوم منحصراً برای مشترکین اشتراک طلایی فعال می‌شود.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveTab('subscription')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-zinc-950 font-cairo font-black text-xs sm:text-sm transition cursor-pointer shadow-lg inline-flex items-center gap-2"
              >
                <Crown className="w-4 h-4 text-zinc-950" />
                <span>مشاهده و خرید اشتراک طلایی پرو (پلن‌های ۱، ۳ و ۶ ماهه)</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
