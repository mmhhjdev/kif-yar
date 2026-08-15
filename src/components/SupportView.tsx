import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Send,
  User,
  Shield,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TicketPriority, TicketStatus } from '../types';
import { formatShamsiDate, toPersianDigits } from '../utils/formatters';

interface SupportViewProps {
  onOpenTicketModal: () => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ onOpenTicketModal }) => {
  const {
    tickets,
    selectedTicket,
    setSelectedTicket,
    addTicketMessage,
    updateTicketStatus,
    adminMode,
    setAdminMode,
  } = useApp();

  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.subject.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.user_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeTicket = selectedTicket || (filteredTickets.length > 0 ? filteredTickets[0] : null);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    addTicketMessage(activeTicket.id, replyText.trim(), adminMode);
    setReplyText('');
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return {
          label: 'در انتظار پاسخ',
          color: 'bg-zinc-100 text-zinc-800 dark:bg-[#16221D] dark:text-zinc-200 border-zinc-200 dark:border-[#1E2E27]',
        };
      case 'in_progress':
        return {
          label: 'در حال بررسی فنی',
          color: 'bg-emerald-50 text-emerald-800 dark:bg-[#121F19] dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
        };
      case 'resolved':
        return {
          label: 'پاسخ داده شده',
          color: 'bg-emerald-100 text-emerald-900 dark:bg-[#15281F] dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
        };
      case 'closed':
        return {
          label: 'بسته شده',
          color: 'bg-zinc-100 text-zinc-600 dark:bg-[#121714] dark:text-zinc-400 border-zinc-200 dark:border-zinc-800',
        };
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return 'text-emerald-900 bg-emerald-100 dark:bg-[#1B2F25] dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800';
      case 'high':
        return 'text-emerald-800 bg-emerald-50 dark:bg-[#15231C] dark:text-emerald-300 font-semibold';
      case 'medium':
        return 'text-zinc-700 bg-zinc-100 dark:bg-[#16201B] dark:text-zinc-300';
      default:
        return 'text-zinc-600 bg-zinc-100 dark:bg-[#121714] dark:text-zinc-400';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-vazir">
      {/* Top Header with Admin Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              مرکز پشتیبانی و تیکت‌های <span className="font-brand text-emerald-800 dark:text-emerald-400">کیفیار</span>
            </h2>
            {adminMode && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-cairo font-bold bg-emerald-700 text-white flex items-center gap-1 shadow-xs">
                <Shield className="w-3 h-3" />
                پنل مدیریت پشتیبان
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            ارتباط مستقیم و دوطرفه با کارشناسان و تیم پشتیبانی کیفیار
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-cairo">
          {/* Admin Mode Switch Button */}
          <button
            id="toggle-admin-support-mode-btn"
            onClick={() => setAdminMode(!adminMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
              adminMode
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-[#15231C] dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-white dark:bg-[#0F1512] text-zinc-700 dark:text-zinc-300 border-[#E2E8E4] dark:border-[#1A2621] hover:bg-emerald-50/50 dark:hover:bg-[#16201B]'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>{adminMode ? 'خروج از پنل پشتیبان' : 'سوئیچ به پنل پشتیبان (Admin)'}</span>
          </button>

          <button
            id="open-new-ticket-btn"
            onClick={onOpenTicketModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>ثبت تیکت جدید</span>
          </button>
        </div>
      </div>

      {/* Admin Mode Notice Banner */}
      {adminMode && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#14221C] border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200">
            <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>شما در پنل ادمین هستید:</strong> می‌توانید وضعیت تیکت‌ها را تغییر دهید و به عنوان «پشتیبان رسمی کیفیار» به کاربران پاسخ ارسال کنید.
            </span>
          </div>
          <button
            onClick={() => setAdminMode(false)}
            className="px-2.5 py-1 rounded-lg bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-cairo font-bold shrink-0 cursor-pointer"
          >
            بازگشت به حالت کاربر
          </button>
        </div>
      )}

      {/* Main 2 Column Support Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Column: Tickets List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex flex-col overflow-hidden">
          {/* List Header & Search */}
          <div className="p-4 border-b border-[#E2E8E4] dark:border-[#1A2621] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                لیست تیکت‌ها ({toPersianDigits(filteredTickets.length)})
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در تیکت‌ها..."
                className="w-full pr-9 pl-3 py-1.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-vazir"
              />
            </div>

            {/* Filter Status Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs font-cairo">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-zinc-100 dark:bg-[#141F1A] text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-[#1A2822]'
                }`}
              >
                همه
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === 'open'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-zinc-100 dark:bg-[#141F1A] text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-[#1A2822]'
                }`}
              >
                در انتظار
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === 'resolved'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-zinc-100 dark:bg-[#141F1A] text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-[#1A2822]'
                }`}
              >
                پاسخ داده شده
              </button>
            </div>
          </div>

          {/* Tickets Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-[#1A2621]/60 p-2 space-y-1">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                هیچ تیکتی با شرایط انتخابی یافت نشد.
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = activeTicket?.id === ticket.id;
                const statusBadge = getStatusBadge(ticket.status);
                const lastMsg = ticket.messages[ticket.messages.length - 1];

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-3.5 rounded-xl cursor-pointer transition text-right ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-[#14231C] border border-emerald-200 dark:border-emerald-800/80'
                        : 'hover:bg-zinc-50 dark:hover:bg-[#121B17] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1 font-cairo">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {formatShamsiDate(ticket.updated_at)}
                      </span>
                    </div>

                    <h4 className="font-cairo font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {ticket.subject}
                    </h4>

                    {lastMsg && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
                        {lastMsg.sender_role === 'admin' ? 'پشتیبان: ' : 'شما: '}
                        {lastMsg.content}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-zinc-100/60 dark:border-[#1A2621]/40 text-[11px]">
                      <span className="text-zinc-500">{ticket.department}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-cairo ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority === 'urgent' ? 'فوری' : ticket.priority === 'high' ? 'مهم' : 'عادی'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Ticket Conversation (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex flex-col overflow-hidden">
          {activeTicket ? (
            <>
              {/* Ticket Details Header */}
              <div className="p-4 border-b border-[#E2E8E4] dark:border-[#1A2621] bg-zinc-50/50 dark:bg-[#121A16] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-cairo font-bold border ${getStatusBadge(activeTicket.status).color}`}>
                      {getStatusBadge(activeTicket.status).label}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      کد: {activeTicket.id}
                    </span>
                  </div>

                  {/* Status update controls (especially useful in Admin mode) */}
                  <div className="flex items-center gap-1.5">
                    {adminMode && (
                      <select
                        value={activeTicket.status}
                        onChange={(e) => updateTicketStatus(activeTicket.id, e.target.value as TicketStatus)}
                        className="px-2 py-1 bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] rounded-lg text-xs font-cairo font-bold text-emerald-800 dark:text-emerald-300 outline-none"
                      >
                        <option value="open">در انتظار پاسخ</option>
                        <option value="in_progress">در حال بررسی</option>
                        <option value="resolved">پاسخ داده شده</option>
                        <option value="closed">بستن تیکت</option>
                      </select>
                    )}
                  </div>
                </div>

                <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {activeTicket.subject}
                </h3>

                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>کاربر: {activeTicket.user_name}</span>
                  <span>•</span>
                  <span>دپارتمان: {activeTicket.department}</span>
                  <span>•</span>
                  <span>تاریخ ایجاد: {formatShamsiDate(activeTicket.created_at)}</span>
                </div>
              </div>

              {/* Chat Timeline Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[380px]">
                {activeTicket.messages.map((msg) => {
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 text-xs leading-relaxed ${
                        isAdmin ? 'flex-row' : 'flex-row-reverse'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isAdmin
                            ? 'bg-zinc-800 text-emerald-400 shadow-xs'
                            : 'bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[80%] p-3.5 rounded-2xl ${
                          isAdmin
                            ? 'bg-zinc-100 dark:bg-[#16221D] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-[#1F2E27] rounded-tr-xs'
                            : 'bg-emerald-50 dark:bg-[#14231C] text-zinc-900 dark:text-zinc-100 border border-emerald-200 dark:border-emerald-900/60 rounded-tl-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-black/5 dark:border-white/5 font-cairo">
                          <span className="font-bold text-[11px] text-zinc-700 dark:text-zinc-300">
                            {msg.sender_name}
                            {isAdmin && (
                              <span className="mr-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                (پشتیبانی رسمی)
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-vazir">
                            {formatShamsiDate(msg.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap font-vazir leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Bar */}
              <form
                onSubmit={handleSendReply}
                className="p-3 border-t border-[#E2E8E4] dark:border-[#1A2621] bg-zinc-50/50 dark:bg-[#121A16] flex items-center gap-2"
              >
                <input
                  id="ticket-reply-input"
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    adminMode
                      ? 'ارسال پاسخ به عنوان پشتیبان رسمی کیفیار...'
                      : 'پاسخ یا توضیحات تکمیلی خود را بنویسید...'
                  }
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none font-vazir"
                />
                <button
                  id="send-ticket-reply-btn"
                  type="submit"
                  disabled={!replyText.trim()}
                  className="p-2.5 rounded-xl font-cairo font-bold text-white transition flex items-center justify-center cursor-pointer bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center text-zinc-400 text-xs">
              یک تیکت را از لیست سمت راست انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
