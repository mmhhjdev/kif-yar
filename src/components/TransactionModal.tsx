import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Calendar as CalendarIcon,
  Tag as TagIcon,
  Bot,
  Sparkles,
  Lock,
  Crown,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction, TransactionCategory, TransactionType } from '../types';
import { parsePersianFinancialText } from '../utils/aiParser';
import { formatToman } from '../utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

// Category configs matching image.png with specific colored dots
interface CategoryOption {
  name: TransactionCategory;
  dotColor: string;
}

const EXPENSE_CATEGORY_OPTIONS: CategoryOption[] = [
  { name: 'خوراک و رستوران', dotColor: 'bg-orange-500' },
  { name: 'مسکن و اجاره', dotColor: 'bg-blue-500' },
  { name: 'حمل‌ونقل و خودرو', dotColor: 'bg-cyan-500' },
  { name: 'خرید و پوشاک', dotColor: 'bg-pink-500' },
  { name: 'سرگرمی و تفریح', dotColor: 'bg-purple-500' },
  { name: 'سلامت و درمان', dotColor: 'bg-red-500' },
  { name: 'قبوض و شارژ', dotColor: 'bg-yellow-500' },
  { name: 'آموزش و کتاب', dotColor: 'bg-teal-500' },
  { name: 'سایر و متفرقه', dotColor: 'bg-slate-400' },
];

const INCOME_CATEGORY_OPTIONS: CategoryOption[] = [
  { name: 'حقوق و دستمزد', dotColor: 'bg-emerald-500' },
  { name: 'سرمایه‌گذاری و سود', dotColor: 'bg-blue-500' },
  { name: 'هدیه و پاداش', dotColor: 'bg-purple-500' },
  { name: 'فروش و کسب‌وکار', dotColor: 'bg-orange-500' },
  { name: 'سایر دریافتی‌ها', dotColor: 'bg-slate-400' },
];

const ACCOUNT_OPTIONS = ['کارت اصلی', 'کارت دوم', 'حساب پس‌انداز', 'صندوق نقدی'];

