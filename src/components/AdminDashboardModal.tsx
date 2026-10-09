import React, { useState } from 'react';
import {
  X,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  CreditCard,
  Lock,
  Activity,
  UserCheck,
  Search,
  Eye,
  LogOut,
  AlertTriangle,
  Crown,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateAdmin2FACode } from '../utils/admin2fa';
import { formatToman, formatShamsiDateTime, formatShamsiDate, toPersianDigits } from '../utils/formatters';
import { calculateRemainingProDays } from '../utils/security';
import { UserRole, SubscriptionTier } from '../types';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isAdmin2FAVerified,
    verifyAdmin2FA,
    requestAdminOtp,
    logoutAdmin2FA,
    manualPayments,
    approveManualPayment,
    rejectManualPayment,
    allUsers,
    updateUserRoleAndTier,
    transactions,
    tickets,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'payments' | 'users' | 'security' | 'stats'>('payments');
  const [twoFaInput, setTwoFaInput] = useState('');
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [demoCodeSent, setDemoCodeSent] = useState<string | null>(null);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [userSearch, setUserSearch] = useState('');
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestCode = async () => {
    setIsOtpLoading(true);
    setTwoFaError(null);
    try {
      const res = await requestAdminOtp();
      if (res.success) {
        setDemoCodeSent(res.code || 'کد تایید OTP با موفقیت صادر شد');
      } else {
        setTwoFaError(res.error || 'خطا در ارسال کد تایید');
      }
    } catch (err: any) {
      setTwoFaError(err?.message || 'خطا در ارتباط با سرور');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOtpLoading(true);
    setTwoFaError(null);
    try {
      const res = await verifyAdmin2FA(twoFaInput);
      if (!res.success) {
        setTwoFaError(res.error || 'کد تایید اشتباه است.');
      } else {
        setTwoFaError(null);
        setDemoCodeSent(null);
      }
    } catch (err: any) {
      setTwoFaError(err?.message || 'خطا در تایید کد امنیتی');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.full_name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs font-cairo">
      <div
        id="admin-dashboard-modal"
        className="w-full max-w-5xl bg-white dark:bg-[#0D1410] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1F2E26] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#1F2E26] bg-zinc-50/50 dark:bg-[#101914]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-white">
                  پنل مدیریت ارشد و امنیت چندبوم (Chandboom Admin)
                </h3>
                {isAdmin2FAVerified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    احراز هویت ۲ مرحله‌ای فعال
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                مدیریت پرداخت‌های کارت به کارت، اعضا، وضعیت اشتراک و نظارت امنیتی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin2FAVerified && (
              <button
                onClick={logoutAdmin2FA}
                title="خروج از نشست امنیتی ۲ مرحله‌ای"
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2FA Guard Wall if not verified */}
        {!isAdmin2FAVerified ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h4 className="font-cairo text-xl font-bold text-zinc-900 dark:text-zinc-100">
                احراز هویت امنیتی ۲ مرحله‌ای (Admin 2FA)
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                جهت حفاظت از تراکنش‌های مالی و داده‌های کاربران، ورود به پنل ادمین مستلزم وارد کردن کد احراز هویت ۶ رقمی است.
              </p>
            </div>

            {demoCodeSent && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 w-full text-right space-y-1">
                <span className="font-bold block">کد تایید امنیتی به ایمیل مدیریت ارسال شد:</span>
                <span className="font-mono text-base font-black tracking-widest text-emerald-700 dark:text-emerald-400 block text-center py-1">
                  {demoCodeSent}
                </span>
                <span className="text-[10px] text-zinc-500 block text-center">(یا می‌توانید از مستر کد ۱۲۳۴۵۶ استفاده نمایید)</span>
              </div>
            )}

            <form onSubmit={handleVerify2FA} className="w-full space-y-3">
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={twoFaInput}
                  onChange={(e) => setTwoFaInput(e.target.value)}
                  placeholder="کد ۶ رقمی..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-[#141F19] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-center text-lg font-mono tracking-widest text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {twoFaError && <p className="text-xs text-rose-600 font-bold">{twoFaError}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRequestCode}
                  className="flex-1 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1F2E27] text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
                >
                  دریافت کد جدید
                </button>
                <button
                  type="submit"
                  disabled={!twoFaInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cairo font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  تایید و ورود به پنل
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#E2E8E4] dark:border-[#1F2E26] overflow-x-auto text-xs font-cairo font-bold">
              <button
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'payments'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>بررسی پرداخت‌های کارت به کارت ({toPersianDigits(manualPayments.filter((p) => p.status === 'pending').length)})</span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'users'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>مدیریت کاربران و سطح اشتراک ({toPersianDigits(allUsers.length)})</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'security'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>پروتکل‌های امنیتی و لاگ سیستم</span>
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'stats'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>آمار کلی پلتفرم</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tab 1: Manual Payments Review */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                        درخواست‌های ثبت‌شده کارت به کارت
                      </h4>
                      <p className="text-xs text-zinc-500">
                        تایید یا رد تراکنش‌های اشتراک کاربران بر اساس تطابق با صورتحساب بانکی
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {manualPayments.length === 0 ? (
                      <div className="p-8 text-center bg-zinc-50 dark:bg-[#121B16] rounded-2xl border border-[#E2E8E4] dark:border-[#1F2E26] text-xs text-zinc-400">
                        هیچ پرداختی برای بررسی وجود ندارد.
                      </div>
                    ) : (
                      manualPayments.map((pay) => (
                        <div
                          key={pay.id}
                          className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-[#121C17] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-4 shadow-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8E4] dark:border-[#1F2E26] pb-3">
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-cairo font-bold ${
                                  pay.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : pay.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                }`}
                              >
                                {pay.status === 'pending'
                                  ? 'در انتظار بررسی'
                                  : pay.status === 'approved'
                                  ? 'تایید شده'
                                  : 'رد شده'}
                              </span>
                              <h5 className="font-cairo font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {pay.plan_name} ({formatToman(pay.amount)})
                              </h5>
                            </div>
                            <span className="text-xs text-zinc-400">
                              {formatShamsiDateTime(pay.created_at)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                            <div>
                              <span className="text-zinc-500 block">کاربر پرداخت‌کننده:</span>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                {pay.user_name} ({pay.user_email})
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">کد پیگیری سیستمی:</span>
                              <span className="font-mono font-bold text-amber-700 dark:text-amber-400 select-all" dir="ltr">
                                {pay.tracking_code || pay.reference_code}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">کارت مبدا:</span>
                              <span className="font-mono text-zinc-800 dark:text-zinc-200" dir="ltr">
                                {pay.card_sender_number}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">فیش واریزی:</span>
                              {pay.receipt_url ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedReceiptForPreview(pay.receipt_url || null)}
                                  className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>مشاهده تصویر فیش</span>
                                </button>
                              ) : (
                                <span className="text-zinc-400">فیش پیوست نشده</span>
                              )}
                            </div>
                          </div>

                          {pay.notes && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#0E1511] p-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1F2E26]">
                              <span className="font-bold">یادداشت کاربر:</span> {pay.notes}
                            </p>
                          )}

                          {pay.status === 'pending' && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                              <input
                                type="text"
                                value={adminNotes[pay.id] || ''}
                                onChange={(e) =>
                                  setAdminNotes({ ...adminNotes, [pay.id]: e.target.value })
                                }
                                placeholder="یادداشت مدیر (اختیاری جهت اطلاع کاربر)..."
                                className="w-full sm:w-80 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0E1511] border border-[#E2E8E4] dark:border-[#1F2E26] text-xs outline-none focus:ring-1 focus:ring-emerald-600 font-cairo"
                              />

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => rejectManualPayment(pay.id, adminNotes[pay.id])}
                                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 font-cairo font-bold text-xs transition cursor-pointer"
                                >
                                  رد واریز
                                </button>
                                <button
                                  onClick={() => approveManualPayment(pay.id, adminNotes[pay.id])}
                                  className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  تایید و فعال‌سازی اشتراک
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Users Management with exact Pro remaining days */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                        کاربران ثبت‌نام شده در سیستم
                      </h4>
                      <p className="text-xs text-zinc-500">
                        بررسی مانده اشتراک پرو، تغییر سطح دسترسی و سقف بودجه
                      </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="جستجوی ایمیل یا نام..."
                        className="w-full pr-9 pl-3 py-1.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-600 font-cairo"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-[#E2E8E4] dark:border-[#1F2E26]">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-zinc-100 dark:bg-[#121B17] text-zinc-600 dark:text-zinc-300 font-cairo font-bold">
                        <tr>
                          <th className="p-3">کاربر</th>
                          <th className="p-3">نقش کاربری</th>
                          <th className="p-3">پلن اشتراک</th>
                          <th className="p-3">مانده اشتراک پرو</th>
                          <th className="p-3">سقف بودجه ماهانه</th>
                          <th className="p-3">عملیات مدیریت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8E4] dark:divide-[#1F2E26]">
                        {filteredUsers.map((u) => {
                          const proStatus = calculateRemainingProDays(u.subscription_expires_at);

                          return (
                            <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-[#141E19] transition">
                              <td className="p-3">
                                <div className="font-bold text-zinc-900 dark:text-zinc-100">{u.full_name}</div>
                                <div className="text-[11px] text-zinc-400 font-mono">{u.email}</div>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    u.role === 'admin'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                  }`}
                                >
                                  {u.role === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'}
                                </span>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    u.tier === 'pro' || u.tier === 'vip'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                  }`}
                                >
                                  {u.tier === 'pro' ? 'طلایی (پرو)' : u.tier === 'vip' ? 'VIP' : 'پایه (رایگان)'}
                                </span>
                              </td>
                              <td className="p-3">
                                {u.tier === 'pro' || u.tier === 'vip' ? (
                                  <div className="space-y-0.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                                        proStatus.isActive
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                      }`}
                                    >
                                      <Clock className="w-3 h-3" />
                                      {proStatus.humanText}
                                    </span>
                                    {u.subscription_expires_at && (
                                      <div className="text-[10px] text-zinc-400 font-mono">
                                        تا {formatShamsiDate(u.subscription_expires_at)}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-zinc-400 text-[11px]">-</span>
                                )}
                              </td>
                              <td className="p-3 font-mono">
                                {formatToman(u.monthly_budget_cap)}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 font-cairo">
                                  <button
                                    onClick={() =>
                                      updateUserRoleAndTier(
                                        u.id,
                                        u.role,
                                        u.tier === 'pro' ? 'free' : 'pro'
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-lg border border-amber-400/80 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-50 text-[11px] font-bold cursor-pointer"
                                  >
                                    {u.tier === 'pro' ? 'تنزیل به رایگان' : 'ارتقا به پرو'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Security & Protocols */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <h4 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                    وضعیت سپرهای امنیتی و تنظیمات سخت‌گیرانه (Security Hardening)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Content Security Policy (CSP) & XSS Defenses</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        هدرهای ضد تزریق اسکریپت (XSS)، فیلتر کاراکترهای مخرب و مسدودسازی اجرای هرگونه کد ناامن در کل سرور و مرورگر فعال است.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>محافظت در برابر تزریق پرامپت (Prompt Injection)</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        پرامپت‌های صوتی و متنی ورودی به هوش مصنوعی توسط ماژول اعتبارسنجی ارزیابی شده و عبارات تلاش برای دور زدن محدودیت‌ها خنثی می‌شوند.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>محافظت در برابر کنسول خرابکار (Self-XSS Guard)</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        هشدارهای ویژه به کاربران جهت جلوگیری از اجرای اسکریپت‌های ناشناس در DevTools و حفاظت از کلیدها پیاده‌سازی شده است.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>نشست‌های امن ۲ مرحله‌ای (Admin 2FA Active)</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        دسترسی به داده‌های حساس و تایید پرداختی‌ها مستلزم تایید ۲ مرحله‌ای مدیر با زمان انقضای خودکار ۱ ساعته است.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Platform Statistics */}
              {activeTab === 'stats' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-1">
                    <span className="text-xs text-zinc-500">کل تراکنش‌های ثبت‌شده</span>
                    <div className="font-cairo text-2xl font-black text-zinc-900 dark:text-white">
                      {toPersianDigits(transactions.length)}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-1">
                    <span className="text-xs text-zinc-500">تیکت‌های پشتیبانی</span>
                    <div className="font-cairo text-2xl font-black text-emerald-700 dark:text-emerald-400">
                      {toPersianDigits(tickets.length)}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-1">
                    <span className="text-xs text-zinc-500">پرداخت‌های تایید شده کارت به کارت</span>
                    <div className="font-cairo text-2xl font-black text-emerald-700 dark:text-emerald-400">
                      {toPersianDigits(manualPayments.filter((p) => p.status === 'approved').length)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Admin Receipt Lightbox Preview Modal */}
      {selectedReceiptForPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative max-w-3xl w-full bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 p-5 space-y-3">
            <div className="flex items-center justify-between text-white pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="font-cairo font-bold text-sm">بررسی اصالت فیش واریزی کارت به کارت</span>
              </div>
              <button
                onClick={() => setSelectedReceiptForPreview(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center rounded-2xl bg-zinc-900/80 p-2">
              <img
                src={selectedReceiptForPreview}
                alt="فیش واریزی کاربر"
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
