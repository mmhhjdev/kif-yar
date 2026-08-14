import React, { useState, useEffect } from 'react';
import { X, Check, ArrowUpRight, ArrowDownRight, Edit3 } from 'lucide-react';
import { Transaction, CategoryId, TransactionType } from '../types';
import { CATEGORIES } from '../data/initialData';
import { Language, translations } from '../data/translations';
import { getLiveShamsiDate } from '../utils/formatters';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  initialData?: Transaction | null;
  lang: Language;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  lang,
}) => {
  const t = translations[lang];

  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<CategoryId>('food');
  const [date, setDate] = useState('');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setDate(initialData.date);
      setMerchant(initialData.merchant || '');
      setNotes(initialData.notes || '');
    } else {
      setType('expense');
      setTitle('');
      setAmount('');
      setCategory('food');
      setDate(getLiveShamsiDate(lang));
      setMerchant('');
      setNotes('');
    }
  }, [initialData, isOpen, lang]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/,/g, ''));
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    onSave({
      id: initialData?.id,
      title: title.trim(),
      amount: numAmount,
      type,
      category,
      date: date || getLiveShamsiDate(lang),
      merchant: merchant.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const filteredCategories = CATEGORIES.filter((c) => c.type === 'both' || c.type === type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity overflow-y-auto">
      <div className="relative w-full max-w-lg my-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-5 sm:p-6 text-start max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
              <Edit3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {initialData ? (lang === 'fa' ? 'ویرایش تراکنش مالی' : 'Edit Transaction') : t.addTransaction}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type Switch (Income vs Expense) */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('food');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              {t.expense}
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('salary');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              {t.income}
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.amount} (<span className="text-emerald-700 dark:text-emerald-400 font-bold">{t.toman}</span>) *
            </label>
            <div className="relative">
              <input
                type="number"
                required
                placeholder="5000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rtl:pl-12 rtl:pr-4 ltr:pr-12 ltr:pl-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-base font-bold font-tabular outline-none transition-all placeholder:text-slate-400"
              />
              <span className="absolute rtl:left-3 ltr:right-3 top-3.5 text-xs text-slate-500 dark:text-slate-400 font-medium">{t.toman}</span>
            </div>
          </div>

          {/* Title / Description Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.title} *</label>
            <input
              type="text"
              required
              placeholder={type === 'expense' ? (lang === 'fa' ? 'مثال: خرید از سوپرمارکت' : 'e.g. Grocery shopping') : (lang === 'fa' ? 'مثال: واریز حقوق' : 'e.g. Salary payout')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Category Select Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.category} *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto rtl:pr-1 ltr:pl-1">
              {filteredCategories.map((cat) => {
                const isSelected = category === cat.id;
                const catName = lang === 'fa' ? cat.nameFa : cat.nameEn;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium text-start transition-all border ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate">{catName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Merchant/Party Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.date}</label>
              <input
                type="text"
                placeholder={lang === 'fa' ? '1403/05/20' : '2026-08-10'}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs font-tabular outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.merchant}</label>
              <input
                type="text"
                placeholder={lang === 'fa' ? 'مثال: هایپرمی' : 'e.g. Store / Market'}
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">{t.notes}</label>
            <input
              type="text"
              placeholder={lang === 'fa' ? 'یادداشت در مورد این تراکنش...' : 'Notes about this transaction...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 text-slate-900 dark:text-white text-xs outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
