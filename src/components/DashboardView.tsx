import React from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ReceiptText,
  ChevronRight,
  Users,
  PieChart,
  Target,
  Edit,
  Trash2,
  Calendar,
} from 'lucide-react';
import { Transaction, UserProfile, DongGroup } from '../types';
import { calculateTotals, getTopExpenseCategory, getLiveShamsiDate } from '../utils/formatters';
import { CATEGORIES } from '../data/initialData';
import { Language, translations } from '../data/translations';

interface DashboardViewProps {
  transactions: Transaction[];
  profile: UserProfile;
  dongs: DongGroup[];
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onNavigateToTransactions: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToDong: () => void;
  lang: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  profile,
  dongs,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onNavigateToTransactions,
  onNavigateToAnalytics,
  onNavigateToDong,
  lang,
}) => {
  const t = translations[lang];
  const formatNum = (num: number) => num.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');

  const { totalIncome, totalExpense, netSavings, savingsRate } = calculateTotals(transactions);
  const totalBalance = profile.currentBalance + netSavings;
  const topExpenseCategory = getTopExpenseCategory(transactions);

  const goalPercent = Math.min(Math.round((netSavings / profile.monthlyGoal) * 100), 100);

  // Helper to resolve category metadata
  const getCategoryById = (catId: string) => {
    return (
      CATEGORIES.find((c) => c.id === catId) || {
        nameFa: 'سایر موارد',
        nameEn: 'Other',
        color: '#64748B',
      }
    );
  };

  // Top 5 Categories Breakdown
  const categoryTotals = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .map(([catId, rawAmount]) => {
      const amount = Number(rawAmount);
      const cat = getCategoryById(catId);
      const percentage = totalExpense > 0 ? Math.round((amount / Number(totalExpense)) * 100) : 0;
      return { categoryId: catId, nameFa: cat.nameFa, nameEn: cat.nameEn, amount, percentage, color: cat.color };
    })
    .sort((a, b) => Number(b.amount) - Number(a.amount));

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto">
      {/* Date & Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            {lang === 'fa' ? `خوش آمدید، ${profile.name}` : `Welcome, ${profile.name}`} 👋
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'fa'
              ? 'خلاصه وضعیت مالی، ورودی و خروجی‌ها و حسابداری کاربر'
              : 'Financial summary, income, expenses & account overview'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto font-medium">
          <Calendar className="w-4 h-4 text-emerald-600" />
          {lang === 'fa' ? 'امروز:' : 'Today:'}{' '}
          <span className="font-bold text-slate-900 dark:text-white font-tabular">
            {getLiveShamsiDate(lang)}
          </span>
        </div>
      </div>

      {/* 1. High-Impact Financial Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Total Net Worth Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-start shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-3">
            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
              <Wallet className="w-4 h-4 text-emerald-600" />
              {t.currentBalance}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
              {t.live}
            </span>
          </div>

          <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white font-tabular tracking-tight my-2">
            {formatNum(totalBalance)}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t.toman}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
            <span>{lang === 'fa' ? 'پس‌انداز خالص این ماه:' : 'Net Savings This Month:'}</span>
            <span className={`font-bold font-tabular ${netSavings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {netSavings >= 0 ? '+' : ''}
              {formatNum(netSavings)} {t.toman}
            </span>
          </div>
        </div>

        {/* Monthly Income Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-start shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-3">
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              {t.monthlyIncome}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>

          <div className="text-2xl lg:text-3xl font-black text-emerald-600 font-tabular tracking-tight my-2">
            +{formatNum(totalIncome)}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t.toman}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
            <span>{lang === 'fa' ? 'نرخ پس‌انداز از درآمد:' : 'Savings Rate:'}</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 font-tabular">
              {formatNum(savingsRate)}%
            </span>
          </div>
        </div>

        {/* Monthly Expense Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-start shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium mb-3">
            <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold">
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              {t.monthlyExpense}
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>

          <div className="text-2xl lg:text-3xl font-black text-rose-600 font-tabular tracking-tight my-2">
            -{formatNum(totalExpense)}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t.toman}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
            <span>{lang === 'fa' ? 'تعداد کل تراکنش‌ها:' : 'Total Transactions:'}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 font-tabular">
              {formatNum(transactions.length)} {lang === 'fa' ? 'مورد' : 'items'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Feature Cards (Dongs, Budgeting, Transactions) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Dong Shortcut Card */}
        <div
          onClick={onNavigateToDong}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer shadow-xs group text-start"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs text-teal-700 dark:text-teal-300 font-bold bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg">
              {formatNum(dongs.length)} {lang === 'fa' ? 'گروه فعال' : 'active groups'}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-700 transition-colors">
            {t.dongTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'fa'
              ? 'مدیریت هزینه‌های سفر، کافه و تسویه آسان'
              : 'Split group bills, trip expenses & settlements'}
          </p>
        </div>

        {/* Budgeting Shortcut Card */}
        <div
          onClick={onNavigateToAnalytics}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer shadow-xs group text-start"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <PieChart className="w-5 h-5" />
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
              {lang === 'fa' ? 'بودجه‌بندی' : 'Budgeting'}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 transition-colors">
            {t.analyticsTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'fa'
              ? 'نمودار تفکیک ماهانه و کنترل سقف مخارج'
              : 'Monthly expense breakdown & limits'}
          </p>
        </div>

        {/* Transactions Shortcut Card */}
        <div
          onClick={onNavigateToTransactions}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer shadow-xs group text-start"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
              <ReceiptText className="w-5 h-5" />
            </div>
            <span className="text-xs text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg font-tabular">
              {formatNum(transactions.length)} {lang === 'fa' ? 'تراکنش' : 'tx'}
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-700 transition-colors">
            {t.transactionsTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'fa'
              ? 'جستجو، فیلتر پیشرفته و خروجی کامل'
              : 'Search, filter and export full history'}
          </p>
        </div>
      </div>

      {/* 3. Clean Financial Target Summary Banner */}
      <div className="p-6 rounded-2xl bg-emerald-900 text-white shadow-sm text-start space-y-4 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold border border-emerald-700">
              <Target className="w-3.5 h-3.5 text-emerald-300" />
              {lang === 'fa' ? 'وضعیت پس‌انداز و هدف مالی' : 'Savings & Financial Goal'}
            </div>

            <h3 className="text-base lg:text-lg font-extrabold text-white">
              {topExpenseCategory
                ? lang === 'fa'
                  ? `پرخرج‌ترین دسته‌بندی این ماه شما "${topExpenseCategory.nameFa}" با سهم %${formatNum(topExpenseCategory.percentage)} است.`
                  : `Your top expense category this month is "${topExpenseCategory.nameFa}" (${formatNum(topExpenseCategory.percentage)}%).`
                : lang === 'fa'
                ? 'خلاصه وضعیت و اهداف پس‌انداز ماهانه شما'
                : 'Summary of your monthly savings goals'}
            </h3>

            <p className="text-xs text-emerald-100 leading-relaxed max-w-2xl">
              {lang === 'fa'
                ? `هدف پس‌انداز ماهانه شما ${formatNum(profile.monthlyGoal)} تومان تعریف شده که تا کنون %${formatNum(goalPercent)} آن محقق شده است.`
                : `Your monthly target savings is ${formatNum(profile.monthlyGoal)} Tomans (${formatNum(goalPercent)}% achieved so far).`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenNewTransaction}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-extrabold transition-all shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              {t.newTx}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Recent Transactions List & Expense Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List (2 columns) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-start shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'fa' ? 'آخرین تراکنش‌های ثبت‌شده' : 'Recent Transactions'}
              </h3>
            </div>
            <button
              onClick={onNavigateToTransactions}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              {lang === 'fa' ? 'مشاهده همه' : 'View All'}
              <ChevronRight className={`w-4 h-4 ${lang === 'fa' ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {lang === 'fa'
                ? 'هنوز تراکنشی ثبت نشده است. روی دکمه "ثبت تراکنش" کلیک کنید.'
                : 'No transactions recorded yet. Click "New Transaction".'}
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                const cat = getCategoryById(tx.category);
                const isIncome = tx.type === 'income';
                const catName = lang === 'fa' ? cat.nameFa : cat.nameEn;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 hover:border-slate-300 transition-all group gap-2"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isIncome ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 transition-colors truncate">
                          {tx.title}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span
                            className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium shrink-0"
                            style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                          >
                            {catName}
                          </span>
                          <span className="truncate">• {tx.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="text-end">
                        <div
                          className={`text-xs font-extrabold font-tabular ${
                            isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatNum(tx.amount)}
                          <span className="text-[9px] sm:text-[10px] font-normal text-slate-500 dark:text-slate-400 mx-1">{t.toman}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 sm:gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title={lang === 'fa' ? 'ویرایش' : 'Edit'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title={lang === 'fa' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense Category Breakdown Progress (Right column) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-start shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'fa' ? 'تفکیک هزینه‌ها' : 'Expense Breakdown'}
            </h3>
            <button
              onClick={onNavigateToAnalytics}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800"
            >
              {lang === 'fa' ? 'نمودار جامع' : 'Full Chart'}
            </button>
          </div>

          <div className="space-y-3.5">
            {topCategories.slice(0, 5).map((cat) => (
              <div key={cat.categoryId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {lang === 'fa' ? cat.nameFa : cat.nameEn}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white font-tabular">% {formatNum(cat.percentage)}</span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Target Progress Bar Widget */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Target className="w-4 h-4 text-emerald-600" />
                {lang === 'fa' ? 'تحقق هدف پس‌انداز' : 'Savings Goal Progress'}
              </span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 font-tabular">%{formatNum(goalPercent)}</span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${goalPercent}%` }}
              />
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 text-start font-tabular">
              {formatNum(netSavings)} / {formatNum(profile.monthlyGoal)} {t.toman}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
