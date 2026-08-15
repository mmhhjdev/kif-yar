import React, { useState, useMemo } from 'react';
import {
  BellRing,
  PlusCircle,
  Users,
  CalendarCheck,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Trash2,
  Clock,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NotificationType } from '../types';
import { formatToman, toPersianDigits, formatShamsiDate } from '../utils/formatters';

interface RemindersViewProps {
  onOpenAddReminderModal: () => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({ onOpenAddReminderModal }) => {
  const {
    notifications,
    settleNotification,
    deleteNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | NotificationType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'settled'>('all');

  const filteredItems = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter !== 'all' && item.type !== activeFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      return true;
    });
  }, [notifications, activeFilter, statusFilter]);

  const pendingCount = notifications.filter((n) => n.status === 'pending').length;
  const settledCount = notifications.filter((n) => n.status === 'settled').length;

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'debt_reminder':
        return {
          label: 'دنگ و مطالبات',
          color: 'bg-emerald-50 text-emerald-800 dark:bg-[#121F19] dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40',
          icon: Users,
        };
      case 'check_due':
        return {
          label: 'سررسید چک و اقساط',
          color: 'bg-zinc-100 text-zinc-800 dark:bg-[#16221D] dark:text-zinc-200 border-zinc-200 dark:border-[#1E2E27]',
          icon: CalendarCheck,
        };
      case 'budget_alert':
        return {
          label: 'هشدار سقف بودجه',
          color: 'bg-emerald-50 text-emerald-900 dark:bg-[#15231C] dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
          icon: AlertTriangle,
        };
      case 'bill_reminder':
        return {
          label: 'قبض و اشتراک',
          color: 'bg-emerald-50 text-emerald-700 dark:bg-[#101C16] dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30',
          icon: Receipt,
        };
      default:
        return {
          label: 'پیام سیستم',
          color: 'bg-zinc-100 text-zinc-700 dark:bg-[#141F1A] dark:text-zinc-300 border-zinc-200 dark:border-zinc-800',
          icon: BellRing,
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-vazir">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            سیستم هشدارها و یادآورهای <span className="font-brand text-emerald-800 dark:text-emerald-400">کیفیار</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            پیگیری دنگ‌های دوستان، سررسید چک‌های بانکی، قبوض و هشدارهای هوشمند بودجه
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={markAllNotificationsAsRead}
              className="px-3.5 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] bg-white hover:bg-emerald-50/50 dark:bg-[#0F1512] dark:hover:bg-[#16201B] text-xs font-cairo font-semibold text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
            >
              علامت‌گذاری همه به عنوان خوانده‌شده
            </button>
          )}

          <button
            id="add-reminder-main-btn"
            onClick={onOpenAddReminderModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-cairo font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ثبت یادآور / دنگ جدید</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-[#0F1512] p-4 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Category Type Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar font-cairo">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-zinc-100 dark:bg-[#141F1A] text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-[#1A2822]'
              }`}
            >
              همه ({toPersianDigits(notifications.length)})
            </button>
            <button
              onClick={() => setActiveFilter('debt_reminder')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activeFilter === 'debt_reminder'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-zinc-100 dark:bg-[#141F1A] text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-[#1A2822]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              دنگ و طلب
            </button>
            <button
              onClick={() => setActiveFilter('check_due')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activeFilter === 'check_due'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-zinc-100 dark:bg-[#141F1A] text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-[#1A2822]'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              سررسید چک
            </button>
            <button
              onClick={() => setActiveFilter('budget_alert')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activeFilter === 'budget_alert'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-zinc-100 dark:bg-[#141F1A] text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-[#1A2822]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              سقف بودجه
            </button>
            <button
              onClick={() => setActiveFilter('bill_reminder')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                activeFilter === 'bill_reminder'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-zinc-100 dark:bg-[#141F1A] text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-[#1A2822]'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              قبوض
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs font-cairo">
            <span className="text-zinc-400">وضعیت:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded-md cursor-pointer ${
                statusFilter === 'all' ? 'font-bold text-emerald-700 dark:text-emerald-400 underline' : 'text-zinc-500'
              }`}
            >
              همه
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2 py-1 rounded-md cursor-pointer ${
                statusFilter === 'pending' ? 'font-bold text-emerald-700 dark:text-emerald-400 underline' : 'text-zinc-500'
              }`}
            >
              در انتظار ({toPersianDigits(pendingCount)})
            </button>
            <button
              onClick={() => setStatusFilter('settled')}
              className={`px-2 py-1 rounded-md cursor-pointer ${
                statusFilter === 'settled' ? 'font-bold text-emerald-700 dark:text-emerald-400 underline' : 'text-zinc-500'
              }`}
            >
              تسویه شده ({toPersianDigits(settledCount)})
            </button>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center text-zinc-500 bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] space-y-2">
            <BellRing className="w-8 h-8 text-zinc-400 mx-auto opacity-50" />
            <p className="font-semibold text-sm">هیچ یادآور یا هشداری در این دسته‌بندی یافت نشد.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const badge = getTypeBadge(item.type);
            const Icon = badge.icon;
            const isSettled = item.status === 'settled';

            return (
              <div
                key={item.id}
                onClick={() => markNotificationAsRead(item.id)}
                className={`p-5 rounded-2xl bg-white dark:bg-[#0F1512] border transition shadow-xs flex flex-col justify-between gap-4 ${
                  !item.is_read
                    ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
                    : 'border-[#E2E8E4] dark:border-[#1A2621]'
                } ${isSettled ? 'opacity-70 bg-zinc-50/50 dark:bg-[#0C110F]' : ''}`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-cairo font-bold border ${badge.color}`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isSettled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-cairo font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-[#121F19] px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          تسویه شد
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-cairo font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-[#16221D] px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          در انتظار
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h3>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {item.message}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {item.amount && (
                      <span className="font-cairo font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-[#14221C] px-2 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-900/40">
                        مبلغ: {formatToman(item.amount)}
                      </span>
                    )}

                    {item.due_date && (
                      <span className="text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-[#16221D] px-2 py-1 rounded-lg">
                        موعد: {toPersianDigits(item.due_date)}
                      </span>
                    )}

                    {item.person_name && (
                      <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-[#121F19] px-2 py-1 rounded-lg font-medium">
                        طرف حساب: {item.person_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8E4] dark:border-[#1A2621] text-xs">
                  <span className="text-[11px] text-zinc-400">
                    ثبت: {formatShamsiDate(item.created_at)}
                  </span>

                  <div className="flex items-center gap-2">
                    {!isSettled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          settleNotification(item.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-cairo font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        علامت تسویه
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.id);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="حذف یادآور"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
