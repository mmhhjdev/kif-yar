import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  ArrowUpRight,
  ArrowDownRight,
  ReceiptText,
  FileSpreadsheet,
  FileCode,
  X,
  ChevronDown,
} from 'lucide-react';
import { Transaction, FilterState } from '../types';
import { CATEGORIES } from '../data/initialData';
import { getCategoryById, exportTransactionsCSV } from '../utils/formatters';
import { Language, translations } from '../data/translations';

interface TransactionsViewProps {
  transactions: Transaction[];
  onOpenNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  lang: Language;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  lang,
}) => {
  const t = translations[lang];
  const formatNum = (num: number) => num.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    type: 'all',
    category: 'all',
    sortBy: 'date-desc',
  });

  // Filter & Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search query check
        const matchSearch =
          !filters.searchQuery ||
          tx.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          (tx.merchant && tx.merchant.toLowerCase().includes(filters.searchQuery.toLowerCase())) ||
          (tx.notes && tx.notes.toLowerCase().includes(filters.searchQuery.toLowerCase()));

        // Type check
        const matchType = filters.type === 'all' || tx.type === filters.type;

        // Category check
        const matchCategory = filters.category === 'all' || tx.category === filters.category;

        return matchSearch && matchType && matchCategory;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'date-desc') return b.date.localeCompare(a.date);
        if (filters.sortBy === 'date-asc') return a.date.localeCompare(b.date);
        if (filters.sortBy === 'amount-desc') return b.amount - a.amount;
        if (filters.sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, filters]);

  // Export JSON backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `walletyar-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto relative">
      {/* Floating Action Button (+) */}
      <button
        onClick={onOpenNewTransaction}
        className="fixed bottom-20 lg:bottom-8 left-6 z-30 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-4 shadow-xl flex items-center gap-2 text-xs font-extrabold transition-all active:scale-95"
        title={t.addTransaction}
      >
        <Plus className="w-5 h-5 stroke-[3]" />
        <span className="hidden md:inline">{t.addTransaction}</span>
      </button>

      {/* Header Banner & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-emerald-600" />
            {t.transactionsTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'fa'
              ? 'مشاهده، ویرایش، حذف، جستجو و خروجی استاندارد از تمام واریزها و برداشت‌ها'
              : 'View, edit, delete, search, and export all deposits & withdrawals'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportTransactionsCSV(filteredTransactions)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
            title={lang === 'fa' ? 'خروجی CSV برای اکسل' : 'CSV Export for Excel'}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">{lang === 'fa' ? 'خروجی اکسل (CSV)' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
            title={lang === 'fa' ? 'پشتیبان‌گیری JSON' : 'JSON Backup'}
          >
            <FileCode className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">{lang === 'fa' ? 'پشتیبان JSON' : 'Backup JSON'}</span>
          </button>

          <button
            onClick={onOpenNewTransaction}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {t.addTransaction}
          </button>
        </div>
      </div>

      {/* Smart Search & Filter Control Panel */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs text-start">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute rtl:right-3.5 rtl:left-auto ltr:left-3.5 ltr:right-auto top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full rtl:pr-10 rtl:pl-4 ltr:pl-10 ltr:pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none transition-all placeholder:text-slate-400"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute rtl:left-3 ltr:right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter (All, Income, Expense) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, type: 'all' }))}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                filters.type === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, type: 'income' }))}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                filters.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {t.incomes}
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, type: 'expense' }))}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
                filters.type === 'expense' ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {t.expenses}
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none appearance-none cursor-pointer"
            >
              <option value="all">{lang === 'fa' ? 'تمام دسته‌بندی‌ها' : 'All Categories'}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {lang === 'fa' ? cat.nameFa : cat.nameEn}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute rtl:left-3 ltr:right-3 top-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort By Dropdown */}
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none appearance-none cursor-pointer"
            >
              <option value="date-desc">{lang === 'fa' ? 'جدیدترین به قدیمی‌ترین' : 'Newest to Oldest'}</option>
              <option value="date-asc">{lang === 'fa' ? 'قدیمی‌ترین به جدیدترین' : 'Oldest to Newest'}</option>
              <option value="amount-desc">{lang === 'fa' ? 'بیشترین مبلغ به کمترین' : 'Highest Amount'}</option>
              <option value="amount-asc">{lang === 'fa' ? 'کمترین مبلغ به بیشترین' : 'Lowest Amount'}</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute rtl:left-3 ltr:right-3 top-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Total Stats Banner for Filtered Results */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
          <span>
            {lang === 'fa' ? 'تعداد نتایج یافت‌شده:' : 'Results found:'}{' '}
            <strong className="text-slate-900 dark:text-white font-tabular">{formatNum(filteredTransactions.length)} {lang === 'fa' ? 'مورد' : 'items'}</strong>
          </span>
          {filters.searchQuery || filters.type !== 'all' || filters.category !== 'all' ? (
            <button
              onClick={() =>
                setFilters({ searchQuery: '', type: 'all', category: 'all', sortBy: 'date-desc' })
              }
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-bold"
            >
              {lang === 'fa' ? 'پاک کردن فیلترها' : 'Clear Filters'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Transactions Table & Mobile Responsive Cards */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <ReceiptText className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {lang === 'fa' ? 'تراکنشی با مشخصات مد نظر یافت نشد.' : 'No transactions found.'}
            </p>
            <p className="text-xs text-slate-400">
              {lang === 'fa' ? 'فیلترها را تغییر داده یا تراکنش جدیدی ثبت کنید.' : 'Adjust filters or record a new transaction.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View (Visible on Small Screens < md) */}
            <div className="md:hidden space-y-3">
              {filteredTransactions.map((tx) => {
                const cat = getCategoryById(tx.category);
                const isIncome = tx.type === 'income';
                const catName = lang === 'fa' ? cat.nameFa : cat.nameEn;

                return (
                  <div
                    key={tx.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isIncome ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {tx.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {tx.date} {tx.merchant ? `• ${tx.merchant}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <div
                          className={`text-xs font-extrabold font-tabular ${
                            isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isIncome ? '+' : '-'}
                          {formatNum(tx.amount)}
                          <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 mx-1">{t.toman}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1"
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          {catName}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isIncome
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isIncome ? t.income : t.expense}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title={t.edit}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title={t.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {tx.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        {tx.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (Visible on md and larger) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    <th className="py-3.5 px-4">{t.date}</th>
                    <th className="py-3.5 px-4">{t.title}</th>
                    <th className="py-3.5 px-4">{t.category}</th>
                    <th className="py-3.5 px-4">{t.type}</th>
                    <th className="py-3.5 px-4">{t.merchant}</th>
                    <th className="py-3.5 px-4">{t.amount} ({t.toman})</th>
                    <th className="py-3.5 px-4 text-center">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-tabular">
                  {filteredTransactions.map((tx) => {
                    const cat = getCategoryById(tx.category);
                    const isIncome = tx.type === 'income';
                    const catName = lang === 'fa' ? cat.nameFa : cat.nameEn;

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-300">{tx.date}</td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            {tx.title}
                          </div>
                          {tx.notes && <div className="text-[11px] text-slate-400 mt-0.5">{tx.notes}</div>}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5"
                            style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {catName}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isIncome
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {isIncome ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {isIncome ? t.income : t.expense}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">
                          {tx.merchant || '—'}
                        </td>
                        <td className="py-4 px-4 font-extrabold text-sm">
                          <span className={isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                            {isIncome ? '+' : '-'}
                            {formatNum(tx.amount)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={t.edit}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteTransaction(tx.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title={t.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
