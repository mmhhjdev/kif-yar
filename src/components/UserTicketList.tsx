import React, { useState } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  User,
  ShieldCheck,
  Send,
  Calendar,
  Tag,
  Sparkles,
  Inbox
} from 'lucide-react';
import { Language, translations } from '../data/translations';
import { SupportTicket, AuthUser, UserProfile } from '../types';

interface UserTicketListProps {
  tickets: SupportTicket[];
  authUser: AuthUser | null;
  profile: UserProfile;
  lang: Language;
  onNavigateToSubmit: () => void;
  onRefreshTickets?: () => Promise<void>;
}

export const UserTicketList: React.FC<UserTicketListProps> = ({
  tickets,
  authUser,
  profile,
  lang,
  onNavigateToSubmit,
  onRefreshTickets,
}) => {
  const isFa = lang === 'fa';
  const t = translations[lang];

  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(
    tickets.length > 0 ? tickets[0].id : null
  );

  const toggleExpand = (id: string) => {
    setExpandedTicketId((prev) => (prev === id ? null : id));
  };

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

  const repliedTicketsCount = tickets.filter((t) => !!t.admin_reply).length;
  const pendingTicketsCount = tickets.filter((t) => t.status === 'open' && !t.admin_reply).length;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{isFa ? 'تیکت‌های من و وضعیت پاسخ‌ها' : 'My Support Tickets & Replies'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isFa
                ? 'پاسخ کارشناسان پشتیبانی کیف یار مستقیماً در همین بخش قرار می‌گیرد.'
                : 'Support team replies and updates will be displayed directly here in this panel.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateToSubmit}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isFa ? 'ارسال تیکت جدید' : 'New Ticket'}</span>
          </button>
        </div>

        {/* Status Counters */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold block">{isFa ? 'کل تیکت‌های شما' : 'Total Tickets'}</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white font-tabular">{tickets.length}</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-center">
            <span className="text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 font-bold block">{isFa ? 'در انتظار بررسی' : 'Under Review'}</span>
            <span className="text-lg font-extrabold text-amber-700 dark:text-amber-400 font-tabular">{pendingTicketsCount}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-center">
            <span className="text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-bold block">{isFa ? 'پاسخ داده شده' : 'Replied'}</span>
            <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 font-tabular">{repliedTicketsCount}</span>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isFa ? 'شما هنوز تیکتی ارسال نکرده‌اید' : 'No support tickets found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {isFa
                ? 'هرگونه سوال، پیشنهاد، مشکل در ثبت هزینه‌ها یا گزارش باگ دارید، می‌توانید تیکت ارسال کنید تا کارشناسان ما پاسخ دهند.'
                : 'Have any questions, feedback, or need help? Submit a ticket and our support team will reply here.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToSubmit}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{isFa ? 'ارسال اولین تیکت پشتیبانی' : 'Submit First Ticket'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const isExpanded = expandedTicketId === ticket.id;
            const hasReply = Boolean(ticket.admin_reply && ticket.admin_reply.trim());
            const isOpen = ticket.status === 'open';

            return (
              <div
                key={ticket.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  hasReply
                    ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800/80 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                }`}
              >
                {/* Ticket Header Row (Clickable) */}
                <div
                  onClick={() => toggleExpand(ticket.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400 font-bold">
                        #{ticket.id.slice(-6)}
                      </span>

                      {/* Status Badges */}
                      {hasReply ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold">
                          <CheckCircle2 className="w-3 h-3" />
                          {isFa ? 'پاسخ داده شده' : 'Replied'}
                        </span>
                      ) : isOpen ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold">
                          <Clock className="w-3 h-3" />
                          {isFa ? 'در انتظار بررسی' : 'Under Review'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold">
                          <CheckCircle2 className="w-3 h-3" />
                          {isFa ? 'بسته شده' : 'Closed'}
                        </span>
                      )}

                      {ticket.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {ticket.category}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                      {ticket.subject}
                    </h3>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(ticket.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <button
                      type="button"
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
                    {/* User's Original Message */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isFa ? 'متن پیام ارسالی شما:' : 'Your message:'}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {ticket.message}
                      </div>
                    </div>

                    {/* Official Admin Reply Card */}
                    {hasReply ? (
                      <div className="space-y-2 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-950/60 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
                                {isFa ? 'پاسخ کارشناس پشتیبانی کیف یار' : 'Support Specialist Response'}
                              </span>
                              {ticket.updated_at && (
                                <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 block">
                                  {formatDate(ticket.updated_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2 py-0.5 rounded-full">
                            {isFa ? 'پاسخ رسمی' : 'Official Reply'}
                          </span>
                        </div>

                        <div className="pt-2 text-xs text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap font-medium">
                          {ticket.admin_reply}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 flex items-start gap-3">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                            {isFa ? 'در انتظار بررسی توسط تیم پشتیبانی' : 'Ticket is being reviewed'}
                          </h4>
                          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                            {isFa
                              ? 'پیام شما به دست کارشناسان کیف یار رسیده است. به محض ارسال پاسخ، متن پاسخ در همین پنجره نمایش داده خواهد شد.'
                              : 'Your request is in our queue. Once our support team responds, the answer will appear right here.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
