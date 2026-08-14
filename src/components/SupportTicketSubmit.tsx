import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, HelpCircle, FileText, Tag, AlertTriangle, User, Mail, MessageSquare, Clock, LogIn } from 'lucide-react';
import { Language, translations } from '../data/translations';
import { AuthUser, UserProfile, SupportTicket } from '../types';
import { submitSupportTicketToDB } from '../lib/supabase';

interface SupportTicketSubmitProps {
  authUser: AuthUser | null;
  profile: UserProfile;
  lang: Language;
  onTicketSubmitted?: (ticket: SupportTicket) => void;
  onNavigateToMyTickets?: () => void;
  onOpenAuthModal?: () => void;
}

const TICKET_CATEGORIES = [
  { id: 'امور مالی و تراکنش‌ها', labelFa: 'امور مالی و تراکنش‌ها', labelEn: 'Financial & Transactions' },
  { id: 'گزارش خطا در سامانه', labelFa: 'گزارش خطا در سامانه (Bug)', labelEn: 'Bug & Technical Issue' },
  { id: 'انتقاد و پیشنهاد', labelFa: 'انتقاد و پیشنهاد امکانات', labelEn: 'Feedback & Feature Request' },
  { id: 'حساب کاربری و همگام‌سازی', labelFa: 'حساب کاربری و همگام‌سازی', labelEn: 'Account & Cloud Sync' },
  { id: 'پشتیبانی عمومی', labelFa: 'پشتیبانی عمومی و سوالات', labelEn: 'General Support & Inquiries' },
];

