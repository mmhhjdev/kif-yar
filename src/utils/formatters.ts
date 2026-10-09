/**
 * Utility functions for Persian digits, currency, and date formatting
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toPersianDigits(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

export function toEnglishDigits(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  let str = String(value);
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(PERSIAN_DIGITS[i], 'g'), String(i));
    str = str.replace(new RegExp(ARABIC_DIGITS[i], 'g'), String(i));
  }
  return str;
}

export function formatToman(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return '۰ تومان';
  const num = typeof amount === 'string' ? parseInt(toEnglishDigits(amount).replace(/,/g, ''), 10) : amount;
  if (isNaN(num)) return '۰ تومان';
  const formatted = num.toLocaleString('en-US');
  return `${toPersianDigits(formatted)} تومان`;
}

export function formatCardNumber(card: string): string {
  const clean = toEnglishDigits(card).replace(/\D/g, '').slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.substring(i, i + 4));
  }
  return parts.map(toPersianDigits).join(' - ');
}

export function formatShamsiDate(isoDateStr?: string | null): string {
  if (!isoDateStr) return 'امروز';
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return isoDateStr;
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return formatter.format(d);
  } catch {
    return isoDateStr;
  }
}

export function formatShamsiDateTime(isoDateStr?: string | null): string {
  if (!isoDateStr) return 'امروز';
  try {
    const d = new Date(isoDateStr);
    if (isNaN(d.getTime())) return isoDateStr;
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return formatter.format(d);
  } catch {
    return isoDateStr;
  }
}
