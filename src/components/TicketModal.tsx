import React, { useState } from 'react';
import { X, MessageSquarePlus, LifeBuoy, ShieldCheck } from 'lucide-react';
import { TicketDepartment, TicketPriority } from '../types';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    subject: string;
    department: TicketDepartment;
    priority: TicketPriority;
    initialMessage: string;
  }) => void;
}

const DEPARTMENTS: TicketDepartment[] = [
  'پشتیبانی مالی',
  'پشتیبانی فنی',
  'انتقادات و پیشنهادات',
  'عمومی',
];

export const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState<TicketDepartment>('پشتیبانی مالی');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [initialMessage, setInitialMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) {
      return;
    }

    onSubmit({
      subject: subject.trim(),
      department,
      priority,
      initialMessage: initialMessage.trim(),
    });
    setSubject('');
    setInitialMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-vazir">
      <div
        id="ticket-modal-card"
        className="w-full max-w-lg bg-white dark:bg-[#0F1512] rounded-2xl shadow-2xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#1A2621]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-[#15271E] dark:text-emerald-300">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
              ارسال تیکت به پشتیبانی <span className="font-brand text-emerald-800 dark:text-emerald-400">کیفیار</span>
            </h3>
          </div>
          <button
            id="close-ticket-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              موضوع تیکت *
            </label>
            <input
              id="ticket-subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثلاً مشکل در گزارش‌گیری ماهانه یا درخواست دسته‌بندی جدید"
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
              required
            />
          </div>

          {/* Department & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                دپارتمان مربوطه
              </label>
              <select
                id="ticket-department-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value as TicketDepartment)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                اولویت رسیدگی
              </label>
              <select
                id="ticket-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none"
              >
                <option value="low">کم (عادی)</option>
                <option value="medium">متوسط</option>
                <option value="high">زیاد (فوری)</option>
                <option value="urgent">بسیار اضطراری</option>
              </select>
            </div>
          </div>

          {/* Initial Message */}
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              متن درخواست و جزئیات *
            </label>
            <textarea
              id="ticket-message-input"
              rows={4}
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="لطفاً شرح کامل درخواست، سوال یا مشکل خود را همراه با جزئیات بنویسید..."
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
              required
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-emerald-50/60 dark:bg-[#121F19] rounded-xl border border-emerald-200/50 dark:border-emerald-900/40 text-xs text-zinc-600 dark:text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>پشتیبانی کیفیار در سریع‌ترین زمان ممکن پاسخگوی تیکت شما خواهد بود.</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8E4] dark:border-[#1A2621]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-cairo font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition"
            >
              انصراف
            </button>
            <button
              id="submit-new-ticket-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-cairo font-bold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xs transition flex items-center gap-2"
            >
              <MessageSquarePlus className="w-4 h-4" />
              ارسال تیکت به پشتیبانی
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
