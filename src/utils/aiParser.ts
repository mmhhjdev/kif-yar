import {
  TransactionCategory,
  TransactionType,
  ParsedAITransaction,
  AIBudgetAlert,
  Transaction,
} from '../types';
import { toEnglishDigits } from './formatters';
import { sanitizeAIPrompt } from './security';

const CATEGORY_KEYWORDS: Partial<Record<TransactionCategory, string[]>> = {
  'خوراک و غذا': [
    'سوپرمارکت', 'غذا', 'رستوران', 'شام', 'ناهار', 'صبحانه', 'نان', 'میوه', 'گوشت', 'مرغ',
    'کافه', 'قهوه', 'اسنپ فود', 'پیتزا', 'ساندویچ', 'سوپر', 'خواربار', 'هایپر'
  ],
  'خرید و پوشاک': [
    'لباس', 'کفش', 'شلوار', 'پیراهن', 'مانتو', 'پوشاک', 'دیجیکالا', 'خرید', 'کیف', 'عطر', 'لوازم'
  ],
  'حمل و نقل': [
    'اسنپ', 'تپسی', 'بنزین', 'تاکسی', 'مترو', 'اتوبوس', 'تعمیرگاه', 'روغن موتور', 'طرح ترافیک', 'بلیت', 'هواپیما'
  ],
  'مسکن و قبوض': [
    'اجاره', 'قسط مسکن', 'شارژ ساختمان', 'برق', 'آب', 'گاز', 'تلفن', 'اینترنت', 'مودم', 'قبض'
  ],
  'سلامت و درمان': [
    'دکتر', 'داروخانه', 'دارو', 'بیمارستان', 'آزمایشگاه', 'دندانپزشکی', 'ویزیت', 'درمان', 'عینک'
  ],
  'آموزش و یادگیری': [
    'کتاب', 'دوره', 'دانشگاه', 'شهریه', 'مدرسه', 'کلاس', 'آموزش', 'پادکست', 'یوتیوب'
  ],
  'تفریح و سرگرمی': [
    'سینما', 'تئاتر', 'بازی', 'پلی استیشن', 'سفر', 'هتل', 'ویلا', 'کنسرت', 'شهربازی'
  ],
  'سرمایه‌گذاری': [
    'سهام', 'بورس', 'طلا', 'سکه', 'دلار', 'تتر', 'ارز دیجیتال', 'ارزدیجیتال', 'صندوق', 'سپرده'
  ],
  'حقوق و دستمزد': [
    'حقوق', 'دستمزد', 'واریز حقوق', 'پاداش', 'عیدی', 'اضافه کار', 'کارمزد', 'فروش'
  ],
  'سایر': [],
};

export function autoCategorize(text: string): TransactionCategory {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [TransactionCategory, string[]][]) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return category;
      }
    }
  }
  return 'سایر';
}

export function parsePersianAmount(text: string): number {
  const normalized = toEnglishDigits(text).toLowerCase();

  // Pattern: X میلیون یا X ملیون
  const millionMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:میلیون|ملیون)/);
  if (millionMatch) {
    return Math.round(parseFloat(millionMatch[1]) * 1000000);
  }

  // Pattern: X هزار
  const thousandMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:هزار|ک|k)/);
  if (thousandMatch) {
    return Math.round(parseFloat(thousandMatch[1]) * 1000);
  }

  // Pattern: Raw numbers with thousand separators
  const digitsMatch = normalized.replace(/,/g, '').match(/\b(\d{4,12})\b/);
  if (digitsMatch) {
    return parseInt(digitsMatch[1], 10);
  }

  return 0;
}

