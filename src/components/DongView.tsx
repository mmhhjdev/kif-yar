import React, { useState } from 'react';
import {
  Users,
  Plus,
  CheckCircle2,
  Clock,
  Share2,
  Trash2,
  UserPlus,
  Check,
  Receipt,
} from 'lucide-react';
import { DongGroup, DongMember, CategoryId } from '../types';
import { Language, translations } from '../data/translations';
import { getLiveShamsiDate } from '../utils/formatters';

interface DongViewProps {
  dongs: DongGroup[];
  onSaveDong: (dong: DongGroup) => void;
  onDeleteDong: (id: string) => void;
  onToggleMemberSettled: (dongId: string, memberId: string) => void;
  lang: Language;
}

export const DongView: React.FC<DongViewProps> = ({
  dongs,
  onSaveDong,
  onDeleteDong,
  onToggleMemberSettled,
  lang,
}) => {
  const t = translations[lang];
  const formatNum = (num: number) => num.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDong, setSelectedDong] = useState<DongGroup | null>(dongs[0] || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Dong Form State
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  const [category] = useState<CategoryId>('entertainment');
  const [notes, setNotes] = useState('');
  const [memberNames, setMemberNames] = useState<string[]>(['', '']);

  const handleAddMemberInput = () => {
    setMemberNames((prev) => [...prev, `${lang === 'fa' ? 'عضو' : 'Member'} ${prev.length + 1}`]);
  };

  const handleRemoveMemberInput = (index: number) => {
    if (memberNames.length <= 2) {
      alert(lang === 'fa' ? 'حداقل دو نفر برای محاسبه دنگ لازم است.' : 'At least two members are required for a group expense.');
      return;
    }
    setMemberNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMemberNameChange = (index: number, val: string) => {
    setMemberNames((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleCreateDongSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(totalAmount.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert(lang === 'fa' ? 'لطفاً مبلغ کل را به‌درستی وارد کنید.' : 'Please enter a valid total amount.');
      return;
    }

    if (!title.trim()) {
      alert(lang === 'fa' ? 'لطفاً عنوان دانگ را وارد کنید.' : 'Please enter a title for the split bill.');
      return;
    }

    const perPersonShare = Math.round(numAmount / memberNames.length);

    const members: DongMember[] = memberNames.map((name, idx) => {
      const isPayer = name.trim() === payerName.trim();
      return {
        id: `m-${Date.now()}-${idx}`,
        name: name.trim() || `${lang === 'fa' ? 'عضو' : 'Member'} ${idx + 1}`,
        shareAmount: perPersonShare,
        paidAmount: isPayer ? numAmount : 0,
        isSettled: isPayer, // Payer is already settled
      };
    });

    const newDong: DongGroup = {
      id: `dong-${Date.now()}`,
      title: title.trim(),
      totalAmount: numAmount,
      payerName: payerName.trim(),
      date: getLiveShamsiDate(lang),
      category,
      notes: notes.trim(),
      members,
    };

    onSaveDong(newDong);
    setSelectedDong(newDong);
    setIsModalOpen(false);

    // Reset Form
    setTitle('');
    setTotalAmount('');
    setPayerName('');
    setNotes('');
    setMemberNames(['', '']);
  };

  // Generate copyable text for Telegram/WhatsApp
  const generateShareText = (dong: DongGroup) => {
    const unsettledMembers = dong.members.filter((m) => !m.isSettled);
    const settledMembers = dong.members.filter((m) => m.isSettled);

    if (lang === 'fa') {
      let text = `📋 **حساب‌وکتاب دنگ گروهی: ${dong.title}**\n`;
      text += `💰 **مبلغ کل:** ${formatNum(dong.totalAmount)} تومان\n`;
      text += `💳 **پرداخت‌کننده اولیه:** ${dong.payerName}\n`;
      text += `👥 **سهم هر نفر:** ${formatNum(dong.members[0]?.shareAmount || 0)} تومان\n\n`;

      if (unsettledMembers.length > 0) {
        text += `⏳ **افراد بدهکار (منتظر تسویه):**\n`;
        unsettledMembers.forEach((m) => {
          text += `▫️ ${m.name}: ${formatNum(m.shareAmount)} تومان\n`;
        });
        text += `\n`;
      }

      if (settledMembers.length > 0) {
        text += `✅ **تسویه‌شده‌ها:**\n`;
        settledMembers.forEach((m) => {
          text += `▫️ ${m.name}\n`;
        });
      }

      text += `\nمحاسبه‌شده با اپلیکیشن کیف یار ⚡️`;
      return text;
    } else {
      let text = `📋 **Group Bill Split: ${dong.title}**\n`;
      text += `💰 **Total Amount:** ${formatNum(dong.totalAmount)} Tomans\n`;
      text += `💳 **Paid By:** ${dong.payerName}\n`;
      text += `👥 **Per Person Share:** ${formatNum(dong.members[0]?.shareAmount || 0)} Tomans\n\n`;

      if (unsettledMembers.length > 0) {
        text += `⏳ **Pending Settlement:**\n`;
        unsettledMembers.forEach((m) => {
          text += `▫️ ${m.name}: ${formatNum(m.shareAmount)} Tomans\n`;
        });
        text += `\n`;
      }

      if (settledMembers.length > 0) {
        text += `✅ **Settled:**\n`;
        settledMembers.forEach((m) => {
          text += `▫️ ${m.name}\n`;
        });
      }

      text += `\nCalculated with Kifyar ⚡️`;
      return text;
    }
  };

  const handleCopyShare = (dong: DongGroup) => {
    const shareText = generateShareText(dong);
    navigator.clipboard.writeText(shareText);
    setCopiedId(dong.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Calculate high-level summary
  const totalGroupExpenses = dongs.reduce((acc, d) => acc + d.totalAmount, 0);

  // Sum owed to user (where user is payer)
  const totalOwedToUser = dongs.reduce((acc, d) => {
    if (d.payerName.includes('شما') || d.payerName.toLowerCase().includes('you') || d.payerName.includes('آرش')) {
      const unsettledShare = d.members
        .filter((m) => !m.isSettled && !m.name.includes('شما') && !m.name.toLowerCase().includes('you'))
        .reduce((s, m) => s + m.shareAmount, 0);
      return acc + unsettledShare;
    }
    return acc;
  }, 0);

  // Sum user owes others
  const totalUserOwes = dongs.reduce((acc, d) => {
    if (!d.payerName.includes('شما') && !d.payerName.toLowerCase().includes('you') && !d.payerName.includes('آرش')) {
      const myMember = d.members.find((m) => m.name.includes('شما') || m.name.toLowerCase().includes('you') || m.name.includes('آرش'));
      if (myMember && !myMember.isSettled) {
        return acc + myMember.shareAmount;
      }
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-start">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            {t.dongTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {lang === 'fa'
              ? 'مدیریت آسان هزینه‌های مشترک سفرهای گروهی، دانگ کافه و رستوران بدون سردرگمی'
              : 'Easily manage shared group expenses for trips, cafes, and restaurants'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          {t.newDong}
        </button>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-start shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5 font-semibold">
            <Receipt className="w-4 h-4 text-teal-600" />
            {lang === 'fa' ? 'مجموع هزینه‌های گروهی' : 'Total Group Expenses'}
          </div>
          <div className="text-xl font-extrabold text-slate-900 dark:text-white font-tabular">
            {formatNum(totalGroupExpenses)}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t.toman}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-start shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {lang === 'fa' ? 'طلبات شما از دیگران' : 'Owed to You'}
          </div>
          <div className="text-xl font-extrabold text-emerald-600 font-tabular">
            {formatNum(totalOwedToUser)}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t.toman}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-start shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5 font-semibold">
            <Clock className="w-4 h-4 text-amber-600" />
            {lang === 'fa' ? 'بدهی شما به دیگران' : 'You Owe'}
          </div>
          <div className="text-xl font-extrabold text-amber-600 font-tabular">
            {formatNum(totalUserOwes)}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{t.toman}</span>
          </div>
        </div>
      </div>

      {/* Main Dong Lists & Detail Splitter View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List of Active Dongs */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1 text-start">
            {lang === 'fa' ? `لیست حساب‌های دانگ ثبت‌شده (${formatNum(dongs.length)})` : `Registered Split Bills (${formatNum(dongs.length)})`}
          </h3>

          <div className="space-y-2.5">
            {dongs.map((dong) => {
              const isSelected = selectedDong?.id === dong.id;
              const unsettledCount = dong.members.filter((m) => !m.isSettled).length;

              return (
                <div
                  key={dong.id}
                  onClick={() => setSelectedDong(dong)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all text-start shadow-xs ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-xs font-bold leading-snug line-clamp-1">{dong.title}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(lang === 'fa' ? 'آیا این حساب دنگ حذف شود؟' : 'Delete this split bill?')) {
                          onDeleteDong(dong.id);
                          if (selectedDong?.id === dong.id) setSelectedDong(null);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-extrabold font-tabular text-slate-900 dark:text-white">
                      {formatNum(dong.totalAmount)} {t.toman}
                    </span>

                    {unsettledCount === 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold">
                        {lang === 'fa' ? 'تسویه‌شده' : 'Settled'}
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold">
                        {lang === 'fa' ? `${formatNum(unsettledCount)} نفر منتظر تسویه` : `${formatNum(unsettledCount)} pending`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-2">
          {selectedDong ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 text-start">
              {/* Dong Title & Quick Share Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedDong.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'fa' ? `مورخ ${selectedDong.date} • پرداخت‌کننده اصلی: ` : `Date: ${selectedDong.date} • Paid by: `}
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedDong.payerName}</span>
                  </p>
                </div>

                <button
                  onClick={() => handleCopyShare(selectedDong)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 shrink-0"
                >
                  {copiedId === selectedDong.id ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-400">{lang === 'fa' ? 'کپی شد!' : 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-emerald-600" />
                      {lang === 'fa' ? 'کپی متن خلاصه دنگ' : 'Copy Summary'}
                    </>
                  )}
                </button>
              </div>

              {/* Members Share Cards Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
                  <span>{lang === 'fa' ? 'اعضای گروه و وضعیت دنگ هر نفر:' : 'Group members & status:'}</span>
                  <span>{lang === 'fa' ? `سهم هر نفر: ${formatNum(selectedDong.members[0]?.shareAmount || 0)} تومان` : `Per person: ${formatNum(selectedDong.members[0]?.shareAmount || 0)} ${t.toman}`}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedDong.members.map((member) => (
                    <div
                      key={member.id}
                      className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                        member.isSettled
                          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                          : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-slate-900 dark:text-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          {member.name}
                          {member.name === selectedDong.payerName && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold">
                              {lang === 'fa' ? 'پرداخت‌کننده' : 'Payer'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-extrabold font-tabular text-slate-900 dark:text-white mt-1">
                          {formatNum(member.shareAmount)} {t.toman}
                        </div>
                      </div>

                      <button
                        onClick={() => onToggleMemberSettled(selectedDong.id, member.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          member.isSettled
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                        }`}
                      >
                        {member.isSettled ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {lang === 'fa' ? 'تسویه‌شده' : 'Settled'}
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            {lang === 'fa' ? 'ثبت تسویه' : 'Settle'}
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDong.notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-white block mb-1">{lang === 'fa' ? 'توضیحات تکمیلی:' : 'Notes:'}</span>
                  {selectedDong.notes}
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-500 shadow-xs">
              {lang === 'fa' ? 'یک حساب دنگ را انتخاب کنید یا حساب جدیدی بسازید.' : 'Select a split bill or create a new one.'}
            </div>
          )}
        </div>
      </div>

      {/* New Dong Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 sm:space-y-5 text-start shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 shrink-0" />
                {t.newDong}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDongSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{lang === 'fa' ? 'عنوان دانگ' : 'Title'}</label>
                <input
                  type="text"
                  placeholder={lang === 'fa' ? 'مثلاً: ویلا و خریدهای سفر شمال، رستوران' : 'e.g. Weekend Trip, Cafe dinner'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'fa' ? 'مبلغ کل (تومان)' : `Total Amount (${t.toman})`}
                  </label>
                  <input
                    type="number"
                    placeholder="1200000"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-tabular text-xs outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'fa' ? 'پرداخت‌کننده اولیه' : 'Paid By'}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === 'fa' ? 'نام پرداخت‌کننده (مثال: شما)' : 'Payer name (e.g. You)'}
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              {/* Members list input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'fa' ? `اسامی اعضای سهم‌دار (${formatNum(memberNames.length)} نفر):` : `Members (${formatNum(memberNames.length)}):`}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMemberInput}
                    className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 text-xs font-bold flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {lang === 'fa' ? 'افزودن عضو' : 'Add Member'}
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto ltr:pl-1 rtl:pr-1">
                  {memberNames.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={lang === 'fa' ? `نام عضو ${idx + 1}` : `Member ${idx + 1} name`}
                        value={name}
                        onChange={(e) => handleMemberNameChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none placeholder:text-slate-400"
                      />
                      {memberNames.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMemberInput(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.notes} ({lang === 'fa' ? 'اختیاری' : 'optional'})</label>
                <textarea
                  rows={2}
                  placeholder={lang === 'fa' ? 'توضیحات جزییات فاکتور...' : 'Invoice details...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