export const SupportTicketSubmit: React.FC<SupportTicketSubmitProps> = ({
  authUser,
  profile,
  lang,
  onTicketSubmitted,
  onNavigateToMyTickets,
  onOpenAuthModal,
}) => {
  const isFa = lang === 'fa';
  const t = translations[lang];

  // Derive active user email & name directly from authentication/profile
  const activeUserEmail = authUser?.email || profile?.email || '';
  const activeUserName = authUser?.name || profile?.name || 'کاربر ولتیار';
  const isLoggedIn = Boolean(authUser?.isAuthenticated || authUser?.email || profile?.email);

  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('امور مالی و تراکنش‌ها');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // UI status states
  const [isLoading, setIsLoading] = useState(false);
  const [successTicket, setSuccessTicket] = useState<SupportTicket | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessTicket(null);

    // Validation
    if (!subject.trim()) {
      setErrorMessage(isFa ? 'لطفاً موضوع تیکت را وارد نمایید.' : 'Please enter a ticket subject.');
      return;
    }

    if (!message.trim()) {
      setErrorMessage(isFa ? 'لطفاً متن پیام پشتیبانی را وارد کنید.' : 'Please enter your message details.');
      return;
    }

    const finalEmail = activeUserEmail.trim() || 'user@walletyar.ir';

    setIsLoading(true);

    try {
      // Direct Insert into database table `support_tickets`
      const result = await submitSupportTicketToDB({
        user_id: authUser?.id || profile?.email || 'user',
        user_email: finalEmail,
        user_name: activeUserName.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
        category,
        priority,
      });

      setIsLoading(false);

      if (result.ticket) {
        setSuccessTicket(result.ticket);
        // Clear fields
        setSubject('');
        setMessage('');
        if (onTicketSubmitted) {
          onTicketSubmitted(result.ticket);
        }
      } else if (result.error) {
        setErrorMessage(
          isFa
            ? `خطا در ارسال تیکت: ${result.error}`
            : `Failed to submit ticket: ${result.error}`
        );
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(
        isFa
          ? `خطای غیرمنتظره: ${err?.message || 'برقراری ارتباط با سامانه ناموفق بود'}`
          : `Unexpected error: ${err?.message || 'Could not reach server'}`
      );
    }
  };

  const handleReset = () => {
    setSuccessTicket(null);
    setErrorMessage('');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-50 text-xs font-semibold backdrop-blur-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isFa ? 'مرکز ارتباط و پشتیبانی' : 'Support & Helpdesk'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
            {isFa ? (
              <span className="flex items-center gap-1.5">
                ارسال تیکت پشتیبانی به تیم <span className="font-walletyar text-3xl font-normal text-emerald-200">ولتیار</span>
              </span>
            ) : (
              <span>Submit a Support Ticket to <span className="font-berlin text-emerald-200">WalletYar</span></span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
            {isFa
              ? 'هرگونه سوال، پیشنهاد یا گزارش باگ مالی و فنی را از طریق فرم زیر ثبت نمایید. پاسخ کارشناسان مستقیماً در بخش «تیکت‌های من» در همین پنل پشتیبانی قرار خواهد گرفت.'
              : 'Feel free to submit any inquiry or bug report. Our support team will respond directly in your "My Tickets" tab.'}
          </p>
        </div>
      </div>

      {/* Active User Account Badge Bar (Automatic email association) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-extrabold shrink-0">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                {activeUserName}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                {activeUserEmail || 'حساب کاربری فعال'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isFa
                ? 'تیکت به‌صورت خودکار با همین حساب ثبت و پاسخ در پنل پشتیبانی شما ذخیره می‌شود.'
                : 'Ticket will be automatically linked to this account.'}
            </p>
          </div>
        </div>

        {!authUser?.isAuthenticated && onOpenAuthModal && (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isFa ? 'تغییر یا ورود به حساب' : 'Switch / Login Account'}</span>
          </button>
        )}
      </div>

      {/* Success Notification Card */}
      {successTicket && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-sm sm:text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                {isFa ? 'تیکت پشتیبانی شما با موفقیت ثبت شد!' : 'Support ticket submitted successfully!'}
              </h3>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                {isFa
                  ? 'کارشناسان پشتیبانی ولتیار در سریع‌ترین زمان پیام شما را بررسی خواهند کرد. پاسخ کارشناس در بخش «تیکت‌های من» قابل مشاهده خواهد بود.'
                  : 'Our support team will review and reply. The answer will appear in your "My Tickets" section.'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">{isFa ? 'کد رهگیری تیکت' : 'Ticket ID'}</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">#{successTicket.id.slice(-6)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">{isFa ? 'موضوع ثبت‌شده' : 'Subject'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{successTicket.subject}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">{isFa ? 'وضعیت' : 'Status'}</span>
              <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                {isFa ? 'در انتظار بررسی پشتیبانی' : 'Under Review'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {onNavigateToMyTickets && (
              <button
                type="button"
                onClick={onNavigateToMyTickets}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isFa ? 'مشاهده در بخش تیکت‌های من' : 'View in My Tickets'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold transition-all cursor-pointer"
            >
              {isFa ? 'ارسال یک تیکت دیگر' : 'Submit Another Ticket'}
            </button>
          </div>
        </div>
      )}

      {/* Error Alert Card */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Ticket Submission Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Subject Field (Required) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                {isFa ? 'موضوع تیکت' : 'Ticket Subject'}
                <span className="text-rose-500">*</span>
              </span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={
                isFa
                  ? 'مثال: سوال درباره همگام‌سازی تراکنش‌ها یا پیشنهاد افزودن گزارش ماهانه...'
                  : 'e.g. Question about sync or feature suggestion...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Category and Priority Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  {isFa ? 'دسته‌بندی موضوعی' : 'Category'}
                </span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none cursor-pointer"
              >
                {TICKET_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {isFa ? cat.labelFa : cat.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-emerald-600" />
                  {isFa ? 'اولویت بررسی' : 'Priority Level'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low', labelFa: 'عادی', labelEn: 'Low' },
                  { id: 'medium', labelFa: 'متوسط', labelEn: 'Medium' },
                  { id: 'high', labelFa: 'فوری', labelEn: 'High' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id as any)}
                    className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      priority === p.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {isFa ? p.labelFa : p.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Message Textarea (Required) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                {isFa ? 'شرح کامل پیام و درخواست' : 'Message Details'}
                <span className="text-rose-500">*</span>
              </span>
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isFa
                  ? 'لطفاً توضیحات کامل مربوط به درخواست یا مشکل خود را بنویسید...'
                  : 'Please describe your request or question in detail...'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none resize-y placeholder:text-slate-400 leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isFa ? 'پاسخ کارشناس مستقیماً در پنل پشتیبانی شما ثبت خواهد شد' : 'Replies will appear directly in your support panel'}</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isFa ? 'در حال ثبت...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isFa ? 'ارسال تیکت پشتیبانی' : 'Submit Support Ticket'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
