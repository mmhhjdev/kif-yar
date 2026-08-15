// Utility for Persian numbers and currency formatting

/**
 * Converts Latin digits to Persian digits
 */
export function toPersianDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

/**
 * Formats a number with commas and converts to Persian digits with تومان
 */
export function formatToman(amount: number | undefined | null, showUnit: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return showUnit ? `۰ تومان` : '۰';
  }
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const persianStr = toPersianDigits(formatted);
  return showUnit ? `${persianStr} تومان` : persianStr;
}

/**
 * Formats large amounts in concise Persian form (e.g. ۱.۲ میلیون تومان)
 */
export function formatCompactToman(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    const val = (amount / 1_000_000_000).toFixed(1);
    return `${toPersianDigits(val)} میلیارد تومان`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(1);
    return `${toPersianDigits(val)} میلیون تومان`;
  }
  if (Math.abs(amount) >= 1_000) {
    const val = (amount / 1_000).toFixed(0);
    return `${toPersianDigits(val)} هزار تومان`;
  }
  return `${toPersianDigits(amount)} تومان`;
}

/**
 * Converts Greg date string or Date to Persian/Shamsi readable string
 */
export function formatShamsiDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'نامشخص';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    
    // Using Intl with Persian locale
    const formatted = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
    return formatted;
  } catch {
    return String(dateInput);
  }
}

/**
 * Formats date to short Shamsi (e.g. ۱۴۰۳/۰۵/۲۵)
 */
export function formatShamsiShort(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Category styling colors and icons
 */
export const CATEGORY_METADATA: Record<
  string,
  { color: string; bgLight: string; bgDark: string; icon: string; defaultType: 'expense' | 'income' }
> = {
  'خوراک و رستوران': {
    color: '#f97316',
    bgLight: 'bg-orange-50 text-orange-700 border-orange-200',
    bgDark: 'dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/50',
    icon: 'Utensils',
    defaultType: 'expense',
  },
  'مسکن و اجاره': {
    color: '#6366f1',
    bgLight: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    bgDark: 'dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50',
    icon: 'Home',
    defaultType: 'expense',
  },
  'حمل‌ونقل و خودرو': {
    color: '#0ea5e9',
    bgLight: 'bg-sky-50 text-sky-700 border-sky-200',
    bgDark: 'dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50',
    icon: 'Car',
    defaultType: 'expense',
  },
  'خرید و پوشاک': {
    color: '#ec4899',
    bgLight: 'bg-pink-50 text-pink-700 border-pink-200',
    bgDark: 'dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/50',
    icon: 'ShoppingBag',
    defaultType: 'expense',
  },
  'سرگرمی و تفریح': {
    color: '#8b5cf6',
    bgLight: 'bg-purple-50 text-purple-700 border-purple-200',
    bgDark: 'dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
    icon: 'Gamepad2',
    defaultType: 'expense',
  },
  'سلامت و درمان': {
    color: '#ef4444',
    bgLight: 'bg-red-50 text-red-700 border-red-200',
    bgDark: 'dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50',
    icon: 'HeartPulse',
    defaultType: 'expense',
  },
  'قبوض و شارژ': {
    color: '#eab308',
    bgLight: 'bg-amber-50 text-amber-700 border-amber-200',
    bgDark: 'dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    icon: 'Receipt',
    defaultType: 'expense',
  },
  'آموزش و کتاب': {
    color: '#14b8a6',
    bgLight: 'bg-teal-50 text-teal-700 border-teal-200',
    bgDark: 'dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50',
    icon: 'GraduationCap',
    defaultType: 'expense',
  },
  'حقوق و دستمزد': {
    color: '#10b981',
    bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bgDark: 'dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    icon: 'Briefcase',
    defaultType: 'income',
  },
  'سرمایه‌گذاری و پس‌انداز': {
    color: '#06b6d4',
    bgLight: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    bgDark: 'dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/50',
    icon: 'TrendingUp',
    defaultType: 'income',
  },
  'کسب‌وکار و فروش': {
    color: '#3b82f6',
    bgLight: 'bg-blue-50 text-blue-700 border-blue-200',
    bgDark: 'dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
    icon: 'DollarSign',
    defaultType: 'income',
  },
  'سایر و متفرقه': {
    color: '#64748b',
    bgLight: 'bg-slate-100 text-slate-700 border-slate-200',
    bgDark: 'dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    icon: 'MoreHorizontal',
    defaultType: 'expense',
  },
};