export function parseTransactionLocally(input: string): ParsedAITransaction {
  const clean = sanitizeAIPrompt(input).safePrompt;
  const lower = clean.toLowerCase();

  // Detect Type
  let type: TransactionType = 'expense';
  if (
    lower.includes('حقوق') ||
    lower.includes('واریز شد') ||
    lower.includes('دریافت') ||
    lower.includes('پاداش') ||
    lower.includes('سود') ||
    lower.includes('فروختم') ||
    lower.includes('درآمد')
  ) {
    type = 'income';
  }

  // Detect Amount
  const amount = parsePersianAmount(clean);

  // Detect Category
  const category = autoCategorize(clean);

  // Date defaults to today
  const date = new Date().toISOString();

  // Description
  const description = clean.length > 50 ? clean.substring(0, 50) + '...' : clean;

  const missingFields: string[] = [];
  if (amount <= 0) missingFields.push('مبلغ تراکنش');

  let clarificationPrompt: string | undefined;
  if (amount <= 0) {
    clarificationPrompt = 'متوجه مبلغ تراکنش نشدم؛ لطفاً مبلغ را به تومان یا میلیون تومان (مثلاً ۵۰۰ هزار تومان یا ۱.۲ میلیون) ذکر بفرمایید.';
  }

  return {
    type,
    amount,
    category,
    date,
    description,
    confidence: amount > 0 ? 0.95 : 0.4,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
    clarificationPrompt,
  };
}

export async function parseTransactionWithAI(input: string): Promise<ParsedAITransaction> {
  const { safePrompt } = sanitizeAIPrompt(input);

  try {
    const res = await fetch('/api/ai/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: safePrompt }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.amount !== undefined) {
        return data as ParsedAITransaction;
      }
    }
  } catch {
    // Graceful fallback to local rule-based Persian NLP
  }

  return parseTransactionLocally(safePrompt);
}

/**
 * Predicts budget depletion rate and generates smart proactive alerts
 */
export function generatePredictiveBudgetAlerts(
  transactions: Transaction[],
  monthlyCap: number
): AIBudgetAlert[] {
  const alerts: AIBudgetAlert[] = [];
  if (!monthlyCap || monthlyCap <= 0) return alerts;

  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);

  const expenses = transactions.filter((t) => t.type === 'expense');
  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);

  const dailyBurnRate = currentDay > 0 ? totalSpent / currentDay : 0;
  const projectedTotal = totalSpent + dailyBurnRate * daysRemaining;

  // 1. Overall monthly budget alert
  if (totalSpent >= monthlyCap) {
    alerts.push({
      id: 'alert-budget-exceeded',
      category: 'کل هزینه‌ها',
      currentSpent: totalSpent,
      budgetLimit: monthlyCap,
      depletionPaceDays: 0,
      severity: 'critical',
      title: 'سقف بودجه ماهانه تکمیل شده است',
      message: `مجموع مخارج ماه جاری به ${totalSpent.toLocaleString('fa-IR')} تومان رسیده و سقف بودجه پر شده است.`,
      recommendation: 'پیشنهاد می‌شود هزینه‌های غیرضروری تفریح و خرید تا پایان ماه به تعویق بیفتد.',
    });
  } else if (projectedTotal > monthlyCap) {
    const daysUntilEmpty = dailyBurnRate > 0 ? Math.max(1, Math.round((monthlyCap - totalSpent) / dailyBurnRate)) : 0;
    alerts.push({
      id: 'alert-pace-warning',
      category: 'بودجه عمومی',
      currentSpent: totalSpent,
      budgetLimit: monthlyCap,
      depletionPaceDays: daysUntilEmpty,
      severity: 'warning',
      title: `هشدار سرعت مصرف بودجه: اتمام ظرف ${daysUntilEmpty} روز آینده`,
      message: `با نرخ خرج روزانه فعلی (${Math.round(dailyBurnRate).toLocaleString('fa-IR')} تومان در روز)، بودجه شما تا روز ${currentDay + daysUntilEmpty} ماه به پایان خواهد رسید.`,
      recommendation: `کاهش روزانه ${Math.round((projectedTotal - monthlyCap) / daysRemaining).toLocaleString('fa-IR')} تومان باعث پایداری بودجه تا پایان ماه خواهد شد.`,
    });
  }

  // 2. High spending category alert
  const catTotals: Record<string, number> = {};
  expenses.forEach((t) => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  for (const [cat, spent] of Object.entries(catTotals)) {
    if (spent > monthlyCap * 0.4) {
      alerts.push({
        id: `alert-cat-${cat}`,
        category: cat,
        currentSpent: spent,
        budgetLimit: monthlyCap * 0.4,
        depletionPaceDays: 5,
        severity: 'warning',
        title: `بیشترین تمرکز هزینه در دسته‌بندی «${cat}»`,
        message: `${cat} بیش از ۴۰ درصد از کل بودجه شما را مصرف کرده است (${spent.toLocaleString('fa-IR')} تومان).`,
        recommendation: 'بررسی فاکتورهای این دسته‌بندی جهت شناسایی اقلام قابل صرفه‌جویی.',
      });
    }
  }

  return alerts;
}

