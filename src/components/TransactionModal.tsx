import React, { useState, useEffect } from 'react';
import { X, PlusCircle, ArrowUpRight, ArrowDownLeft, Tag, Calendar, Wallet } from 'lucide-react';
import { Transaction, TransactionCategory, TransactionType } from '../types';
import { CATEGORY_METADATA, formatToman } from '../utils/formatters';
import { toJalaali, toGregorian } from 'jalaali-js'; // <--- تغییر در اینجا

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => void;
  editingTransaction?: Transaction | null;
}

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'خوراک و رستوران',
  'مسکن و اجاره',
  'حمل‌ونقل و خودرو',
  'خرید و پوشاک',
  'سرگرمی و تفریح',
  'سلامت و درمان',
  'قبوض و شارژ',
  'آموزش و کتاب',
  'سایر و متفرقه',
];

const INCOME_CATEGORIES: TransactionCategory[] = [
  'حقوق و دستمزد',
  'کسب‌وکار و فروش',
  'سرمایه‌گذاری و پس‌انداز',
  'سایر و متفرقه',
];

const ACCOUNTS: Array<'کارت اصلی' | 'حساب پس‌انداز' | 'کیف پول نقد' | 'کارت تنخواه'> = [
  'کارت اصلی',
  'حساب پس‌انداز',
  'کیف پول نقد',
  'کارت تنخواه',
];

// تبدیل تاریخ میلادی (YYYY-MM-DD) به شمسی (YYYY/MM/DD)
const gregorianToJalaaliStr = (gDateStr: string) => {
  try {
    const [gy, gm, gd] = gDateStr.split('-').map(Number);
    if (!gy || !gm || !gd) return '';
    const j = toJalaali(gy, gm, gd);
    return `${j.jy}/${j.jm.toString().padStart(2, '0')}/${j.jd.toString().padStart(2, '0')}`;
  } catch {
    return '';
  }
};

