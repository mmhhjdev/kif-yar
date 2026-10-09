import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  Tag,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction, TransactionCategory, TransactionType } from '../types';
import { formatToman, formatShamsiDate, toPersianDigits } from '../utils/formatters';
import { parsePersianFinancialText } from '../utils/aiParser';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/initialData';

interface TransactionsViewProps {
  onOpenTransactionModal: (tx?: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenTransactionModal,
}) => {
  const { transactions, deleteTransaction, addTransaction } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [quickAiText, setQuickAiText] = useState('');

  // Quick Natural Language Add
  const handleQuickAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAiText.trim()) return;

    const parsed = parsePersianFinancialText(quickAiText);
    if (parsed.amount) {
      addTransaction({
        type: parsed.type || 'expense',
        amount: parsed.amount,
        category: (parsed.category as TransactionCategory) || 'خوراک و غذا',
        description: parsed.description || quickAiText.trim(),
        date: new Date().toISOString(),
      });
      setQuickAiText('');
    } else {
      alert('مبلغ قابل تشخیصی در متن یافت نشد. مثلاً بنویسید: «خرید نان ۲۰۰۰۰ تومان»');
    }
  };

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tx.description.toLowerCase().includes(q) ||
        tx.category.toLowerCase().includes(q) ||
        tx.amount.toString().includes(q)
      );
    }
    return true;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['نوع', 'مبلغ (تومان)', 'دسته‌بندی', 'توضیحات', 'تاریخ'];
    const rows = filtered.map((tx) => [
      tx.type === 'income' ? 'درآمد' : 'هزینه',
      tx.amount,
      tx.category,
      `"${tx.description.replace(/"/g, '""')}"`,
      formatShamsiDate(tx.date),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chandboom_transactions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-cairo">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            تراکنش‌های مالی و دفتر ثبت
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            مشاهده، جستجو، فیلتر و خروجی اکسل از کلیه درآمدها و هزینه‌های ثبت شده در سامانه چندبوم
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-cairo">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0F1512] text-zinc-700 dark:text-zinc-300 border border-[#E2E8E4] dark:border-[#1A2621] hover:bg-zinc-50 dark:hover:bg-[#16221D] text-xs font-bold transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>خروجی CSV (اکسل)</span>
          </button>

          <button
            id="open-add-transaction-modal-btn"
            onClick={() => onOpenTransactionModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت تراکنش جدید</span>
          </button>
        </div>
      </div>

      {/* Natural Language Quick Input Bar */}
      <form
        onSubmit={handleQuickAiSubmit}
        className="p-3 bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex items-center gap-2"
      >
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#121F19] text-emerald-700 dark:text-emerald-300 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={quickAiText}
          onChange={(e) => setQuickAiText(e.target.value)}
          placeholder="ثبت سریع متنی با هوش مصنوعی (مثلاً: ۳۵ هزار تومن نان سنگک یا یک میلیون حقوق)..."
          className="flex-1 text-xs sm:text-sm bg-transparent outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 font-cairo"
        />
        <button
          type="submit"
          disabled={!quickAiText.trim()}
          className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cairo font-bold transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          ثبت سریع
        </button>
      </form>

      {/* Filters Bar */}
      <div className="p-4 bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در عنوان، دسته‌بندی یا مبلغ..."
              className="w-full pr-9 pl-4 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-[#141F1A] rounded-xl text-xs font-cairo font-bold">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-[#0F1512] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              همه ({toPersianDigits(transactions.length)})
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                typeFilter === 'expense'
                  ? 'bg-white dark:bg-[#0F1512] text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              هزینه‌ها
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                typeFilter === 'income'
                  ? 'bg-white dark:bg-[#0F1512] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              درآمدها
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
            >
              <option value="all">همه دسته‌ها</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-3">
            <p className="text-xs sm:text-sm">تراکنشی با مشخصات فیلتر شده یافت نشد.</p>
            <button
              onClick={() => onOpenTransactionModal()}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs cursor-pointer shadow-xs transition"
            >
              ثبت اولین تراکنش
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-[#1A2621]/80">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/60 dark:hover:bg-[#121B17] transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-[#13251D] dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-[#251515] dark:text-rose-300'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-cairo font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {tx.description}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#15201A] text-[11px]">
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span>{formatShamsiDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-left font-cairo">
                    <span
                      className={`text-base font-bold ${
                        tx.type === 'income'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-zinc-900 dark:text-white'
                      }`}
                    >
                      {tx.type === 'income' ? '+ ' : '- '}
                      {formatToman(tx.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenTransactionModal(tx)}
                      title="ویرایش تراکنش"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-[#16251E] transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('آیا از حذف این تراکنش اطمینان دارید؟')) {
                          deleteTransaction(tx.id);
                        }
                      }}
                      title="حذف تراکنش"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-[#281515] transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
