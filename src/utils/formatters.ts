import { Transaction, CategoryId } from '../types';
import { CATEGORIES } from '../data/initialData';

// Get current live date string (Shamsi for Persian, Gregorian for English)
export const getLiveDate = (lang: 'fa' | 'en' = 'fa'): string => {
  if (lang === 'fa') {
    try {
      return new Date().toLocaleDateString('fa-IR-u-ca-persian', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (e) {
      return new Date().toLocaleDateString('fa-IR');
    }
  } else {
    // Gregorian (Miladi) for English
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
};

export const getLiveShamsiDate = getLiveDate;

// Convert English numbers to Persian digits
export const toPersianDigits = (num: number | string): string => {
  if (num === null || num === undefined) return '';
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let str = num.toString();
  for (let i = 0; i < 10; i++) {
    const reg = new RegExp(englishDigits[i], 'g');
    str = str.replace(reg, persianDigits[i]);
  }
  return str;
};

// Convert Persian digits to English digits
export const toEnglishDigits = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
    .replace(/[0-9]/g, (d) => d);
};

export const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const GREGORIAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export interface DynamicMonthItem {
  key: string; // e.g. "1405-05" or "2026-08"
  year: number;
  month: number; // 1 to 12
  isJalali: boolean;
  labelFa: string; // e.g. "مرداد ۱۴۰۵"
  labelEn: string; // e.g. "August 2026"
  shortLabelFa: string; // "مرداد"
  shortLabelEn: string; // "Aug"
}

// Parse transaction date string into year, month, isJalali
export const parseTxYearMonth = (dateStr: string, isFa: boolean) => {
  if (!dateStr) return null;
  const cleaned = toEnglishDigits(dateStr).trim();
  const parts = cleaned.split(/[/.-]/).map((p) => parseInt(p, 10)).filter((p) => !isNaN(p));
  if (parts.length < 2) return null;

  let year = parts[0];
  let month = parts[1];

  // If format is MM/DD/YYYY
  if (parts.length >= 3 && parts[2] > 1000) {
    year = parts[2];
    month = parts[0];
  }

  // Check if year is Jalali (< 1700)
  const isJalali = year < 1700;

  return { year, month, isJalali };
};

// Get current live year and month
export const getCurrentLiveYearMonth = (isFa: boolean) => {
  const now = new Date();
  if (isFa) {
    try {
      const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', {
        year: 'numeric',
        month: 'numeric',
      });
      const parts = formatter.formatToParts(now);
      const year = parseInt(parts.find((p) => p.type === 'year')?.value || '1405', 10);
      const month = parseInt(parts.find((p) => p.type === 'month')?.value || '5', 10);
      return { year, month, isJalali: true };
    } catch (e) {
      return { year: 1405, month: 5, isJalali: true };
    }
  } else {
    return { year: now.getFullYear(), month: now.getMonth() + 1, isJalali: false };
  }
};

// Create a MonthItem helper
export const createMonthItem = (year: number, month: number, isJalali: boolean): DynamicMonthItem => {
  const key = `${year}-${String(month).padStart(2, '0')}`;
  let labelFa = '';
  let labelEn = '';
  let shortLabelFa = '';
  let shortLabelEn = '';

  const mIndex = Math.max(0, Math.min(11, month - 1));

  if (isJalali) {
    shortLabelFa = JALALI_MONTHS[mIndex];
    labelFa = `${shortLabelFa} ${toPersianDigits(year)}`;
    shortLabelEn = GREGORIAN_MONTHS[mIndex];
    labelEn = `${shortLabelEn} ${year}`;
  } else {
    shortLabelEn = GREGORIAN_MONTHS[mIndex];
    labelEn = `${shortLabelEn} ${year}`;
    shortLabelFa = JALALI_MONTHS[mIndex];
    labelFa = `${shortLabelFa} ${toPersianDigits(year)}`;
  }

  return {
    key,
    year,
    month,
    isJalali,
    labelFa,
    labelEn,
    shortLabelFa,
    shortLabelEn,
  };
};

// Get available months list (sorted NEWEST to OLDEST)
export const getAvailableMonths = (transactions: Transaction[], isFa: boolean): DynamicMonthItem[] => {
  const current = getCurrentLiveYearMonth(isFa);
  const monthMap = new Map<string, DynamicMonthItem>();

  // 1. Add current live month
  const currentItem = createMonthItem(current.year, current.month, current.isJalali);
  monthMap.set(currentItem.key, currentItem);

  // 2. Add all months from transactions
  transactions.forEach((tx) => {
    const parsed = parseTxYearMonth(tx.date, isFa);
    if (parsed) {
      const item = createMonthItem(parsed.year, parsed.month, parsed.isJalali);
      monthMap.set(item.key, item);
    }
  });

  // 3. Ensure at least 6 consecutive preceding months
  let tempYear = current.year;
  let tempMonth = current.month;
  for (let i = 0; i < 6; i++) {
    const item = createMonthItem(tempYear, tempMonth, current.isJalali);
    if (!monthMap.has(item.key)) {
      monthMap.set(item.key, item);
    }
    tempMonth--;
    if (tempMonth < 1) {
      tempMonth = 12;
      tempYear--;
    }
  }

  const list = Array.from(monthMap.values());

  // Sort descending: NEWEST month first
  list.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });

  return list;
};

// Format Currency with separation commas and optional suffix
export const formatCurrency = (amount: number, showSuffix = true, toFa = true): string => {
  const formatted = Math.abs(amount).toLocaleString('fa-IR');
  const sign = amount < 0 ? '-' : '';
  const result = `${sign}${formatted}`;
  return showSuffix ? `${result} تومان` : result;
};

// Get Category object by id
export const getCategoryById = (catId: CategoryId) => {
  return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
};

// Calculate total income, expense, and balance from transactions
export const calculateTotals = (transactions: Transaction[]) => {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  return {
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
  };
};

// Expense breakdown by Category
export const getExpenseCategoryBreakdown = (transactions: Transaction[]) => {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  const map: Record<string, { categoryId: CategoryId; nameFa: string; amount: number; percentage: number; color: string }> = {};

  expenses.forEach((tx) => {
    const cat = getCategoryById(tx.category);
    if (!map[tx.category]) {
      map[tx.category] = {
        categoryId: tx.category,
        nameFa: cat.nameFa,
        amount: 0,
        percentage: 0,
        color: cat.color,
      };
    }
    map[tx.category].amount += tx.amount;
  });

  const list = Object.values(map).map((item) => ({
    ...item,
    percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
  }));

  list.sort((a, b) => b.amount - a.amount);
  return { list, totalExpense };
};

// Get Top Expense Category
export const getTopExpenseCategory = (transactions: Transaction[]) => {
  const { list } = getExpenseCategoryBreakdown(transactions);
  return list[0] || null;
};

// Export transactions to CSV file
export const exportTransactionsCSV = (transactions: Transaction[]) => {
  const headers = ['کد تراکنش', 'عنوان', 'نوع', 'مبلغ (تومان)', 'دسته‌بندی', 'تاریخ', 'طرف حساب / فروشگاه', 'توضیحات'];
  const rows = transactions.map((t) => {
    const cat = getCategoryById(t.category);
    return [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.type === 'income' ? 'درآمد' : 'هزینه',
      t.amount,
      `"${cat.nameFa}"`,
      t.date,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n'); // Add UTF-8 BOM for Persian text in Excel
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `wealthyar-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
