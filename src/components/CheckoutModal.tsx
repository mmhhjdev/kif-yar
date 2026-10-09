import React, { useState, useRef } from 'react';
import {
  X,
  CreditCard,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertCircle,
  FileCheck,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SubscriptionPlan } from '../types';
import { BANK_CARD_CONFIG } from '../data/initialData';
import { formatToman, toPersianDigits, formatCardNumber } from '../utils/formatters';
import { generateSecureTrackingCode } from '../utils/security';
import { uploadPaymentReceipt } from '../lib/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: SubscriptionPlan;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
}) => {
  const { user, submitManualPayment } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [senderName, setSenderName] = useState(user.full_name || '');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptRawFile, setReceiptRawFile] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [generatedTrackingCode, setGeneratedTrackingCode] = useState<string>('');

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('لطفاً تنها فایل تصویری (عکس فیش واریز) انتخاب فرمایید.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('حجم عکس نباید بیشتر از ۸ مگابایت باشد.');
      return;
    }

    setReceiptRawFile(file);
    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setReceiptImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setReceiptImage(null);
    setReceiptRawFile(null);
    setReceiptFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) return;
    if (!receiptImage && !receiptRawFile) {
      alert('لطفاً عکس فیش واریزی خود را از روی دستگاه یا لپ‌تاپ آپلود نمایید.');
      return;
    }

    setIsSubmitting(true);

    try {
      const internalRefCode = generateSecureTrackingCode();
      setGeneratedTrackingCode(internalRefCode);

      // Upload file directly to Supabase Storage 'payment-receipts' bucket
      let finalReceiptUrl = receiptImage || '';
      if (receiptRawFile) {
        const uploadRes = await uploadPaymentReceipt(receiptRawFile, user.id, receiptFileName);
        if (uploadRes.url) {
          finalReceiptUrl = uploadRes.url;
        }
      }

      await submitManualPayment({
        user_id: user.id,
        user_email: user.email,
        user_name: senderName.trim(),
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.nameFa,
        amount: selectedPlan.price,
        card_sender_name: senderName.trim(),
        card_sender_number: 'واریز کارت به کارت',
        reference_code: internalRefCode,
        tracking_code: internalRefCode,
        payment_date: new Date().toISOString(),
        receipt_url: finalReceiptUrl,
        notes: notes.trim(),
      });

      setIsSubmittedSuccess(true);
    } catch (err) {
      console.error('Payment submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs font-cairo">
      <div
        id="checkout-modal-card"
        className="w-full max-w-xl bg-white dark:bg-[#0E1512] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1F2E27] overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#1F2E27] bg-zinc-50/60 dark:bg-[#111A16]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cairo text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                پرداخت کارت به کارت (اشتراک طلایی چندبوم)
              </h3>
              <p className="text-[11px] text-zinc-500">
                تسویه امن و ارتقای آنی حساب به پلن {selectedPlan.nameFa}
              </p>
            </div>
          </div>
          <button
            id="close-checkout-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isSubmittedSuccess ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <FileCheck className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-cairo text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  فیش واریزی با موفقیت در سامانه ذخیره شد!
                </h4>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                  سفارش ارتقای حساب شما ثبت گردید و برای بررسی در سیستم ذخیره شد. وضعیت تایید سفارش در بخش سوابق تراکنش‌های پروفایل شما قابل مشاهده است.
                </p>
              </div>

              {/* Tracking Code Highlight */}
              {generatedTrackingCode && (
                <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-400/50 max-w-md mx-auto text-right space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                      کد پیگیری سیستمی اختصاصی شما:
                    </span>
                    <button
                      onClick={() => handleCopy(generatedTrackingCode, 'tracking')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 text-[11px] font-bold flex items-center gap-1 hover:bg-amber-400 cursor-pointer shadow-xs"
                    >
                      {copiedField === 'tracking' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-950" />
                          <span>کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>کپی کد</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#111A16] border border-amber-300/40 text-center">
                    <span className="font-mono font-black text-base sm:text-lg text-amber-600 dark:text-amber-400 tracking-wider dir-ltr select-all">
                      {generatedTrackingCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    این کد یکتا به همراه عکس فیش در پایگاه داده ذخیره گردید و در بخش «سوابق تراکنش‌ها و سفارش‌های ارتقا» در پروفایل شما نیز ثبت شده است.
                  </p>
                </div>
              )}

              {/* Receipt thumbnail & Summary */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#131E18] border border-[#E2E8E4] dark:border-[#1F2E26] text-xs text-right space-y-2.5 max-w-md mx-auto">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">پلن انتخابی:</span>
                  <span className="font-bold text-zinc-900 dark:text-white font-cairo">{selectedPlan.nameFa}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">مبلغ واریز شده:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                    {formatToman(selectedPlan.price)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">وضعیت سفارش:</span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    در انتظار تایید مدیر
                  </span>
                </div>
                {receiptImage && (
                  <div className="pt-2 border-t border-[#E2E8E4] dark:border-[#1F2E26] flex items-center gap-3">
                    <img
                      src={receiptImage}
                      alt="فیش واریزی"
                      className="w-14 h-14 rounded-xl object-cover border border-[#E2E8E4] dark:border-[#1F2E26]"
                    />
                    <div className="text-[11px] text-zinc-500">
                      <span>عکس فیش واریزی شما با موفقیت ذخیره شد.</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-sm shadow-xs transition cursor-pointer"
              >
                متوجه شدم و بستن
              </button>
            </div>
          ) : (
            <>
              {/* Ultra-realistic Saman Bank / Blu Bank Card Component */}
              <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 text-zinc-900 shadow-2xl border border-sky-200/90 bg-gradient-to-tr from-[#C9E8F9] via-[#E8F5FD] to-[#D5EEFA] select-none">
                {/* Subtle Card Gloss Texture & diagonal watermark waves */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/5 pointer-events-none" />
                <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-cyan-300/20 blur-2xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-blue-300/20 blur-2xl pointer-events-none" />

                {/* Top Row: Metallic Sim Chip (Left) & Saman Bank Logo (Right) */}
                <div className="relative z-10 flex items-start justify-between mb-6">
                  {/* EMV / Smart Card Chip */}
                  <div className="relative w-12 h-9 rounded-lg bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-600/40 shadow-sm overflow-hidden flex items-center justify-center">
                    <div className="w-full h-[1px] bg-amber-700/40 absolute" />
                    <div className="h-full w-[1px] bg-amber-700/40 absolute" />
                    <div className="w-6 h-5 rounded-md border border-amber-700/30" />
                  </div>

                  {/* Official Saman Bank Logo & Emblem */}
                  <div className="flex items-center gap-2 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-sm sm:text-base text-[#113B6B] tracking-tight font-cairo">
                        بانک سامان
                      </span>
                      <span className="text-[10px] text-[#1D5E9E] font-sans font-medium tracking-wider -mt-1">
                        Saman Bank
                      </span>
                    </div>
                    {/* Saman Bank Flower/Sun Emblem */}
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="14" fill="#003366" />
                        <path d="M50 8C54 8 57 14 57 22C57 30 50 32 50 32C50 32 43 30 43 22C43 14 46 8 50 8Z" fill="#0080C8" />
                        <path d="M50 92C46 92 43 86 43 78C43 70 50 68 50 68C50 68 57 70 57 78C57 86 54 92 50 92Z" fill="#0080C8" />
                        <path d="M8 50C8 46 14 43 22 43C30 43 32 50 32 50C32 50 30 57 22 57C14 57 8 54 8 50Z" fill="#0080C8" />
                        <path d="M92 50C92 54 86 57 78 57C70 57 68 50 68 50C68 50 70 43 78 43C86 43 92 46 92 50Z" fill="#0080C8" />
                        <path d="M20.3 20.3C23.1 17.5 29.8 19.3 35.5 24.9C41.1 30.6 40.2 36.8 40.2 36.8C40.2 36.8 34.1 35.9 28.4 30.2C22.8 24.6 20.3 20.3 20.3 20.3Z" fill="#00A3E0" />
                        <path d="M79.7 79.7C76.9 82.5 70.2 80.7 64.5 75.1C58.9 69.4 59.8 63.2 59.8 63.2C59.8 63.2 65.9 64.1 71.6 69.8C77.2 75.4 79.7 79.7 79.7 79.7Z" fill="#00A3E0" />
                        <path d="M79.7 20.3C82.5 23.1 80.7 29.8 75.1 35.5C69.4 41.1 63.2 40.2 63.2 40.2C63.2 40.2 64.1 34.1 69.8 28.4C75.4 22.8 79.7 20.3 79.7 20.3Z" fill="#00A3E0" />
                        <path d="M20.3 79.7C17.5 76.9 19.3 70.2 24.9 64.5C30.6 58.9 36.8 59.8 36.8 59.8C36.8 59.8 35.9 65.9 30.2 71.6C24.6 77.2 20.3 79.7 20.3 79.7Z" fill="#00A3E0" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Center Row 1: IBAN / Sheba */}
                <div className="relative z-10 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-semibold tracking-wide text-zinc-700" dir="ltr">
                      {BANK_CARD_CONFIG.iban}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(BANK_CARD_CONFIG.iban, 'iban')}
                      title="کپی شماره شبا"
                      className="p-1 rounded-md bg-white/60 hover:bg-white text-zinc-700 transition cursor-pointer"
                    >
                      {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-cairo">شماره شبا</span>
                </div>

                {/* Center Row 2: Prominent Card Number */}
                <div className="relative z-10 mb-6 bg-white/70 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-sky-300/60 shadow-xs flex items-center justify-between">
                  <span
                    className="font-mono text-lg sm:text-2xl font-black tracking-widest text-[#0C2A4D]"
                    dir="ltr"
                  >
                    {formatCardNumber(BANK_CARD_CONFIG.cardNumber)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(BANK_CARD_CONFIG.cardNumber, 'card')}
                    className="px-2.5 py-1 rounded-xl bg-[#113B6B] hover:bg-[#0D2F57] text-white text-xs font-cairo font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    {copiedField === 'card' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'card' ? 'کپی شد' : 'کپی کارت'}</span>
                  </button>
                </div>

                {/* Bottom Row: Expiry (Left) & Cardholder (Right) */}
                <div className="relative z-10 flex items-end justify-between text-xs pt-1 border-t border-sky-200/70">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">صاحب حساب</span>
                    <span className="font-cairo font-bold text-sm text-[#0C2A4D]">
                      {BANK_CARD_CONFIG.accountHolder}
                    </span>
                  </div>

                  <div className="text-left font-mono">
                    <span className="text-[10px] text-zinc-500 block">انقضای کارت:</span>
                    <span className="font-bold text-zinc-800 text-xs sm:text-sm">
                      {BANK_CARD_CONFIG.expiryDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-300/60 dark:border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500 block">مبلغ قابل واریز برای {selectedPlan.nameFa}:</span>
                  <span className="font-cairo font-black text-xl text-amber-900 dark:text-amber-300">
                    {formatToman(selectedPlan.price)}
                  </span>
                </div>
                <div className="text-left">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40">
                    کارت به کارت بدون کارمزد
                  </span>
                </div>
              </div>

              {/* Submission Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    نام و نام‌خانوادگی صاحب کارت واریزکننده *
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="مثلاً علی رضایی"
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-cairo"
                  />
                </div>

                {/* Receipt Image File Upload from Laptop / Device */}
                <div>
                  <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    آپلود عکس فیش واریزی (از لپ‌تاپ یا گوشی) *
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="receipt-file-input"
                  />

                  {receiptImage ? (
                    <div className="relative p-3 rounded-2xl bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={receiptImage}
                          alt="پیش‌نمایش فیش"
                          className="w-16 h-16 rounded-xl object-cover border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs"
                        />
                        <div>
                          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {receiptFileName || 'عکس فیش انتخاب شد'}
                          </p>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                            <Check className="w-3 h-3" /> آماده ذخیره‌سازی در دیتابیس
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveReceipt}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="حذف و انتخاب مجدد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-[#D2DCD5] dark:border-[#22352B] hover:border-amber-500/70 dark:hover:border-amber-400/70 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 bg-zinc-50/50 dark:bg-[#121B17] hover:bg-amber-50/20 transition cursor-pointer"
                    >
                      <div className="p-3 rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <span className="font-cairo font-bold text-xs text-zinc-800 dark:text-zinc-200 block">
                          برای انتخاب عکس فیش واریز از لپ‌تاپ کلیک کنید
                        </span>
                        <span className="text-[11px] text-zinc-400 mt-0.5 block">
                          فرمت‌های مجاز: JPG, PNG, WEBP (حداکثر ۸ مگابایت)
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    توضیحات تکمیلی (اختیاری)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ساعت تقریبی واریز یا هر نکته ضروری دیگر..."
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-cairo resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8E4] dark:border-[#1F2E27]">
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>ثبت امن فیش و صدور کد پیگیری اختصاصی</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl text-xs font-cairo font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      id="submit-payment-proof-btn"
                      type="submit"
                      disabled={isSubmitting || !senderName.trim() || !receiptImage}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-cairo font-bold text-xs shadow-md shadow-amber-900/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? 'در حال ثبت رسید...' : 'تایید و صدور کد پیگیری'}
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

