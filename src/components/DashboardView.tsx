import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Users,
  CalendarCheck,
  LifeBuoy,
  ChevronLeft,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatToman,
  formatCompactToman,
  toPersianDigits,
  formatShamsiDate,
  CATEGORY_METADATA,
} from '../utils/formatters';

interface DashboardViewProps {
  onOpenTransactionModal: () => void;
  onOpenReminderModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenTransactionModal,
  onOpenReminderModal,
}) => {
  const {
    user,
    transactions,
    totalIncome,
    totalExpense,
    netBalance,
    monthlyBudgetCap,
    budgetUtilizationPercent,
    notifications,
    setActiveTab,
    navigateToSupportWithTicket,
    expensesByCategory,
  } = useApp();

  const recentTransactions = transactions.slice(0, 6);
  const pendingDebts = notifications.filter((n) => n.type === 'debt_reminder' && n.status === 'pending');
  const upcomingChecks = notifications.filter((n) => n.type === 'check_due' && n.status === 'pending');
  const remainingBudget = Math.max(monthlyBudgetCap - totalExpense, 0);

  // Top spending categories
  const sortedCategories = (Object.entries(expensesByCategory) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-vazir">
      {/* Top Greeting & Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0F1512] p-5 sm:p-6 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-cairo text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              سلام، {user.full_name} عزیز
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-cairo font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 dark:bg-[#121F19] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/50">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              حساب فعال
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            خلاصه گردش حساب و بودجه‌بندی شما در سامانه <span className="font-brand font-bold text-emerald-800 dark:text-emerald-400">کیفیار</span> (kifyar)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-emerald-50/70 dark:bg-[#141E1A] px-3.5 py-2 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 text-xs font-cairo font-semibold text-emerald-900 dark:text-emerald-300">
          <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <span>امروز: {formatShamsiDate(new Date())}</span>
        </div>
      </div>

      {/* 4 Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs relative overflow-hidden transition hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-bold text-zinc-600 dark:text-zinc-400">موجودی خالص کل</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-[#14201A] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-cairo text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {formatToman(netBalance)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className={`font-semibold ${netBalance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {netBalance >= 0 ? '✓ تراز مثبت مالی' : 'کسری موجودی'}
              </span>
            </div>
          </div>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs relative overflow-hidden transition hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-bold text-zinc-600 dark:text-zinc-400">مجموع درآمدها (دخل)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-[#14201A] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-cairo text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
              {formatToman(totalIncome)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{toPersianDigits(transactions.filter((t) => t.type === 'income').length)} تراکنش واریزی</span>
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs relative overflow-hidden transition hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-bold text-zinc-600 dark:text-zinc-400">مجموع هزینه‌ها (خرج)</span>
            <div className="p-2 rounded-xl bg-emerald-50/70 text-emerald-900 dark:bg-[#14201A] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
              <TrendingDown className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-cairo text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {formatToman(totalExpense)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{toPersianDigits(transactions.filter((t) => t.type === 'expense').length)} فقره هزینه ماه جاری</span>
            </div>
          </div>
        </div>

        {/* Budget Left & Savings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs relative overflow-hidden transition hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-bold text-zinc-600 dark:text-zinc-400">باقیمانده از سقف بودجه</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-[#14201A] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-cairo text-2xl font-black text-emerald-800 dark:text-emerald-300 tracking-tight">
              {formatToman(remainingBudget)}
            </h3>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold text-zinc-600 dark:text-zinc-400 font-cairo">
              <span>سقف: {formatCompactToman(monthlyBudgetCap)}</span>
              <span>{toPersianDigits(budgetUtilizationPercent)}٪ مصرف</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-zinc-100 dark:bg-[#18241F] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetUtilizationPercent > 90
                    ? 'bg-rose-500'
                    : budgetUtilizationPercent > 70
                    ? 'bg-emerald-600 dark:bg-emerald-400'
                    : 'bg-emerald-700 dark:bg-emerald-500'
                }`}
                style={{ width: `${budgetUtilizationPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Smart Budget Alert Banner (If spent > 75%) */}
      {budgetUtilizationPercent >= 75 && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-[#121F19] border border-emerald-300/70 dark:border-emerald-800 flex items-start gap-3 text-right">
          <AlertTriangle className="w-5 h-5 text-emerald-800 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-cairo font-bold text-sm text-emerald-950 dark:text-emerald-200">
              هشدار هوشمند مدیریت بودجه کیفیار
            </h4>
            <p className="text-xs text-emerald-900 dark:text-emerald-300 mt-0.5 leading-relaxed">
              شما تاکنون {toPersianDigits(budgetUtilizationPercent)}٪ از سقف بودجه ماهانه خود ({formatToman(monthlyBudgetCap)}) را مصرف کرده‌اید. پیشنهاد می‌شود هزینه‌های غیرضروری را تا پایان ماه مدیریت نمایید.
            </p>
          </div>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          id="dash-add-tx-btn"
          onClick={onOpenTransactionModal}
          className="p-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs transition flex flex-col items-center justify-center gap-2 cursor-pointer text-center group"
        >
          <div className="p-2.5 rounded-xl bg-white/20 group-hover:scale-105 transition">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="font-cairo font-bold text-xs sm:text-sm">ثبت تراکنش جدید</span>
          <span className="text-[11px] text-emerald-100 hidden sm:inline font-vazir">دخل یا خرج سریع</span>
        </button>

        <button
          id="dash-add-debt-btn"
          onClick={onOpenReminderModal}
          className="p-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white shadow-xs transition flex flex-col items-center justify-center gap-2 cursor-pointer text-center group"
        >
          <div className="p-2.5 rounded-xl bg-white/20 group-hover:scale-105 transition">
            <Users className="w-5 h-5" />
          </div>
          <span className="font-cairo font-bold text-xs sm:text-sm">ثبت دنگ و طلب</span>
          <span className="text-[11px] text-emerald-100 hidden sm:inline font-vazir">یادآور تسویه دوستان</span>
        </button>

        <button
          id="dash-add-check-btn"
          onClick={onOpenReminderModal}
          className="p-4 rounded-2xl bg-zinc-800 hover:bg-zinc-900 dark:bg-[#16221D] dark:hover:bg-[#1D2E27] text-white shadow-xs border border-zinc-700/50 dark:border-emerald-900/50 transition flex flex-col items-center justify-center gap-2 cursor-pointer text-center group"
        >
          <div className="p-2.5 rounded-xl bg-white/20 group-hover:scale-105 transition">
            <CalendarCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="font-cairo font-bold text-xs sm:text-sm">سررسید چک و اقساط</span>
          <span className="text-[11px] text-zinc-300 dark:text-emerald-200 hidden sm:inline font-vazir">هشدار موعد پرداخت</span>
        </button>

        <button
          id="dash-support-btn"
          onClick={() => navigateToSupportWithTicket()}
          className="p-4 rounded-2xl bg-white hover:bg-emerald-50 dark:bg-[#0F1512] dark:hover:bg-[#16201B] text-emerald-900 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-900/60 shadow-xs transition flex flex-col items-center justify-center gap-2 cursor-pointer text-center group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-100/70 dark:bg-[#1A2822] group-hover:scale-105 transition text-emerald-700 dark:text-emerald-400">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <span className="font-cairo font-bold text-xs sm:text-sm">مرکز تیکت و پشتیبانی</span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline font-vazir">پاسخگویی کارشناس</span>
        </button>
      </div>

      {/* 2 Column Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Transactions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-5 bg-emerald-600 dark:bg-emerald-500 rounded-full" />
              <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
                آخرین تراکنش‌های ثبت‌شده
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-cairo font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>مشاهده تمام تراکنش‌ها</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden divide-y divide-[#E2E8E4] dark:divide-[#1A2621]">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                هنوز تراکنشی ثبت نشده است. با دکمه ثبت تراکنش اولین دخل و خرج خود را وارد کنید.
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const meta = CATEGORY_METADATA[tx.category];
                return (
                  <div
                    key={tx.id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-emerald-50/40 dark:hover:bg-[#131E19] transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl ${
                          tx.type === 'expense'
                            ? 'bg-zinc-100 text-zinc-700 dark:bg-[#141F1A] dark:text-zinc-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-[#121F19] dark:text-emerald-300'
                        }`}
                      >
                        {tx.type === 'expense' ? (
                          <ArrowDownLeft className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                            {tx.category}
                          </span>
                          <span>•</span>
                          <span>{toPersianDigits(tx.date)}</span>
                          <span>•</span>
                          <span className="text-[11px] bg-zinc-100 dark:bg-[#18241F] px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                            {tx.account}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <p
                        className={`font-cairo text-base font-bold ${
                          tx.type === 'expense'
                            ? 'text-zinc-800 dark:text-zinc-200'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {tx.type === 'expense' ? '-' : '+'} {formatToman(tx.amount)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Urgent Reminders & Top Categories */}
        <div className="space-y-6">
          {/* Active Alarms & Reminders Widget */}
          <div className="bg-white dark:bg-[#0F1512] p-5 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                  یادآورها و موعدها
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('reminders')}
                className="text-xs font-cairo font-bold text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                مدیریت
              </button>
            </div>

            <div className="space-y-2.5">
              {pendingDebts.length === 0 && upcomingChecks.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-50 dark:bg-[#121A16] rounded-xl">
                  یادآور یا بدهی فعالی وجود ندارد.
                </div>
              ) : (
                [...pendingDebts, ...upcomingChecks].slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-emerald-50/40 dark:bg-[#121F19] border border-emerald-200/50 dark:border-emerald-900/40 text-xs flex items-start gap-2.5"
                  >
                    {item.type === 'debt_reminder' ? (
                      <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <CalendarCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-cairo font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.title}</p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-[11px] truncate mt-0.5">{item.message}</p>
                      {item.amount && (
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 text-[11px] mt-1 block">
                          {formatToman(item.amount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={onOpenReminderModal}
              className="w-full py-2 rounded-xl text-xs font-cairo font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-[#14221C] dark:hover:bg-[#1C2F27] border border-emerald-200/60 dark:border-emerald-800/60 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              افزودن یادآور دنگ یا چک جدید
            </button>
          </div>

          {/* Top Spending Categories Widget */}
          <div className="bg-white dark:bg-[#0F1512] p-5 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-5 bg-emerald-700 dark:bg-emerald-500 rounded-full" />
                <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                  بیشترین دسته‌های هزینه
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('analytics')}
                className="text-xs font-cairo font-bold text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                نمودار کامل
              </button>
            </div>

            <div className="space-y-3">
              {sortedCategories.map(([category, amount]) => {
                const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        {category}
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {formatToman(amount)} ({toPersianDigits(percent)}٪)
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-[#18241F] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all"
                        style={{
                          width: `${percent}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
