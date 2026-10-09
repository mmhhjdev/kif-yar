import React, { useState, useMemo } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ShieldCheck,
  Award,
  Zap,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatToman,
  formatCompactToman,
  toPersianDigits,
  CATEGORY_METADATA,
} from '../utils/formatters';

export const AnalyticsView: React.FC = () => {
  const { transactions, totalIncome, totalExpense } = useApp();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Filter transactions based on timeRange
  const scopedTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const txDate = new Date(t.date);
      if (isNaN(txDate.getTime())) return true;
      const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
      if (timeRange === 'week') return diffDays <= 7;
      if (timeRange === 'month') return diffDays <= 30;
      if (timeRange === 'year') return diffDays <= 365;
      return true;
    });
  }, [transactions, timeRange]);

  // Expenses Category breakdown for Donut Chart
  const categoryData = useMemo(() => {
    const sums: Record<string, number> = {};
    scopedTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        sums[t.category] = (sums[t.category] || 0) + t.amount;
      });

    const emeraldScale = ['#047857', '#059669', '#10B981', '#34D399', '#064E3B', '#52525B', '#71717A', '#A1A1AA'];

    return Object.entries(sums)
      .map(([name, value], idx) => ({
        name,
        value,
        color: emeraldScale[idx % emeraldScale.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [scopedTransactions]);

  const trendData = useMemo(() => {
    return [
      { name: 'فروردین', income: 0, expense: 0 },
      { name: 'اردیبهشت', income: 0, expense: 0 },
      { name: 'خرداد', income: 0, expense: 0 },
      { name: 'تیر', income: 0, expense: 0 },
      { name: 'مرداد', income: 0, expense: 0 },
    ];
  }, []);

  // Savings rate calculation
  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    const net = totalIncome - totalExpense;
    return Math.max(0, Math.round((net / totalIncome) * 100));
  }, [totalIncome, totalExpense]);

  // Dynamic Financial Health Score calculation
  const healthScore = useMemo(() => {
    if (totalIncome <= 0 && totalExpense <= 0) return 0;
    const score = Math.min(100, Math.max(0, 50 + (savingsRate * 1.5)));
    return Math.round(score);
  }, [totalIncome, totalExpense, savingsRate]);

  // 1. هوش مصنوعی جدید: پیش‌بینی وضعیت مالی در پایان ماه
  const financialForecast = useMemo(() => {
    const now = new Date();
    const currentDayOfMonth = now.getDate() || 1;
    // تخمین بر اساس ماه ۳۰ روزه
    const daysInMonth = 30;
    const remainingDays = Math.max(0, daysInMonth - currentDayOfMonth);

    const dailyAverageExpense = currentDayOfMonth > 0 ? totalExpense / currentDayOfMonth : 0;
    const projectedTotalExpense = totalExpense + (dailyAverageExpense * remainingDays);
    const projectedNet = totalIncome - projectedTotalExpense;

    return {
      dailyAverageExpense: Math.round(dailyAverageExpense),
      projectedTotalExpense: Math.round(projectedTotalExpense),
      projectedNet: Math.round(projectedNet),
      isDeficitWarning: projectedNet < 0,
    };
  }, [totalIncome, totalExpense]);

  // 2. هشدارهای پویا بر اساس بالاترین سهم هزینه
  const dynamicAlerts = useMemo(() => {
    if (categoryData.length === 0) return [];
    const totalExp = categoryData.reduce((acc, curr) => acc + curr.value, 0);
    const alerts = [];

    // بررسی بالاترین دسته‌بندی هزینه
    const topCategory = categoryData[0];
    const topPercent = totalExp > 0 ? Math.round((topCategory.value / totalExp) * 100) : 0;

    if (topPercent > 35) {
      alerts.push({
        title: `تمرکز بالای هزینه در «${topCategory.name}»`,
        desc: `این دسته حدود ${toPersianDigits(topPercent)}٪ از کل هزینه‌های شما را به خود اختصاص داده است. بازنگری در این بخش بیشترین تاثیر را در بهبود پس‌انداز دارد.`,
        type: 'warning',
      });
    }

    if (financialForecast.isDeficitWarning) {
      alerts.push({
        title: 'هشدار کسری بودجه احتمالی',
        desc: `با روند فعلی خرج‌کرد روزانه، پیش‌بینی می‌شود تا پایان ماه هزینه‌ها از درآمد پیشی بگیرد. کنترل هزینه‌های متفرقه توصیه می‌شود.`,
        type: 'danger',
      });
    } else {
      alerts.push({
        title: 'روند پایدار مالی',
        desc: `پیش‌بینی می‌شود ماه را با ${formatToman(Math.abs(financialForecast.projectedNet))} مازاد یا تعادل مثبت به پایان برسانید.`,
        type: 'success',
      });
    }

    return alerts;
  }, [categoryData, financialForecast]);

  // Custom Tooltip for Persian Toman
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const totalExp = categoryData.reduce((acc, curr) => acc + curr.value, 0);
      const percent = totalExp > 0 ? Math.round((data.value / totalExp) * 100) : 0;
      return (
        <div className="bg-[#0F1512] text-white p-3 rounded-xl shadow-xl text-xs border border-[#1A2621] text-right font-vazir">
          <p className="font-cairo font-bold">{data.name}</p>
          <p className="text-emerald-400 font-bold mt-1">{formatToman(data.value)}</p>
          <p className="text-zinc-400 mt-0.5">سهم از کل: {toPersianDigits(percent)}٪</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F1512] text-white p-3 rounded-xl shadow-xl text-xs border border-[#1A2621] text-right space-y-1 font-vazir">
          <p className="font-cairo font-bold border-b border-[#1A2621] pb-1">{label}</p>
          <p className="text-emerald-400 font-semibold">
            درآمد (دخل): {formatToman(payload[0]?.value)}
          </p>
          <p className="text-zinc-300 font-semibold">
            هزینه (خرج): {formatToman(payload[1]?.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-vazir">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            تحلیل جامع و شاخص‌های مالی <span className="font-brand text-emerald-800 dark:text-emerald-400">کیفیار</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            بررسی سهم هزینه‌ها، تعادل دخل و خرج و پایش سلامت مالی
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center p-1 bg-white dark:bg-[#0F1512] rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] self-start sm:self-auto shadow-xs">
          <button
            id="filter-week-btn"
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-cairo font-bold transition cursor-pointer ${
              timeRange === 'week'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            ۷ روز اخیر
          </button>
          <button
            id="filter-month-btn"
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-cairo font-bold transition cursor-pointer ${
              timeRange === 'month'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            ماه جاری (۳۰ روز)
          </button>
          <button
            id="filter-year-btn"
            onClick={() => setTimeRange('year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-cairo font-bold transition cursor-pointer ${
              timeRange === 'year'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            یک سال گذشته
          </button>
        </div>
      </div>

      {/* Health Score & Savings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Savings Rate Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex items-center justify-between">
          <div>
            <span className="font-cairo text-xs font-bold text-zinc-600 dark:text-zinc-400">نرخ پس‌انداز ماهانه</span>
            <h3 className="font-cairo text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              {toPersianDigits(savingsRate)}٪
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
              {savingsRate >= 20 ? '✓ وضعیت استاندارد و مطلوب' : 'نیازمند کاهش هزینه‌های مازاد'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-[#14201A] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Financial Balance Ratio */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex items-center justify-between">
          <div>
            <span className="font-cairo text-xs font-bold text-zinc-600 dark:text-zinc-400">نسبت هزینه به درآمد</span>
            <h3 className="font-cairo text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              {totalIncome > 0 ? toPersianDigits(Math.round((totalExpense / totalIncome) * 100)) : '۰'}٪
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
              حد مطلوب و ایمن: کمتر از ۷۰٪
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-[#14201A] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Budget Health Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex items-center justify-between">
          <div>
            <span className="font-cairo text-xs font-bold text-zinc-600 dark:text-zinc-400">امتیاز سلامت مالی کیفیار</span>
            <h3 className="font-cairo text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
              {toPersianDigits(healthScore)} / ۱۰۰
            </h3>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
              {healthScore >= 80 ? 'سطح سلامت: خیلی خوب (A+)' : healthScore >= 50 ? 'سطح سلامت: متوسط (B)' : 'نیازمند بهبود و پایش مالی'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-[#14201A] dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-900/40">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* NEW: Financial Forecasting Widget */}
      <div className="bg-gradient-to-r from-emerald-900 to-zinc-900 text-white p-6 rounded-2xl shadow-md space-y-3 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h3 className="font-cairo text-base font-bold text-emerald-100">
            پیش‌بینی هوشمند وضعیت مالی در پایان ماه (برآورد الگوریتمی)
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-sm">
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <span className="text-zinc-300 text-xs block">میانگین هزینه روزانه</span>
            <span className="font-bold text-emerald-300 mt-1 block">{formatToman(financialForecast.dailyAverageExpense)}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <span className="text-zinc-300 text-xs block">پیش‌بینی کل هزینه‌ها تا پایان ماه</span>
            <span className="font-bold text-white mt-1 block">{formatToman(financialForecast.projectedTotalExpense)}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <span className="text-zinc-300 text-xs block">تراز پیش‌بینی‌شده پایان ماه</span>
            <span className={`font-bold mt-1 block ${financialForecast.isDeficitWarning ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatToman(financialForecast.projectedNet)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Donut Chart - Category Distribution */}
        <div className="bg-white dark:bg-[#0F1512] p-6 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-5 bg-emerald-700 dark:bg-emerald-500 rounded-full" />
              <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                سهم دسته‌بندی‌های هزینه
              </h3>
            </div>
            <span className="text-xs font-cairo text-zinc-500 dark:text-zinc-400 font-semibold">
              مجموع: {formatCompactToman(totalExpense)}
            </span>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-zinc-500">
              داده‌ای برای نمایش نمودار هزینه در این بازه زمانی وجود ندارد.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Categories Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#E2E8E4] dark:border-[#1A2621]">
            {categoryData.slice(0, 6).map((cat) => {
              const totalExp = categoryData.reduce((acc, curr) => acc + curr.value, 0);
              const percent = totalExp > 0 ? Math.round((cat.value / totalExp) * 100) : 0;
              return (
                <div key={cat.name} className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate">{cat.name}:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{toPersianDigits(percent)}٪</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Income vs Expense Trend Bar Chart */}
        <div className="bg-white dark:bg-[#0F1512] p-6 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
              <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                روند مقایسه‌ای دخل و خرج ماه‌های اخیر
              </h3>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)} م`}
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  orientation="right"
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="income" name="درآمد" fill="#047857" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="هزینه" fill="#52525b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs font-cairo font-bold pt-2 border-t border-[#E2E8E4] dark:border-[#1A2621]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-700" />
              <span className="text-zinc-700 dark:text-zinc-300">درآمد (دخل ماهانه)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-zinc-600" />
              <span className="text-zinc-700 dark:text-zinc-300">هزینه (خرج ماهانه)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Recommendations & Dynamic Alerts Section */}
      <div className="bg-white dark:bg-[#0F1512] p-6 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          <h4 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
            توصیه‌ها و هشدارهای پویا مدیریت مالی کیفیار
          </h4>
        </div>
        
        {/* Dynamic AI Generated Alerts */}
        {dynamicAlerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dynamicAlerts.map((alert, idx) => (
              <div key={idx} className="p-4 bg-amber-50/50 dark:bg-[#1f1a14] rounded-xl border border-amber-200/50 dark:border-amber-900/40 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-cairo font-bold text-amber-900 dark:text-amber-300 block mb-1">
                    {alert.title}
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {alert.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
          <div className="p-4 bg-emerald-50/50 dark:bg-[#14201A] rounded-xl border border-emerald-200/50 dark:border-emerald-900/40">
            <span className="font-cairo font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
              ۱. پس‌انداز سیستماتیک
            </span>
            اختصاص حداقل ۱۵٪ از درآمدها بلافاصله پس از واریز به صندوق‌های کم‌ریسک جهت حفظ ارزش دارایی.
          </div>
          <div className="p-4 bg-zinc-50 dark:bg-[#141E1A] rounded-xl border border-zinc-200 dark:border-[#1F2E27]">
            <span className="font-cairo font-bold text-zinc-900 dark:text-zinc-100 block mb-1">
              ۲. پایش هزینه‌های تکرارشونده
            </span>
            بررسی اشتراک‌ها و هزینه‌های روزمره جهت جلوگیری از عبور از سقف تعیین‌شده در بودجه ماهانه.
          </div>
          <div className="p-4 bg-emerald-50/50 dark:bg-[#14201A] rounded-xl border border-emerald-200/50 dark:border-emerald-900/40">
            <span className="font-cairo font-bold text-emerald-900 dark:text-emerald-300 block mb-1">
              ۳. تسویه به موقع مطالبات
            </span>
            ثبت و پیگیری منظم دنگ‌ها و چک‌ها در سامانه جهت حفظ تراز مالی منظم و شفاف.
          </div>
        </div>
      </div>
    </div>
  );
};