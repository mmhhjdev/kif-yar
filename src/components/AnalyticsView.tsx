import React, { useState } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Transaction, CategoryBudget } from '../types';
import { CATEGORIES } from '../data/initialData';
import {
  calculateTotals,
  getAvailableMonths,
  parseTxYearMonth,
  toEnglishDigits,
} from '../utils/formatters';
import { Language, translations } from '../data/translations';

interface AnalyticsViewProps {
  transactions: Transaction[];
  categoryBudgets: CategoryBudget[];
  onUpdateCategoryBudget: (categoryId: string, newLimit: number) => void;
  lang: Language;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  categoryBudgets,
  onUpdateCategoryBudget,
  lang,
}) => {
  const t = translations[lang];
  const formatNum = (num: number) => num.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');

  const isFa = lang === 'fa';
  const availableMonths = getAvailableMonths(transactions, isFa);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(availableMonths[0]?.key || '');
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '6m'>('6m');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingLimit, setEditingLimit] = useState<string>('');

  // Selected Month Item
  const selectedMonthItem =
    availableMonths.find((m) => m.key === selectedMonthKey) || availableMonths[0];

  const currentIndex = availableMonths.findIndex((m) => m.key === selectedMonthItem.key);

  const handlePrevMonth = () => {
    // Older month
    if (currentIndex < availableMonths.length - 1) {
      setSelectedMonthKey(availableMonths[currentIndex + 1].key);
    }
  };

  const handleNextMonth = () => {
    // Newer month
    if (currentIndex > 0) {
      setSelectedMonthKey(availableMonths[currentIndex - 1].key);
    }
  };

  // Transactions filtered for selected month
  const selectedMonthTxs = transactions.filter((tx) => {
    const parsed = parseTxYearMonth(tx.date, isFa);
    return parsed && parsed.year === selectedMonthItem.year && parsed.month === selectedMonthItem.month;
  });

  const { totalIncome, totalExpense, netSavings } = calculateTotals(selectedMonthTxs);

  // Group expense transactions by category for selected month
  const expenseTransactions = selectedMonthTxs.filter((tx) => tx.type === 'expense');
  const categoryTotals = expenseTransactions.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryExpenses = CATEGORIES.filter((cat) => cat.type === 'expense' || cat.type === 'both').map((cat) => {
    const amount = categoryTotals[cat.id] || 0;
    const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
    const budgetObj = categoryBudgets.find((b) => b.categoryId === cat.id);
    const limit = budgetObj ? budgetObj.monthlyLimit : 5000000;
    const budgetUsagePercent = Math.min(Math.round((amount / limit) * 100), 100);

    return {
      categoryId: cat.id,
      nameFa: cat.nameFa,
      nameEn: cat.nameEn,
      color: cat.color,
      amount,
      percentage,
      limit,
      budgetUsagePercent,
      txCount: expenseTransactions.filter((tx) => tx.category === cat.id).length,
    };
  });

  // Dynamic Trend Chart Data based on Timeframe (1m, 3m, 6m)
  const getTrendChartData = () => {
    if (timeframe === '1m') {
      const weekLabelsFa = ['هفته اول', 'هفته دوم', 'هفته سوم', 'هفته چهارم'];
      const weekLabelsEn = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

      return [1, 2, 3, 4].map((wIndex) => {
        const weekTxs = selectedMonthTxs.filter((tx) => {
          const cleaned = toEnglishDigits(tx.date || '').trim();
          const parts = cleaned.split(/[/.-]/).map((p) => parseInt(p, 10)).filter((p) => !isNaN(p));
          let day = 15;
          if (parts.length >= 3) {
            day = parts[0] > 1000 ? parts[2] : parts[1];
          } else if (parts.length === 2) {
            day = 15;
          }
          if (wIndex === 1) return day >= 1 && day <= 7;
          if (wIndex === 2) return day >= 8 && day <= 14;
          if (wIndex === 3) return day >= 15 && day <= 21;
          return day >= 22;
        });

        const { totalIncome: inc, totalExpense: exp } = calculateTotals(weekTxs);
        return {
          month: isFa ? weekLabelsFa[wIndex - 1] : weekLabelsEn[wIndex - 1],
          income: inc,
          expense: exp,
        };
      });
    }

    const count = timeframe === '3m' ? 3 : 6;
    const chartMonths = availableMonths.slice(0, count).reverse(); // oldest to newest for chart x-axis
    return chartMonths.map((m) => {
      const monthTxs = transactions.filter((tx) => {
        const parsed = parseTxYearMonth(tx.date, isFa);
        return parsed && parsed.year === m.year && parsed.month === m.month;
      });
      const { totalIncome: inc, totalExpense: exp } = calculateTotals(monthTxs);
      return {
        month: isFa ? m.shortLabelFa : m.shortLabelEn,
        income: inc,
        expense: exp,
      };
    });
  };

  const trendChartData = getTrendChartData();

  const getChartTitle = () => {
    if (timeframe === '1m') {
      return isFa
        ? `روند هفتگی ۱ ماهه (${selectedMonthItem.shortLabelFa})`
        : `1-Month Weekly Trend (${selectedMonthItem.shortLabelEn})`;
    }
    if (timeframe === '3m') {
      return isFa ? 'نمودار مقایسه‌ای روند ۳ ماهه' : '3-Month Trend Comparison Chart';
    }
    return isFa ? 'نمودار مقایسه‌ای روند ۶ ماهه' : '6-Month Trend Comparison Chart';
  };

  const handleSaveLimit = (catId: string) => {
    const parsed = parseFloat(editingLimit.replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateCategoryBudget(catId, parsed);
    }
    setEditingCatId(null);
  };

  const currentMonthLabel = isFa ? selectedMonthItem.labelFa : selectedMonthItem.labelEn;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-md text-start text-xs space-y-1">
          <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-bold font-tabular">
              {entry.name}: {formatNum(entry.value)} {t.toman}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto">
      {/* Month Selector Bar at the top */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            {t.analyticsTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'fa'
              ? 'کنترل سقف مخارج دسته‌بندی‌ها و مقایسه روند درآمد/هزینه'
              : 'Category budget limit controls & income/expense comparison'}
          </p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={handlePrevMonth}
              disabled={currentIndex >= availableMonths.length - 1}
              className={`p-1.5 rounded-lg transition-colors ${
                currentIndex >= availableMonths.length - 1
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
              title={lang === 'fa' ? 'ماه قبل (قدیمی‌تر)' : 'Previous Month (Older)'}
            >
              <ChevronRight className={`w-4 h-4 ${lang === 'en' ? 'rotate-180' : ''}`} />
            </button>
            <span className="px-4 py-1 text-xs font-bold text-slate-900 dark:text-white font-tabular min-w-[110px] text-center">
              {currentMonthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              disabled={currentIndex <= 0}
              className={`p-1.5 rounded-lg transition-colors ${
                currentIndex <= 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
              title={lang === 'fa' ? 'ماه بعد (جدیدتر)' : 'Next Month (Newer)'}
            >
              <ChevronLeft className={`w-4 h-4 ${lang === 'en' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Summary Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-start shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            {lang === 'fa' ? `ورودی درآمد ${selectedMonthItem.shortLabelFa}:` : `Income (${selectedMonthItem.shortLabelEn}):`}
          </span>
          <span className="text-lg font-extrabold text-emerald-600 font-tabular">
            +{formatNum(totalIncome)} {t.toman}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-start shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            {lang === 'fa' ? `خروجی هزینه ${selectedMonthItem.shortLabelFa}:` : `Expenses (${selectedMonthItem.shortLabelEn}):`}
          </span>
          <span className="text-lg font-extrabold text-rose-600 font-tabular">
            -{formatNum(totalExpense)} {t.toman}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-start shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
            {lang === 'fa' ? 'مانده پس‌انداز ماه:' : 'Monthly Savings Balance:'}
          </span>
          <span className={`text-lg font-extrabold font-tabular ${netSavings >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {formatNum(netSavings)} {t.toman}
          </span>
        </div>
      </div>

      {/* Category Budget Grid Cards Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-600" />
            {lang === 'fa' ? 'کارت‌های بودجه‌بندی دسته‌بندی‌ها' : 'Category Budgeting Cards'}
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'fa' ? 'برای تغییر سقف بودجه، روی دکمه «ویرایش بودجه» کلیک کنید' : 'Click "Edit Budget" to adjust limits'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryExpenses.map((cat) => {
            const isEditing = editingCatId === cat.categoryId;
            const isOver = cat.amount > cat.limit;
            const catName = lang === 'fa' ? cat.nameFa : cat.nameEn;

            return (
              <div
                key={cat.categoryId}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 text-start transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-md" style={{ backgroundColor: cat.color }} />
                    {catName}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-tabular">
                    {formatNum(cat.txCount)} {lang === 'fa' ? 'تراکنش' : 'tx'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{lang === 'fa' ? 'هزینه واقعی:' : 'Actual Expense:'}</span>
                    <span className="font-extrabold text-slate-900 dark:text-white font-tabular">
                      {formatNum(cat.amount)} {t.toman}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{lang === 'fa' ? 'سقف بودجه:' : 'Budget Limit:'}</span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingLimit}
                          onChange={(e) => setEditingLimit(e.target.value)}
                          className="w-24 px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-emerald-400 text-xs text-slate-900 dark:text-white font-bold outline-none font-tabular"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveLimit(cat.categoryId)}
                          className="p-1 rounded bg-emerald-600 text-white"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-bold text-slate-700 dark:text-slate-300 font-tabular">
                        {formatNum(cat.limit)} {t.toman}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-rose-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(cat.budgetUsagePercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                      {isOver
                        ? lang === 'fa'
                          ? 'فراتر از بودجه!'
                          : 'Over budget!'
                        : lang === 'fa'
                        ? 'در محدوده بودجه'
                        : 'Within budget'}
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-tabular">%{formatNum(cat.budgetUsagePercent)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setEditingCatId(cat.categoryId);
                      setEditingLimit(cat.limit.toString());
                    }}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {lang === 'fa' ? 'ویرایش بودجه' : 'Edit Limit'}
                  </button>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {lang === 'fa' ? `سهم: %${formatNum(cat.percentage)}` : `Share: ${formatNum(cat.percentage)}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparative Trend Chart */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-start shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            {getChartTitle()}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setTimeframe('1m')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === '1m' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isFa ? '۱ ماهه' : '1 Month'}
              </button>
              <button
                onClick={() => setTimeframe('3m')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === '3m' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isFa ? '۳ ماهه' : '3 Months'}
              </button>
              <button
                onClick={() => setTimeframe('6m')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  timeframe === '6m' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isFa ? '۶ ماهه' : '6 Months'}
              </button>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chartType === 'bar' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'fa' ? 'میله‌ای' : 'Bar'}
              </button>
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  chartType === 'area' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'fa' ? 'مساحتی' : 'Area'}
              </button>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="income" name={lang === 'fa' ? 'درآمد' : 'Income'} fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="expense" name={lang === 'fa' ? 'هزینه' : 'Expense'} fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            ) : (
              <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="income" name={lang === 'fa' ? 'درآمد' : 'Income'} stroke="#10B981" strokeWidth={2} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" name={lang === 'fa' ? 'هزینه' : 'Expense'} stroke="#F43F5E" strokeWidth={2} fill="url(#expenseGrad)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
