import React, { useState } from 'react';
import { X, Bell, Users, CalendarCheck, AlertTriangle, Receipt } from 'lucide-react';
import { NotificationItem, NotificationType } from '../types';
import { formatToman } from '../utils/formatters';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [type, setType] = useState<NotificationType>('debt_reminder');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [personName, setPersonName] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('high');

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmount(val);
  };

  const handleTypeChange = (selectedType: NotificationType) => {
    setType(selectedType);
    if (selectedType === 'debt_reminder') {
      setTitle('یادآوری پرداخت دنگ / طلب');
      setMessage('طلب یا دنگ مورد نظر');
    } else if (selectedType === 'check_due') {
      setTitle('سررسید چک و اقساط وام');
      setMessage('سررسید پاس شدن چک بانکی');
    } else if (selectedType === 'budget_alert') {
      setTitle('هشدار مدیریت سقف بودجه');
      setMessage('هشدار کنترل هزینه‌های دوره');
    } else if (selectedType === 'bill_reminder') {
      setTitle('سررسید پرداخت قبض و اشتراک');
      setMessage('پرداخت قبض آب/برق/گاز/اینترنت');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }

    const numAmount = amount ? parseInt(amount, 10) : undefined;

    onSubmit({
      type,
      title: title.trim(),
      message: message.trim() || 'یادآور مالی ثبت‌شده در کیفیار',
      amount: numAmount,
      due_date: dueDate,
      person_name: personName.trim() || undefined,
      priority,
      status: 'pending',
    });
    onClose();
  };

  const numAmount = parseInt(amount, 10) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-vazir">
      <div
        id="reminder-modal-card"
        className="w-full max-w-lg bg-white dark:bg-[#0F1512] rounded-2xl shadow-2xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#1A2621]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-[#15271E] dark:text-emerald-300">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
              ایجاد یادآور و هشدار هوشمند
            </h3>
          </div>
          <button
            id="close-reminder-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Selector Buttons */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              نوع هشدار / یادآور مالی *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('debt_reminder')}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                  type === 'debt_reminder'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-[#162B21] dark:text-emerald-300 font-bold ring-1 ring-emerald-600'
                    : 'border-[#E2E8E4] dark:border-[#1F2E27] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#141E1A]'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-xs font-cairo">دنگ و طلب</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('check_due')}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                  type === 'check_due'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-[#162B21] dark:text-emerald-300 font-bold ring-1 ring-emerald-600'
                    : 'border-[#E2E8E4] dark:border-[#1F2E27] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#141E1A]'
                }`}
              >
                <CalendarCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-xs font-cairo">سررسید چک</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('budget_alert')}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                  type === 'budget_alert'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-[#162B21] dark:text-emerald-300 font-bold ring-1 ring-emerald-600'
                    : 'border-[#E2E8E4] dark:border-[#1F2E27] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#141E1A]'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-xs font-cairo">سقف بودجه</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('bill_reminder')}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                  type === 'bill_reminder'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-[#162B21] dark:text-emerald-300 font-bold ring-1 ring-emerald-600'
                    : 'border-[#E2E8E4] dark:border-[#1F2E27] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#141E1A]'
                }`}
              >
                <Receipt className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span className="text-xs font-cairo">قبض و قسط</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              عنوان یادآور *
            </label>
            <input
              id="reminder-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً دریافت دنگ شام از علی رضایی یا سررسید قسط"
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
              required
            />
          </div>

          {/* Person Name (for debt/split bill) */}
          {type === 'debt_reminder' && (
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                نام طرف حساب (بدهکار / طلبکار)
              </label>
              <input
                id="reminder-person-input"
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="مثلاً علی رضایی، مریم محمدی"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          )}

          {/* Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                مبلغ مورد نظر (تومان)
              </label>
              <input
                id="reminder-amount-input"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="مثلاً ۲۸۰۰۰۰"
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none text-left dir-ltr"
              />
              {numAmount > 0 && (
                <span className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 block font-medium">
                  {formatToman(numAmount)}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                تاریخ موعد / سررسید
              </label>
              <input
                id="reminder-duedate-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>

          {/* Description Message */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              توضیحات و جزئیات
            </label>
            <textarea
              id="reminder-message-input"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="توضیحات تکمیلی یا شماره پیگیری..."
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              سطح اهمیت
            </label>
            <div className="flex gap-2">
              {(['normal', 'high', 'urgent'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 text-xs font-cairo font-bold rounded-lg border transition ${
                    priority === p
                      ? 'bg-emerald-700 dark:bg-emerald-600 text-white border-emerald-700 dark:border-emerald-600'
                      : 'border-[#E2E8E4] dark:border-[#1F2E27] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-[#141E1A]'
                  }`}
                >
                  {p === 'normal' ? 'عادی' : p === 'high' ? 'مهم' : 'فوری'}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E4] dark:border-[#1A2621]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-cairo font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition"
            >
              انصراف
            </button>
            <button
              id="submit-reminder-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-cairo font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs transition flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              ثبت یادآور هوشمند
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
