import React, { useState } from 'react';
import { Send, ShieldCheck, MessageSquare, Headphones, Lock, CheckCircle2 } from 'lucide-react';
import { Language, translations } from '../data/translations';
import { AuthUser, UserProfile, SupportTicket } from '../types';
import { SupportTicketSubmit } from './SupportTicketSubmit';
import { SupportTicketAdmin } from './SupportTicketAdmin';
import { UserTicketList } from './UserTicketList';
import { isUserAdmin } from '../lib/adminAuth';

interface SupportViewProps {
  authUser: AuthUser | null;
  profile: UserProfile;
  tickets: SupportTicket[];
  onTicketsChange: (tickets: SupportTicket[]) => void;
  onRefreshTickets: () => Promise<void>;
  lang: Language;
  onOpenAuthModal?: () => void;
}

export const SupportView: React.FC<SupportViewProps> = ({
  authUser,
  profile,
  tickets,
  onTicketsChange,
  onRefreshTickets,
  lang,
  onOpenAuthModal,
}) => {
  const isFa = lang === 'fa';
  const t = translations[lang];

  const currentUserEmail = authUser?.email || profile?.email || '';
  const isAdmin = isUserAdmin(currentUserEmail);

  // Filter tickets belonging specifically to this user
  const myTickets = tickets.filter((ticket) => {
    if (currentUserEmail) {
      const cleanCur = currentUserEmail.trim().toLowerCase();
      const ticketEmail = ticket.user_email.trim().toLowerCase();
      return ticketEmail === cleanCur || (authUser?.id && ticket.user_id === authUser.id);
    }
    return true;
  });

  // Calculate if there is any replied ticket for user
  const hasRepliedTickets = myTickets.some((t) => Boolean(t.admin_reply && t.admin_reply.trim()));

  // Active sub-tab inside Support View: 'submit' | 'my-tickets' | 'admin'
  const [subTab, setSubTab] = useState<'submit' | 'my-tickets' | 'admin'>(
    myTickets.length > 0 && hasRepliedTickets ? 'my-tickets' : 'submit'
  );

  const handleTicketSubmitted = (newTicket: SupportTicket) => {
    onTicketsChange([newTicket, ...tickets]);
    // Automatically switch to 'my-tickets' so user sees their new ticket right away
    setSubTab('my-tickets');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {/* Submit Ticket Tab */}
          <button
            type="button"
            onClick={() => setSubTab('submit')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              subTab === 'submit'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isFa ? 'ارسال تیکت جدید' : 'Submit Ticket'}</span>
          </button>

          {/* My Tickets Tab (Always visible for all users) */}
          <button
            type="button"
            onClick={() => setSubTab('my-tickets')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
              subTab === 'my-tickets'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isFa ? 'تیکت‌های من و پاسخ‌ها' : 'My Tickets & Replies'}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                subTab === 'my-tickets'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {myTickets.length}
            </span>
            {hasRepliedTickets && subTab !== 'my-tickets' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute top-1 left-1 rtl:right-1" />
            )}
          </button>

          {/* Admin Management Tab - ONLY visible if current email is in ADMIN list */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setSubTab('admin')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                subTab === 'admin'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{isFa ? 'پنل مدیریت تیکت‌ها (ادمین)' : 'Admin Panel'}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                {tickets.length}
              </span>
            </button>
          )}
        </div>

        {/* Right Status Badge */}
        <div className="text-[11px] text-slate-400 font-medium px-2 flex items-center gap-1.5">
          {isAdmin ? (
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isFa ? `دسترسی ادمین فعال: ${currentUserEmail}` : `Admin: ${currentUserEmail}`}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Headphones className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isFa ? 'مرکز پشتیبانی برخط ولتیار' : 'WalletYar Online Support'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Render Active View */}
      {subTab === 'submit' && (
        <SupportTicketSubmit
          authUser={authUser}
          profile={profile}
          lang={lang}
          onTicketSubmitted={handleTicketSubmitted}
          onNavigateToMyTickets={() => setSubTab('my-tickets')}
          onOpenAuthModal={onOpenAuthModal}
        />
      )}

      {subTab === 'my-tickets' && (
        <UserTicketList
          tickets={myTickets}
          authUser={authUser}
          profile={profile}
          lang={lang}
          onNavigateToSubmit={() => setSubTab('submit')}
          onRefreshTickets={onRefreshTickets}
        />
      )}

      {subTab === 'admin' && isAdmin && (
        <SupportTicketAdmin
          tickets={tickets}
          onTicketsChange={onTicketsChange}
          onRefreshTickets={onRefreshTickets}
          lang={lang}
          onNavigateToSubmit={() => setSubTab('submit')}
        />
      )}
    </div>
  );
};
