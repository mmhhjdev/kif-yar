import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, Tag, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Reminder, TransactionCategory } from '../types';
import { EXPENSE_CATEGORIES } from '../data/initialData';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingReminder?: Reminder | null;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  editingReminder,
}) => {
  const { addReminder, updateReminder } = useApp();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [recurrence, setRecurrence] = useState<'once' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title);
      setAmount(editingReminder.amount.toString());
      setDueDate(editingReminder.due_date.split('T')[0]);
      setCategory(editingReminder.category);
      setRecurrence(editingReminder.recurrence);
    } else {
      setTitle('');
      setAmount('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setCategory(EXPENSE_CATEGORIES[0]);
      setRecurrence('monthly');
    }
  }, [editingReminder, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(amount.replace(/,/g, ''), 10);
    if (isNaN(numAmount) || !title.trim()) return;

    if (editingReminder) {
      updateReminder(editingReminder.id, {
        title: title.trim(),
        amount: numAmount,
        due_date: new Date(dueDate).toISOString(),
        category,
        recurrence,
      });
    } else {
      addReminder({
        title: title.trim(),
        amount: numAmount,
        due_date: new Date(dueDate).toISOString(),
        category,
        is_paid: false,
        recurrence,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-cairo">
      <div
        id="reminder-modal-card"
        className="w-full max-w-lg bg-white dark:bg-[#0F1512] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#1A2621]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-[#15271E] dark:text-emerald-300">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {editingReminder ? 'ویرایش یادآور مالی' : 'افزودن یادآور قبض یا چک سررسید'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              عنوان یادآور *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً قسط وام مسکن یا قبض برق"
              required
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
            />
          </div>

          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              مبلغ پرداختی (تومان) *
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="مثلاً ۴,۵۰۰,۰۰۰"
              required
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-base font-cairo font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                تاریخ سررسید
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                تکرار یادآور
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
              >
                <option value="once">یک‌باره</option>
                <option value="monthly">ماهانه</option>
                <option value="yearly">سالانه</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              دسته‌بندی مربوطه
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E4] dark:border-[#1A2621]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-cairo font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !amount.trim()}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-cairo font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {editingReminder ? 'ذخیره تغییرات' : 'افزودن یادآور'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