export function parsePersianFinancialText(text: string): {
  amount?: number;
  type?: TransactionType;
  category?: TransactionCategory;
  description?: string;
} {
  const result = parseTransactionLocally(text);
  return {
    amount: result.amount > 0 ? result.amount : undefined,
    type: result.type,
    category: result.category,
    description: result.description,
  };
}

/**
 * Checks whether a user inquiry is strictly related to finance/accounting/budgeting
 */
export function isPermittedFinancialQuery(query: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return false;

  const financialKeywords = [
    'بودجه', 'خرج', 'هزینه', 'درآمد', 'حقوق', 'پول', 'تومان', 'ریال', 'پس‌انداز', 'پس انداز',
    'سرمایه', 'سرمایه‌گذاری', 'ماه', 'چند ماه', 'آینده', 'تحلیل', 'پیش‌بینی', 'قسط', 'وام',
    'چک', 'بدهی', 'طلب', 'دنگ', 'خرید', 'فروش', 'کارت', 'بانک', 'تراکنش', 'ثبت', 'سقف',
    'سود', 'زیان', 'کسری', 'اضافه', 'قبض', 'شارژ', 'صرفه‌جویی', 'صرفه جویی', 'چندبوم', 'حساب مالی',
    'خوراک', 'پوشاک', 'سفر', 'رستوران', 'اسنپ', 'سوپرمارکت', 'گزارش', 'وضعیت', 'چندبوم',
  ];

  // Also allow numbers or currency units
  const hasFinancialKeyword = financialKeywords.some((kw) => q.includes(kw));
  const hasNumbers = /\d/.test(q);

  return hasFinancialKeyword || hasNumbers;
}

