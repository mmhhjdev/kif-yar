import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Trash2,
  Edit2,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';
import {
  formatToman,
  toPersianDigits,
} from '../utils/formatters';

interface TransactionsViewProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const { transactions, deleteTransaction } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        // Category filter
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
        // Account filter
        if (accountFilter !== 'all' && tx.account !== accountFilter) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchDesc = tx.description.toLowerCase().includes(q);
          const matchCat = tx.category.toLowerCase().includes(q);
          const matchTags = tx.tags?.some((t) => t.toLowerCase().includes(q)) || false;
          const matchAmount = tx.amount.toString().includes(q);
          if (!matchDesc && !matchCat && !matchTags && !matchAmount) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, typeFilter, categoryFilter, accountFilter, searchQuery, sortBy]);

  // Filtered totals
  const filteredIncome = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const filteredExpense = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ردیف', 'نوع', 'مبلغ (تومان)', 'دسته‌بندی', 'تاریخ', 'توضیحات', 'حساب', 'برچسب‌ها'];
    const rows = filteredTransactions.map((tx, idx) => [
      idx + 1,
      tx.type === 'expense' ? 'هزینه' : 'درآمد',
      tx.amount,
      `"${tx.category}"`,
      tx.date,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${tx.account}"`,
      `"${(tx.tags || []).join('، ')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kifyar_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allCategories = Array.from(new Set(transactions.map((t) => t.category)));

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-vazir">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            دفتر کل تراکنش‌های مالی <span className="font-brand text-emerald-800 dark:text-emerald-400">کیفیار</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            ثبت، جستجو، ویرایش و دسته‌بندی تمامی تراکنش‌های دخل و خرج
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] bg-white hover:bg-emerald-50/50 dark:bg-[#0F1512] dark:hover:bg-[#16201B] text-xs font-cairo font-semibold text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>خروجی اکسل / CSV</span>
          </button>

          <button
            id="add-transaction-main-btn"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-cairo font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ثبت تراکنش جدید</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white dark:bg-[#0F1512] p-4 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-transactions-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در شرح، تگ‌ها یا دسته‌ها..."
              className="w-full pr-10 pl-4 py-2 bg-zinc-50 dark:bg-[#141F1A] border border-[#E2E8E4] dark:border-[#1A2621] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <select
              id="filter-type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141F1A] border border-[#E2E8E4] dark:border-[#1A2621] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 outline-none font-cairo"
            >
              <option value="all">همه تراکنش‌ها (دخل و خرج)</option>
              <option value="expense">فقط هزینه‌ها (خرج)</option>
              <option value="income">فقط درآمدها (دخل)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              id="filter-category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141F1A] border border-[#E2E8E4] dark:border-[#1A2621] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 outline-none font-cairo"
            >
              <option value="all">تمامی دسته‌بندی‌ها</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              id="sort-transactions-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141F1A] border border-[#E2E8E4] dark:border-[#1A2621] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 outline-none font-cairo"
            >
              <option value="date_desc">جدیدترین به قدیمی‌ترین</option>
              <option value="date_asc">قدیمی‌ترین به جدیدترین</option>
              <option value="amount_desc">بیشترین مبلغ</option>
              <option value="amount_asc">کمترین مبلغ</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8E4] dark:border-[#1A2621] text-xs font-cairo font-semibold">
          <span className="text-zinc-500 dark:text-zinc-400 font-vazir">
            تعداد نتایج: {toPersianDigits(filteredTransactions.length)} تراکنش
          </span>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700 dark:text-emerald-400">
              مجموع درآمد: {formatToman(filteredIncome)}
            </span>
            <span className="text-zinc-700 dark:text-zinc-300">
              مجموع هزینه: {formatToman(filteredExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden shadow-xs">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 space-y-3">
            <p className="font-semibold text-sm">هیچ تراکنشی با فیلترهای انتخابی یافت نشد.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setCategoryFilter('all');
              }}
              className="text-xs text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              پاک کردن همه فیلترها
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-emerald-50/50 dark:bg-[#141F1A] text-zinc-700 dark:text-zinc-200 font-cairo font-bold border-b border-[#E2E8E4] dark:border-[#1A2621]">
                <tr>
                  <th className="py-3.5 px-4">نوع و دسته‌بندی</th>
                  <th className="py-3.5 px-4">شرح تراکنش</th>
                  <th className="py-3.5 px-4">حساب / کیف</th>
                  <th className="py-3.5 px-4">تاریخ</th>
                  <th className="py-3.5 px-4 text-left">مبلغ (تومان)</th>
                  <th className="py-3.5 px-4 text-center w-24">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E4] dark:divide-[#1A2621] font-vazir">
                {filteredTransactions.map((tx) => {
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-emerald-50/30 dark:hover:bg-[#131E19] transition group"
                    >
                      {/* Type & Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              tx.type === 'expense'
                                ? 'bg-zinc-100 text-zinc-700 dark:bg-[#16221D] dark:text-zinc-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-[#121F19] dark:text-emerald-300'
                            }`}
                          >
                            {tx.type === 'expense' ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-cairo font-bold text-zinc-900 dark:text-zinc-100 block">
                              {tx.category}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {tx.type === 'expense' ? 'هزینه' : 'درآمد'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Description & Tags */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-zinc-800 dark:text-zinc-200 max-w-xs truncate">
                          {tx.description}
                        </p>
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tx.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-[#16221D] px-1.5 py-0.5 rounded"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Account */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400 text-xs">
                        <span className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-[#16221D] px-2 py-0.5 rounded-md">
                          <Wallet className="w-3 h-3 text-zinc-400" />
                          {tx.account}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400 text-xs">
                        {toPersianDigits(tx.date)}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-left">
                        <span
                          className={`font-cairo text-sm font-bold ${
                            tx.type === 'expense'
                              ? 'text-zinc-800 dark:text-zinc-200'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {tx.type === 'expense' ? '-' : '+'} {formatToman(tx.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`edit-tx-${tx.id}`}
                            onClick={() => onOpenEditModal(tx)}
                            title="ویرایش تراکنش"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-[#16201B] transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-tx-${tx.id}`}
                            onClick={() => {
                              if (confirm('آیا از حذف این تراکنش اطمینان دارید؟')) {
                                deleteTransaction(tx.id);
                              }
                            }}
                            title="حذف تراکنش"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