// تبدیل تاریخ شمسی (YYYY/MM/DD) به میلادی (YYYY-MM-DD) برای ذخیره در دیتابیس
const jalaaliToGregorianStr = (jDateStr: string) => {
  try {
    const [jy, jm, jd] = jDateStr.split('/').map(Number);
    if (!jy || !jm || !jd) return new Date().toISOString().split('T')[0];
    const g = toGregorian(jy, jm, jd); // <--- تغییر در اینجا
    return `${g.gy}-${g.gm.toString().padStart(2, '0')}-${g.gd.toString().padStart(2, '0')}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTransaction,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<TransactionCategory>('خوراک و رستوران');
  
  // استیت تاریخ شمسی به صورت متن YYYY/MM/DD
  const [jalaliDate, setJalaliDate] = useState<string>(() => {
    return gregorianToJalaaliStr(new Date().toISOString().split('T')[0]);
  });

  const [description, setDescription] = useState<string>('');
  const [account, setAccount] = useState<'کارت اصلی' | 'حساب پس‌انداز' | 'کیف پول نقد' | 'کارت تنخواه'>('کارت اصلی');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      // تبدیل تاریخ میلادی ذخیره شده به شمسی برای نمایش در فرم ویرایش
      setJalaliDate(gregorianToJalaaliStr(editingTransaction.date));
      setDescription(editingTransaction.description);
      setAccount(editingTransaction.account);
      setTags(editingTransaction.tags || []);
    } else {
      setType('expense');
      setAmount('');
      setCategory('خوراک و رستوران');
      setJalaliDate(gregorianToJalaaliStr(new Date().toISOString().split('T')[0]));
      setDescription('');
      setAccount('کارت اصلی');
      setTags([]);
    }
  }, [editingTransaction, isOpen]);

  // Adjust category when switching type
  useEffect(() => {
    if (!editingTransaction) {
      if (type === 'expense' && !EXPENSE_CATEGORIES.includes(category)) {
        setCategory('خوراک و رستوران');
      } else if (type === 'income' && !INCOME_CATEGORIES.includes(category)) {
        setCategory('حقوق و دستمزد');
      }
    }
  }, [type]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(val);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9\/]/g, '');
    setJalaliDate(val);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);
    if (!numAmount || numAmount <= 0) {
      return;
    }

    // تبدیل تاریخ شمسی وارد شده به میلادی استاندارد برای ارسال به دیتابیس
    const gregDate = jalaaliToGregorianStr(jalaliDate);

    onSubmit({
      type,
      amount: numAmount,
      category,
      date: gregDate,
      description: description.trim() || (type === 'expense' ? 'هزینه ثبت شده' : 'درآمد ثبت شده'),
      account,
      tags,
    });
    onClose();
  };

  const activeCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const numAmount = parseInt(amount, 10) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-vazir">
      <div
        id="transaction-modal-card"
        className="w-full max-w-lg bg-white dark:bg-[#0F1512] rounded-2xl shadow-2xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#1A2621]">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${type === 'expense' ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200' : 'bg-emerald-100 text-emerald-800 dark:bg-[#15271E] dark:text-emerald-300'}`}>
              {type === 'expense' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {editingTransaction ? 'ویرایش تراکنش' : 'ثبت تراکنش جدید در '}
              {!editingTransaction && <span className="font-brand text-emerald-800 dark:text-emerald-400">کیفیار</span>}
            </h3>
          </div>
          <button
            id="close-tx-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-[#141E1A] rounded-xl border border-[#E2E8E4] dark:border-[#1F2E27]">
            <button
              id="tx-type-expense-btn"
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-cairo font-bold text-xs sm:text-sm transition ${
                type === 'expense'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              هزینه (پرداخت / خرج)
            </button>
            <button
              id="tx-type-income-btn"
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg font-cairo font-bold text-xs sm:text-sm transition ${
                type === 'income'
                  ? 'bg-emerald-700 text-white dark:bg-emerald-600 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              درآمد (واریز / دخل)
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              مبلغ تراکنش (تومان) *
            </label>
            <div className="relative">
              <input
                id="tx-amount-input"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="مثلاً ۲۵۰۰۰۰۰"
                className="w-full pl-16 pr-4 py-3 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-lg font-bold text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none transition text-left dir-ltr"
                required
                autoFocus
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-cairo font-bold text-zinc-500 dark:text-zinc-400">
                تومان
              </span>
            </div>
            {numAmount > 0 && (
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                معادل: {formatToman(numAmount)}
              </p>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              دسته‌بندی تراکنش *
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1.5 border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl bg-zinc-50/50 dark:bg-[#141E1A]/40">
              {activeCategories.map((cat) => {
                const isSelected = category === cat;
                const meta = CATEGORY_METADATA[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-cairo font-bold border text-right transition ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-[#162B21] dark:text-emerald-300 ring-1 ring-emerald-600'
                        : 'border-[#E2E8E4] dark:border-[#1F2E27] bg-white dark:bg-[#121A16] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta?.color || '#15803d' }} />
                    <span className="truncate">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" />
                حساب / منبع مالی
              </label>
              <select
                id="tx-account-select"
                value={account}
                onChange={(e) => setAccount(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none font-vazir"
              >
                {ACCOUNTS.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                تاریخ تراکنش (شمسی)
              </label>
              <input
               id="tx-date-input"
               type="text"
               value={jalaliDate}
               onChange={handleDateChange}
               placeholder="1405/06/18"
               maxLength={10}
               className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none text-center font-vazir"
/>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              توضیحات و یادداشت
            </label>
            <input
              id="tx-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثلاً خرید مایحتاج ماهانه یا پرداخت اجاره"
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              برچسب‌ها (اینتر برای افزودن)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-[#162920] text-emerald-800 dark:text-emerald-300 text-xs font-medium border border-emerald-200/50 dark:border-emerald-900/40"
                >
                  #{tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="text-emerald-600 hover:text-rose-500">
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="تگ جدید بنویسید و Enter بزنید..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E4] dark:border-[#1A2621]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-cairo font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition"
            >
              انصراف
            </button>
            <button
              id="submit-tx-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-cairo font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              {editingTransaction ? 'ذخیره تغییرات' : 'ثبت نهایی تراکنش'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};