export function generateFinancialAdvice(
  userQuery: string,
  metrics: { totalIncome: number; totalExpense: number; balance: number },
  monthlyCap: number,
  transactions: Transaction[] = []
): { text: string; isGuardedRejection?: boolean } {
  const q = userQuery.toLowerCase().trim();

  // Strict Guardrail: Prevent unrelated inquiries to preserve tokens & protect scope
  if (!isPermittedFinancialQuery(q)) {
    return {
      text: `⚠️ دسترسی به این موضوع در هوش مصنوعی چندبوم مجاز نیست.
این دستیار هوشمند منحصراً برای «ثبت هوشمند تراکنش‌های مالی» و «تحلیل بودجه و پیش‌بینی دخل و خرج» تعریف شده است.
لطفاً تنها سوالات مربوط به مدیریت مالی، بودجه‌بندی و تراکنش‌ها را مطرح فرمایید یا از پرسش‌های پیشنهادی زیر استفاده کنید.`,
      isGuardedRejection: true,
    };
  }

  // 1. Forecast for the next few months (3 months ahead)
  if (
    q.includes('چند ماه آینده') ||
    q.includes('ماه آینده') ||
    q.includes('آینده') ||
    q.includes('پیش‌بینی') ||
    q.includes('چیکار بکنم') ||
    q.includes('چکار کنم')
  ) {
    const monthlyNet = metrics.totalIncome - metrics.totalExpense;
    const projectedBalance3m = metrics.balance + monthlyNet * 3;
    const expenseRatio = metrics.totalIncome > 0 ? Math.round((metrics.totalExpense / metrics.totalIncome) * 100) : 0;

    let adviceStrategy = '';
    if (monthlyNet >= 0) {
      adviceStrategy = `با حفظ این الگو، تا ۳ ماه آینده به طور میانگین ${Math.round(monthlyNet * 3).toLocaleString('fa-IR')} تومان به دارایی خالص شما افزوده خواهد شد. پیشنهاد هوش مصنوعی چندبوم تخصیص ۵۰٪ از این مازاد به صندوق درآمد ثابت یا طلای آب‌شده جهت حفظ ارزش خرید است.`;
    } else {
      const deficit = Math.abs(monthlyNet);
      adviceStrategy = `⚠️ هشدار کسری: ماهانه ${deficit.toLocaleString('fa-IR')} تومان بیش از درآمدتان هزینه می‌کنید. در صورت عدم اصلاح، ظرف ۳ ماه آینده با کسری ${Math.round(deficit * 3).toLocaleString('fa-IR')} تومان مواجه خواهید شد. فوراً هزینه‌های تفریح و خریدهای غیرضروری را تا ۳۰٪ کاهش دهید.`;
    }

    return {
      text: `🔮 تحلیل و چشم‌انداز ۳ ماه آینده (هوش مصنوعی چندبوم):
• جریان نقدینگی ماهانه شما: ${monthlyNet >= 0 ? '+' : ''}${monthlyNet.toLocaleString('fa-IR')} تومان
• نسبت هزینه‌ها به درآمد: ${expenseRatio}٪
• پیش‌بینی تراز مالی پس از ۳ ماه: ${projectedBalance3m.toLocaleString('fa-IR')} تومان

📌 توصیه‌های استراتژیک برای ماه‌های پیش‌رو:
۱. ${adviceStrategy}
۲. کنترل سقف بودجه ماهانه در حد ${monthlyCap > 0 ? monthlyCap.toLocaleString('fa-IR') : 'معقول'} تومان.
۳. تسویه به موقع اقساط سررسید شده برای جلوگیری از جریمه دیرکرد.`,
    };
  }

  // 2. Budget and general situation
  if (q.includes('بودجه') || q.includes('وضعیت') || q.includes('چطوره')) {
    const usagePercent = monthlyCap > 0 ? Math.round((metrics.totalExpense / monthlyCap) * 100) : 0;
    return {
      text: `📊 گزارش هوشمند وضعیت بودجه شما (هوش مصنوعی چندبوم):
• کل هزینه‌های ثبت‌شده: ${metrics.totalExpense.toLocaleString('fa-IR')} تومان
• کل درآمدها: ${metrics.totalIncome.toLocaleString('fa-IR')} تومان
• موجودی خالص: ${metrics.balance.toLocaleString('fa-IR')} تومان
• سقف بودجه مصوب: ${monthlyCap.toLocaleString('fa-IR')} تومان (مصرف: ${usagePercent}٪)

${
  usagePercent > 85
    ? '⚠️ هشدار جدی: سرعت مصرف بودجه بسیار بالاست. خریدهای غیرضروری را تا انتهای ماه متوقف نمایید.'
    : '✅ وضعیت مخارج در حاشیه امن و کاملاً تحت کنترل است.'
}`,
    };
  }

  // 3. Savings & Investments
  if (q.includes('پس‌انداز') || q.includes('سود') || q.includes('سرمایه') || q.includes('صرفه‌جویی')) {
    const savings = metrics.totalIncome - metrics.totalExpense;
    const rate = metrics.totalIncome > 0 ? Math.round((savings / metrics.totalIncome) * 100) : 0;
    return {
      text: `💡 تحلیل پس‌انداز و اندوخته مالی (هوش مصنوعی چندبوم):
• مازاد نقدینگی قابل پس‌انداز: ${Math.max(savings, 0).toLocaleString('fa-IR')} تومان
• نرخ پس‌انداز کنونی: ${rate}٪ از کل درآمدهای شما

توصیه چندبوم: حفظ قانون ۵۰/۳۰/۲۰ (۵۰٪ نیازهای ضروری، ۳۰٪ خواسته‌ها، ۲۰٪ پس‌انداز بدون دست‌زدن) مطمئن‌ترین مسیر تاب‌آوری اقتصادی است.`,
    };
  }

  // 4. Default financial guidance
  return {
    text: `من «هوش مصنوعی چندبوم» هستم؛ دستیار اختصاصی مدیریت مالی و دنگ شما.
شما می‌توانید:
۱. تراکنش‌ها را ساده بنویسید تا فوری ثبت کنم (مثال: «خرید میوه ۶۵ تومن» یا «واریز حقوق ۳۵ میلیون»).
۲. بپرسید: «برام تحلیل کن که تا چند ماه آینده میتونم چیکار بکنم».
۳. درباره سقف بودجه، تراز پس‌انداز و دسته‌های پرهزینه سوال نمایید.`,
  };
}

