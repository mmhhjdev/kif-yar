import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Search,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
  CheckCheck,
  RotateCcw,
  Mail,
  Calendar,
  AlertTriangle,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { Language, translations } from '../data/translations';
import { SupportTicket, TicketStatus } from '../types';
import { updateTicketStatusInDB, deleteTicketFromDB, isSupabaseConfigured } from '../lib/supabase';

interface SupportTicketAdminProps {
  tickets: SupportTicket[];
  onTicketsChange: (tickets: SupportTicket[]) => void;
  onRefreshTickets?: () => Promise<void>;
  lang: Language;
  onNavigateToSubmit?: () => void;
}

export const SupportTicketAdmin: React.FC<SupportTicketAdminProps> = ({
  tickets,
  onTicketsChange,
  onRefreshTickets,
  lang,
  onNavigateToSubmit,
}) => {
  const isFa = lang === 'fa';
  const t = translations[lang];

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected ticket for modal details & reply
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Status filter
      if (statusFilter !== 'all' && ticket.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && ticket.category !== categoryFilter) {
        return false;
      }
      // Search query (search in email, subject, message, or id)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSubject = ticket.subject.toLowerCase().includes(query);
        const matchesEmail = ticket.user_email.toLowerCase().includes(query);
        const matchesMessage = ticket.message.toLowerCase().includes(query);
        const matchesName = ticket.user_name ? ticket.user_name.toLowerCase().includes(query) : false;
        const matchesId = ticket.id.toLowerCase().includes(query);
        return matchesSubject || matchesEmail || matchesMessage || matchesName || matchesId;
      }
      return true;
    });
  }, [tickets, statusFilter, categoryFilter, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    const total = tickets.length;
    const openCount = tickets.filter((t) => t.status === 'open').length;
    const closedCount = tickets.filter((t) => t.status === 'closed').length;
    return { total, openCount, closedCount };
  }, [tickets]);

  // Handle Quick Status Change (Open <-> Closed)
  const handleToggleStatus = async (ticket: SupportTicket) => {
    const newStatus: TicketStatus = ticket.status === 'open' ? 'closed' : 'open';
    setIsUpdatingStatus(ticket.id);

    try {
      const updatedList = await updateTicketStatusInDB(ticket.id, newStatus);
      onTicketsChange(updatedList);
      
      // Update selected ticket in modal if open
      if (selectedTicket && selectedTicket.id === ticket.id) {
        setSelectedTicket({
          ...selectedTicket,
          status: newStatus,
          updated_at: new Date().toISOString(),
        });
      }

      setFeedbackMsg(
        isFa
          ? `وضعیت تیکت "${ticket.subject.slice(0, 25)}..." به "${newStatus === 'closed' ? 'بسته شده' : 'باز'}" تغییر یافت.`
          : `Ticket status changed to "${newStatus}".`
      );
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Handle Send Reply & Close
  const handleSaveReply = async (ticketId: string, markClosed: boolean) => {
    if (!replyText.trim()) return;
    setIsUpdatingStatus(ticketId);

    try {
      const newStatus: TicketStatus = markClosed ? 'closed' : (selectedTicket?.status || 'open');
      const updatedList = await updateTicketStatusInDB(ticketId, newStatus, replyText.trim());
      onTicketsChange(updatedList);

      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({
          ...selectedTicket,
          status: newStatus,
          admin_reply: replyText.trim(),
          updated_at: new Date().toISOString(),
        });
      }

      setReplyText('');
      setFeedbackMsg(isFa ? 'پاسخ شما با موفقیت ثبت شد.' : 'Reply recorded successfully.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Handle Delete Ticket
  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(isFa ? 'آیا از حذف این تیکت اطمینان دارید؟' : 'Are you sure you want to delete this ticket?')) {
      return;
    }

    await deleteTicketFromDB(id);
    onTicketsChange(tickets.filter((t) => t.id !== id));
    if (selectedTicket?.id === id) {
      setSelectedTicket(null);
    }
  };

  // Handle Manual Refresh
  const handleRefresh = async () => {
    if (onRefreshTickets) {
      setIsRefreshing(true);
      await onRefreshTickets();
      setIsRefreshing(false);
    }
  };

  // Format Persian / English Date
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isFa) {
        return d.toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header & Stats Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              {isFa ? (
                <span className="flex items-center gap-1.5">
                  پنل مدیریت تیکت‌های پشتیبانی <span className="font-walletyar text-2xl font-normal text-emerald-600 dark:text-emerald-400">ولتیار</span>
                </span>
              ) : (
                <span>Support Tickets Admin Panel - <span className="font-berlin text-emerald-600">WalletYar</span></span>
              )}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isFa
              ? 'بررسی تیکت‌های پشتیبانی کاربران، پاسخ‌دهی مستقیم و مدیریت وضعیت تیکت‌ها'
              : 'Review user support tickets, submit official responses, and manage ticket status'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {onRefreshTickets && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span>{isFa ? 'بروزرسانی جدول' : 'Refresh Table'}</span>
            </button>
          )}

          {onNavigateToSubmit && (
            <button
              type="button"
              onClick={onNavigateToSubmit}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isFa ? 'ثبت تیکت جدید' : 'New Ticket'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Temporary Feedback Message Toast */}
      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Summary KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">{isFa ? 'کل تیکت‌های دریافتی' : 'Total Tickets'}</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-tabular">{stats.total}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block">{isFa ? 'تیکت‌های در انتظار (Open)' : 'Open / Pending'}</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-tabular">{stats.openCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block">{isFa ? 'تیکت‌های بسته‌شده (Closed)' : 'Closed Tickets'}</span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-tabular">{stats.closedCount}</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isFa
                  ? 'جستجو در موضوع، ایمیل کاربر، متن یا کد رهگیری تیکت...'
                  : 'Search by subject, user email, message or ID...'
              }
              className="w-full py-2.5 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isFa ? `همه (${stats.total})` : `All (${stats.total})`}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'open'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-amber-600'
              }`}
            >
              {isFa ? `باز (${stats.openCount})` : `Open (${stats.openCount})`}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'closed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              {isFa ? `بسته (${stats.closedCount})` : `Closed (${stats.closedCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List Table & Cards Container */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isFa ? 'هیچ تیکتی با مشخصات جستجو یافت نشد.' : 'No tickets found matching your query.'}
            </h3>
            <p className="text-xs text-slate-400">
              {isFa
                ? 'می‌توانید فیلترها را تغییر داده یا از بخش ارسال تیکت، پیام جدید ثبت نمایید.'
                : 'Try adjusting your search criteria or create a new support ticket.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    <th className="py-3.5 px-4 text-start">{isFa ? 'کاربر / ایمیل' : 'User / Email'}</th>
                    <th className="py-3.5 px-4 text-start">{isFa ? 'موضوع و دسته' : 'Subject & Category'}</th>
                    <th className="py-3.5 px-4 text-start">{isFa ? 'تاریخ ثبت' : 'Date'}</th>
                    <th className="py-3.5 px-4 text-center">{isFa ? 'اولویت' : 'Priority'}</th>
                    <th className="py-3.5 px-4 text-center">{isFa ? 'وضعیت تیکت' : 'Status'}</th>
                    <th className="py-3.5 px-4 text-center">{isFa ? 'عملیات و تغییر وضعیت' : 'Actions & Status Toggle'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTickets.map((ticket) => {
                    const isOpen = ticket.status === 'open';
                    const isUpdating = isUpdatingStatus === ticket.id;

                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setReplyText(ticket.admin_reply || '');
                        }}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        {/* User Email & Name */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[180px]">{ticket.user_email}</span>
                            </div>
                            {ticket.user_name && (
                              <div className="text-[11px] text-slate-400">{ticket.user_name}</div>
                            )}
                          </div>
                        </td>

                        {/* Subject & Category */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="space-y-1">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 truncate">
                              {ticket.subject}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {ticket.category && (
                                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {ticket.category}
                                </span>
                              )}
                              {ticket.admin_reply && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <MessageSquare className="w-3 h-3" />
                                  {isFa ? 'پاسخ‌داده‌شده' : 'Replied'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                          {formatDate(ticket.created_at)}
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ticket.priority === 'high'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                                : ticket.priority === 'low'
                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                            }`}
                          >
                            {ticket.priority === 'high'
                              ? (isFa ? 'فوری' : 'High')
                              : ticket.priority === 'low'
                              ? (isFa ? 'عادی' : 'Low')
                              : (isFa ? 'متوسط' : 'Medium')}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                              isOpen
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            {isOpen ? (
                              <>
                                <Clock className="w-3 h-3" />
                                <span>{isFa ? 'باز (Open)' : 'Open'}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{isFa ? 'بسته شده (Closed)' : 'Closed'}</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Actions (Toggle status button & View) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div
                            className="flex items-center justify-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Toggle Open/Closed Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(ticket)}
                              disabled={isUpdating}
                              title={isOpen ? (isFa ? 'تغییر وضعیت به بسته‌شده' : 'Mark as Closed') : (isFa ? 'بازگشایی مجدد تیکت' : 'Reopen Ticket')}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                isOpen
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
                              } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                            >
                              {isUpdating ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : isOpen ? (
                                <>
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>{isFa ? 'بستن تیکت' : 'Close'}</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>{isFa ? 'بازگشایی' : 'Reopen'}</span>
                                </>
                              )}
                            </button>

                            {/* View Modal Trigger */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setReplyText(ticket.admin_reply || '');
                              }}
                              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                              title={isFa ? 'مشاهده متن کامل و پاسخ' : 'View & Reply'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => handleDelete(ticket.id, e)}
                              className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors"
                              title={isFa ? 'حذف تیکت' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTickets.map((ticket) => {
                const isOpen = ticket.status === 'open';
                const isUpdating = isUpdatingStatus === ticket.id;

                return (
                  <div
                    key={ticket.id}
                    className="p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {ticket.subject}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                          <Mail className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{ticket.user_email}</span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shrink-0 ${
                          isOpen
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {isOpen ? (isFa ? 'باز' : 'Open') : (isFa ? 'بسته' : 'Closed')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {ticket.message}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span>{formatDate(ticket.created_at)}</span>
                        {ticket.category && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]">
                            {ticket.category}
                          </span>
                        )}
                      </div>

                      {/* Quick Action Toggle Status */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(ticket)}
                          disabled={isUpdating}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            isOpen
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {isOpen ? (isFa ? 'بستن' : 'Close') : (isFa ? 'بازگشایی' : 'Reopen')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setReplyText(ticket.admin_reply || '');
                          }}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Ticket Details & Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto"
            dir={isFa ? 'rtl' : 'ltr'}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block">
                  #{selectedTicket.id}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ticket Metadata Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <div>
                <span className="text-slate-400 text-[10px] block font-bold">{isFa ? 'فرستنده' : 'Sender'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {selectedTicket.user_email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-bold">{isFa ? 'دسته‌بندی' : 'Category'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTicket.category}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-bold">{isFa ? 'تاریخ ثبت' : 'Date'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatDate(selectedTicket.created_at)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-bold">{isFa ? 'وضعیت فعلی' : 'Current Status'}</span>
                <span
                  className={`inline-flex items-center gap-1 font-bold ${
                    selectedTicket.status === 'open' ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {selectedTicket.status === 'open' ? (isFa ? 'باز (Open)' : 'Open') : (isFa ? 'بسته (Closed)' : 'Closed')}
                </span>
              </div>
            </div>

            {/* Full Message Details */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isFa ? 'متن ارسالی کاربر (User Message):' : 'User Message:'}
              </label>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedTicket.message}
              </div>
            </div>

            {/* Existing Admin Reply If Any */}
            {selectedTicket.admin_reply && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isFa ? 'پاسخ ثبت‌شده پشتیبانی:' : 'Support Team Response:'}
                </label>
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.admin_reply}
                </div>
              </div>
            )}

            {/* Quick Admin Reply Input */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                {isFa ? 'ثبت پاسخ یا یادداشت پشتیبان:' : 'Write Admin Reply / Note:'}
              </label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isFa ? 'متن پاسخ کارشناس به این تیکت...' : 'Enter support reply...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {/* Toggle Status Button */}
                <button
                  type="button"
                  onClick={() => handleToggleStatus(selectedTicket)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedTicket.status === 'open'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  }`}
                >
                  {selectedTicket.status === 'open' ? (
                    <>
                      <CheckCheck className="w-4 h-4" />
                      <span>{isFa ? 'تغییر وضعیت به بسته‌شده' : 'Mark as Closed'}</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>{isFa ? 'بازگشایی مجدد تیکت' : 'Reopen Ticket'}</span>
                    </>
                  )}
                </button>

                {replyText.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSaveReply(selectedTicket.id, selectedTicket.status === 'open')}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isFa ? 'ارسال پاسخ و بستن' : 'Send Reply & Close'}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                {isFa ? 'بستن پنجره' : 'Close Dialog'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
