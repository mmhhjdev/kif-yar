import { Category, Transaction, MonthlyHistory, UserProfile, DongGroup, CategoryBudget, SupportTicket } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'salary', nameFa: 'حقوق و دستمزد', nameEn: 'Salary & Income', type: 'income', color: '#10B981', iconName: 'Wallet' },
  { id: 'freelance', nameFa: 'پروژه‌ای و فریلنس', nameEn: 'Freelance & Projects', type: 'income', color: '#0D9488', iconName: 'Briefcase' },
  { id: 'housing', nameFa: 'مسکن و اجاره', nameEn: 'Housing & Rent', type: 'expense', color: '#E11D48', iconName: 'Home' },
  { id: 'food', nameFa: 'خوراکی و سوپرمارکت', nameEn: 'Food & Groceries', type: 'expense', color: '#D97706', iconName: 'ShoppingCart' },
  { id: 'transport', nameFa: 'حمل و نقل و خودرو', nameEn: 'Transportation', type: 'expense', color: '#7C3AED', iconName: 'Car' },
  { id: 'investment', nameFa: 'سرمایه‌گذاری و طلا/ارز', nameEn: 'Investments', type: 'both', color: '#2563EB', iconName: 'TrendingUp' },
  { id: 'entertainment', nameFa: 'تفریح و سرگرمی', nameEn: 'Entertainment', type: 'expense', color: '#DB2777', iconName: 'Film' },
  { id: 'bills', nameFa: 'قبوض و اینترنت', nameEn: 'Bills & Utilities', type: 'expense', color: '#4F46E5', iconName: 'Zap' },
  { id: 'health', nameFa: 'پزشکی و سلامت', nameEn: 'Health & Medical', type: 'expense', color: '#059669', iconName: 'Activity' },
  { id: 'shopping', nameFa: 'پوشاک و خرید آنلاین', nameEn: 'Shopping & Clothes', type: 'expense', color: '#EA580C', iconName: 'ShoppingBag' },
  { id: 'other', nameFa: 'سایر موارد', nameEn: 'Other Expenses', type: 'both', color: '#64748B', iconName: 'MoreHorizontal' },
];

export const INITIAL_CATEGORY_BUDGETS: CategoryBudget[] = [
  { categoryId: 'housing', monthlyLimit: 15000000 },
  { categoryId: 'food', monthlyLimit: 6000000 },
  { categoryId: 'transport', monthlyLimit: 3000000 },
  { categoryId: 'entertainment', monthlyLimit: 4000000 },
  { categoryId: 'shopping', monthlyLimit: 5000000 },
  { categoryId: 'bills', monthlyLimit: 1500000 },
  { categoryId: 'health', monthlyLimit: 2500000 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const MONTHLY_HISTORY_DATA: MonthlyHistory[] = [];

export const INITIAL_DONGS: DongGroup[] = [];

export const INITIAL_PROFILE: UserProfile = {
  name: 'کاربر ولتیار',
  email: 'user@walletyar.ir',
  avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="%23059669"/><path d="M33 36 C33 22 67 22 67 36 C60 26 40 26 33 36 Z" fill="%23022c22"/><circle cx="50" cy="42" r="17" fill="%23a7f3d0"/><path d="M33 40 C33 58 40 64 50 64 C60 64 67 58 67 40 C65 57 35 57 33 40 Z" fill="%23022c22"/><path d="M42 47 Q50 51 58 47 Q50 49 42 47 Z" fill="%23022c22"/><path d="M20 88 C25 66 36 62 50 62 C64 62 75 66 80 88 Z" fill="%23d1fae5"/></svg>',
  monthlyGoal: 20000000,
  currentBalance: 0,
  membershipTier: 'کاربر ولتیار',
  currency: 'تومان',
};

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'ticket-101',
    user_id: 'usr-1',
    user_email: 'ali.rezaei@example.com',
    user_name: 'علی رضایی',
    subject: 'درخواست راهنمایی جهت خروجی اکسل گزارشات ماهانه',
    message: 'سلام وقت بخیر، چطور می‌توانم تمام تراکنش‌های سه‌ماهه گذشته را در قالب یک فایل اکسل تفکیک‌شده دانلود کنم؟',
    status: 'open',
    priority: 'medium',
    category: 'امور مالی و تراکنش‌ها',
    created_at: '2026-08-14T06:30:00.000Z',
  },
  {
    id: 'ticket-102',
    user_id: 'usr-2',
    user_email: 'sara.moradi@gmail.com',
    user_name: 'سارا مرادی',
    subject: 'پیشنهاد افزودن قابلیت تقویم اقساط و چک‌ها',
    message: 'با سلام، نرم‌افزار ولتیار فوق‌العاده کاربردیه. ممنون میشم امکان ثبت یادآور سررسید چک‌ها و اقساط وام رو هم اضافه کنید.',
    status: 'open',
    priority: 'low',
    category: 'انتقاد و پیشنهاد',
    created_at: '2026-08-13T14:15:00.000Z',
  },
  {
    id: 'ticket-103',
    user_id: 'usr-3',
    user_email: 'mohammad.ahmadi@yahoo.com',
    user_name: 'محمد احمدی',
    subject: 'عدم محاسبه درست دنگ در حالت تسویه‌نشده',
    message: 'در بخش دنگ گروهی وقتی یک نفر تسویه می‌کند وضعیت به صورت زنده تغییر نکرد که با یکبار رفرش حل شد. لطفا بررسی بفرمایید.',
    status: 'closed',
    priority: 'high',
    category: 'گزارش خطا',
    created_at: '2026-08-12T09:40:00.000Z',
    admin_reply: 'با سلام و تشکر از گزارش شما، باگ مورد نظر در آخرین به‌روزرسانی سیستم رفع شد.',
    updated_at: '2026-08-12T11:20:00.000Z',
  },
];
