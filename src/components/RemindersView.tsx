import React, { useState } from 'react';
import {
  Bell,
  Plus,
  CheckCircle,
  Circle,
  Calendar,
  Trash2,
  Edit2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Reminder } from '../types';
import { formatToman, formatShamsiDate } from '../utils/formatters';
import { ReminderModal } from './ReminderModal';

export const RemindersView: React.FC = () => {
  const { reminders, toggleReminderPaid, deleteReminder } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const unpaidReminders = reminders.filter((r) => !r.is_paid);
  const paidReminders = reminders.filter((r) => r.is_paid);

  const totalUnpaidAmount = unpaidReminders.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-cairo">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            یادآورهای سررسید اقساط و قبوض
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            پیگیری سررسید چک‌ها، اقساط بانکی، اجاره و قبوض ماهانه با اعلان دقیق
          </p>
        </div>

        <button
          id="open-add-reminder-btn"
          onClick={() => {
            setEditingReminder(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-cairo font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن یادآور جدید</span>
        </button>
      </div>

      {/* Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-1">
          <span className="text-xs text-zinc-500">اقساط و چک‌های پیش‌رو (تسویه نشده)</span>
          <div className="font-cairo text-xl font-black text-rose-600 dark:text-rose-400">
            {formatToman(totalUnpaidAmount)}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-1">
          <span className="text-xs text-zinc-500">تعداد موعدهای سررسید</span>
          <div className="font-cairo text-xl font-black text-zinc-900 dark:text-white">
            {unpaidReminders.length} مورد
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-1">
          <span className="text-xs text-zinc-500">پرداخت‌های موفق ثبت‌شده</span>
          <div className="font-cairo text-xl font-black text-emerald-700 dark:text-emerald-400">
            {paidReminders.length} مورد
          </div>
        </div>
      </div>

      {/* Unpaid List */}
      <div className="space-y-3">
        <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>سررسیدهای در انتظار پرداخت</span>
        </h3>

        <div className="space-y-2.5">
          {unpaidReminders.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] text-xs text-zinc-400">
              هیچ یادآور یا چک معوقه‌ای ثبت نشده است. همه‌چیز تسویه و به‌روز است!
            </div>
          ) : (
            unpaidReminders.map((rem) => (
              <div
                key={rem.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex items-center justify-between gap-4 hover:border-emerald-300 dark:hover:border-emerald-900/60 transition"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleReminderPaid(rem.id)}
                    className="text-zinc-300 hover:text-emerald-600 transition cursor-pointer p-1"
                    title="علامت‌گذاری به عنوان پرداخت شده"
                  >
                    <Circle className="w-5 h-5" />
                  </button>

                  <div>
                    <h4 className="font-cairo font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {rem.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500">
                      <span>موعد سررسید: {formatShamsiDate(rem.due_date)}</span>
                      <span>•</span>
                      <span>{rem.category}</span>
                      <span>•</span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400">
                        {rem.recurrence === 'monthly' ? 'تکرار ماهانه' : 'یک‌باره'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left font-cairo font-bold text-base text-zinc-900 dark:text-white">
                    {formatToman(rem.amount)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingReminder(rem);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-[#16251E] transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteReminder(rem.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-[#281515] transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Paid List */}
      {paidReminders.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="font-cairo text-sm font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>پرداخت‌شده‌ها (بایگانی سررسید)</span>
          </h3>

          <div className="space-y-2 opacity-75">
            {paidReminders.map((rem) => (
              <div
                key={rem.id}
                className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1A2621] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleReminderPaid(rem.id)}
                    className="text-emerald-600 cursor-pointer p-1"
                    title="بازگرداندن به حالت تسویه نشده"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>

                  <div>
                    <h4 className="font-cairo font-bold text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 line-through">
                      {rem.title}
                    </h4>
                    <span className="text-[11px] text-zinc-400">
                      پرداخت شده • موعد: {formatShamsiDate(rem.due_date)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-cairo text-xs text-zinc-500 line-through font-mono">
                    {formatToman(rem.amount)}
                  </span>
                  <button
                    onClick={() => deleteReminder(rem.id)}
                    className="p-1 text-zinc-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {isModalOpen && (
        <ReminderModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingReminder(null);
          }}
          editingReminder={editingReminder}
        />
      )}
    </div>
  );
};