// Helper for Shamsi date string e.g. "1405/07/15"
function getInitialShamsiDate(): string {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.format(new Date()).split('/');
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
  } catch {}
  return '1405/07/15';
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
}) => {
  const {
    addTransaction,
    updateTransaction,
    isAuthenticated,
    isProUser,
    setIsAuthModalOpen,
    setActiveTab,
  } = useApp();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<TransactionCategory>('خوراک و رستوران');
  const [account, setAccount] = useState<string>('کارت اصلی');
  const [shamsiDate, setShamsiDate] = useState<string>(getInitialShamsiDate());
  const [description, setDescription] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');

  // Integrated AI text auto-fill state
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setAccount(editingTransaction.account || 'کارت اصلی');
      setTags(editingTransaction.tags || []);
    } else {
      setType('expense');
      setAmount('');
      setCategory('خوراک و رستوران');
      setAccount('کارت اصلی');
      setShamsiDate(getInitialShamsiDate());
      setDescription('');
      setTags([]);
      setAiPrompt('');
      setAiFeedback(null);
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const activeCategoryOptions =
    type === 'expense' ? EXPENSE_CATEGORY_OPTIONS : INCOME_CATEGORY_OPTIONS;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'expense') {
      setCategory('خوراک و رستوران');
    } else {
      setCategory('حقوق و دستمزد');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const clean = tagInput.trim();
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tToRemove: string) => {
    setTags(tags.filter((t) => t !== tToRemove));
  };

  // Smart Typing AI Assistant Auto-Fill
  const handleAiAutoFill = () => {
    if (!aiPrompt.trim()) return;

    if (!isAuthenticated) {
      setAiFeedback('⚠️ لطفاً ابتدا وارد حساب کاربری خود در چندبوم شوید.');
      setTimeout(() => setIsAuthModalOpen(true), 1200);
      return;
    }

    if (!isProUser) {
      setAiFeedback('🔒 هوش مصنوعی چندبوم منحصراً ویژه کاربران اشتراک طلایی (پرو) است.');
      return;
    }

    const parsed = parsePersianFinancialText(aiPrompt);

    if (parsed.type) {
      setType(parsed.type);
    }
    if (parsed.amount) {
      setAmount(parsed.amount.toString());
    }
    if (parsed.category) {
      setCategory(parsed.category);
    }
    if (parsed.description) {
      setDescription(parsed.description);
    }

    if (aiPrompt.includes('کارت دوم')) setAccount('کارت دوم');
    else if (aiPrompt.includes('نقد') || aiPrompt.includes('صندوق') || aiPrompt.includes('اسکناس')) setAccount('صندوق نقدی');
    else if (aiPrompt.includes('پس انداز') || aiPrompt.includes('پس‌انداز')) setAccount('حساب پس‌انداز');

    setAiFeedback('✅ فیلدها توسط هوش مصنوعی چندبوم به طور خودکار تکمیل شدند!');
    setTimeout(() => setAiFeedback(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount.replace(/,/g, ''), 10);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        amount: numAmount,
        category,
        account,
        description: description.trim() || category,
        tags,
        date: new Date().toISOString(),
      });
    } else {
      addTransaction({
        type,
        amount: numAmount,
        category,
        account,
        description: description.trim() || category,
        tags,
        date: new Date().toISOString(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs font-cairo overflow-y-auto">
      <div
        id="transaction-modal-card"
        className="w-full max-w-lg bg-[#0C1411] rounded-3xl shadow-2xl border border-[#1A2822] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-white my-auto max-h-[95vh] flex flex-col"
        dir="rtl"
      >
        {/* Modal Header matching image.png */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A2822] bg-[#0E1714]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#15231D] border border-[#21352C] flex items-center justify-center text-zinc-300">
              <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-cairo text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
              <span>ثبت تراکنش جدید در</span>
              <span className="text-emerald-400 font-brand font-black">چندبوم</span>
            </h3>
          </div>

          <button
            id="close-transaction-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1A2822] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 1. Type Switcher Tabs matching image.png */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#13201A] rounded-2xl border border-[#1F3128]">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-cairo font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                type === 'expense'
                  ? 'bg-white text-zinc-950 shadow-md font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>هزینه (پرداخت / خرج)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-cairo font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                type === 'income'
                  ? 'bg-white text-zinc-950 shadow-md font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>درآمد (واریز / دخل)</span>
            </button>
          </div>

          {/* 2. Integrated Smart Typing AI Bar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#102019] to-[#0E1714] border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-cairo font-bold text-emerald-300">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>تکمیل هوشمند با هوش مصنوعی چندبوم</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-400 text-zinc-950 font-black">
                  Pro
                </span>
              </div>

              {!isProUser && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setActiveTab('subscription');
                  }}
                  className="text-[10px] text-amber-300 hover:underline flex items-center gap-1 font-bold"
                >
                  <Crown className="w-3 h-3" />
                  <span>خرید اشتراک طلایی پرو</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAiAutoFill();
                  }
                }}
                placeholder="مثلاً بنویسید: خرید میوه ۸۵ هزار تومن با کارت اصلی..."
                className="flex-1 px-3 py-2 bg-black/40 border border-[#1F3128] rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 font-cairo"
              />
              <button
                type="button"
                onClick={handleAiAutoFill}
                className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-cairo font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تشخیص خودکار</span>
              </button>
            </div>

            {aiFeedback && (
              <p className="text-[11px] text-amber-300 font-bold animate-in fade-in duration-150">
                {aiFeedback}
              </p>
            )}
          </div>

          {/* 3. Amount Field matching image.png */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-300 mb-1.5">
              مبلغ تراکنش (تومان) *
            </label>
            <div className="relative">
              <input
                id="transaction-amount-input"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="مثلاً ۲۵۰۰۰۰۰ تومان"
                required
                className="w-full px-4 py-3 bg-[#13201A] border border-[#1F3128] rounded-2xl text-xl font-cairo font-black text-white outline-none focus:border-emerald-500 placeholder-zinc-500 font-mono tracking-wider"
              />
              {amount && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-cairo text-emerald-400 font-bold">
                  {formatToman(parseInt(amount || '0', 10))}
                </span>
              )}
            </div>
          </div>

          {/* 4. Category Grid Pills matching image.png */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-300 mb-2">
              دسته‌بندی تراکنش *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeCategoryOptions.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`p-2.5 rounded-2xl text-xs font-cairo font-bold flex items-center gap-2 transition cursor-pointer border text-right ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-[#1F3128] bg-[#121E19] text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.dotColor} shrink-0`} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Row: Account & Shamsi Date matching image.png */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                <span>حساب / منبع مالی</span>
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#13201A] border border-[#1F3128] rounded-xl text-xs font-cairo text-white outline-none focus:border-emerald-500"
              >
                {ACCOUNT_OPTIONS.map((acc) => (
                  <option key={acc} value={acc} className="bg-[#121E19] text-white">
                    {acc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
                <span>تاریخ تراکنش (شمسی)</span>
              </label>
              <input
                type="text"
                value={shamsiDate}
                onChange={(e) => setShamsiDate(e.target.value)}
                placeholder="1405/07/15"
                className="w-full px-3.5 py-2.5 bg-[#13201A] border border-[#1F3128] rounded-xl text-xs font-mono text-white outline-none focus:border-emerald-500 text-center"
                dir="ltr"
              />
            </div>
          </div>

          {/* 6. Description / Notes matching image.png */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-300 mb-1.5">
              توضیحات و یادداشت
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثلاً خرید مایحتاج ماهانه یا پرداخت اجاره"
              className="w-full px-3.5 py-2.5 bg-[#13201A] border border-[#1F3128] rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 font-cairo"
            />
          </div>

          {/* 7. Tags matching image.png */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span>برچسب‌ها (اینتر برای افزودن)</span>
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="تگ جدید بنویسید و Enter بزنید..."
              className="w-full px-3.5 py-2.5 bg-[#13201A] border border-[#1F3128] rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-emerald-500 font-cairo"
            />

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#182921] border border-[#23382E] text-[11px] text-emerald-300"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-rose-400 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Buttons matching image.png */}
        <div className="flex items-center justify-between p-5 border-t border-[#1A2822] bg-[#0E1714]">
          <button
            id="submit-transaction-btn"
            onClick={handleSubmit}
            disabled={!amount.trim()}
            className="px-6 py-2.5 rounded-2xl bg-[#00A86B] hover:bg-[#00915C] text-white font-cairo font-bold text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت نهایی تراکنش</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-cairo font-bold text-zinc-400 hover:text-white transition cursor-pointer"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
