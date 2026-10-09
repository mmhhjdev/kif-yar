import {
  UserProfile,
  Transaction,
  NotificationItem,
  Ticket,
  SubscriptionPlan,
  ManualPaymentSubmission,
  TransactionCategory,
  Reminder,
  FinancialGoal,
} from '../types';
import { MALE_AVATAR_SVG } from '../utils/avatars';

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'خوراک و غذا',
  'خرید و پوشاک',
  'حمل و نقل',
  'مسکن و قبوض',
  'سلامت و درمان',
  'آموزش و یادگیری',
  'تفریح و سرگرمی',
  'سایر',
];

export const INCOME_CATEGORIES: TransactionCategory[] = [
  'حقوق و دستمزد',
  'سرمایه‌گذاری',
  'سایر',
];

export const BANK_CARD_CONFIG = {
  bankName: 'بانک سامان',
  cardNumber: '6219861959761510',
  accountHolder: 'سید محمد ماهان هجرتی',
  iban: 'IR240560611827016420069701',
  expiryDate: '06/07',
  description: 'لطفاً مبلغ پلن انتخابی را به شماره کارت بانک سامان فوق واریز نموده و عکس فیش واریزی را آپلود نمایید.',
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'pro-1m',
    name: 'Pro 1 Month',
    nameFa: 'اشتراک ۱ ماهه طلایی',
    price: 89000,
    durationMonths: 1,
    description: 'شروع ارتقای حساب و مدیریت هوشمند ماهانه با هوش مصنوعی چندبوم',
    badge: 'شروع سریع',
    features: [
      'ثبت نامحدود درآمدها و هزینه‌ها',
      'هوش مصنوعی چندبوم جهت ثبت تراکنش و تحلیل مالی',
      'محاسبه دقیق دنگ و تسویه گروهی',
      'یادآورهای نامحدود چک و سررسید اقساط',
      'پشتیبانی آنلاین و تایید سریع واریزی',
    ],
  },
  {
    id: 'pro-3m',
    name: 'Pro 3 Months',
    nameFa: 'اشتراک ۳ ماهه ویژه',
    price: 220000,
    durationMonths: 3,
    description: 'بهترین انتخاب برای بودجه‌بندی هوشمند، پس‌انداز و پیش‌بینی چندماهه',
    isPopular: true,
    badge: 'محبوب‌ترین پلن',
    features: [
      'تمام امکانات اشتراک ۱ ماهه',
      'تحلیل هوشمند و پیش‌بینی دخل و خرج ۳ ماه آینده',
      'سیستم آلارم پیش‌بینی اتمام سقف بودجه',
      'امکان استخراج گزارش‌های جامع مالی',
      'اولویت ویژه در تایید فیش کارت‌به‌کارت',
      'پشتیبانی VIP چندبوم',
    ],
  },
  {
    id: 'pro-6m',
    name: 'Pro 6 Months VIP',
    nameFa: 'اشتراک ۶ ماهه VIP طلایی',
    price: 390000,
    durationMonths: 6,
    description: 'کامل‌ترین سطح دسترسی با بیشترین تخفیف و بیشترین صرفه اقتصادی',
    badge: 'بیشترین تخفیف (VIP)',
    features: [
      'تمام امکانات پلن‌های ۱ و ۳ ماهه',
      'پیش‌بینی جامع جریان نقدینگی و اهداف پس‌انداز بلندمدت',
      'دسترسی زودهنگام به تمام امکانات جدید چندبوم',
      'تایید فوری زیر ۱۰ دقیقه توسط مدیر سامانه',
      'مشاوره اختصاصی بهینه‌سازی پس‌انداز با هوش مصنوعی چندبوم',
    ],
  },
];

export const GUEST_USER: UserProfile = {
  id: 'usr-guest',
  email: '',
  full_name: 'کاربر مهمان',
  avatar_url: MALE_AVATAR_SVG,
  role: 'user',
  tier: 'free',
  subscription_status: 'none',
  subscription_expires_at: null,
  monthly_budget_cap: 0,
  theme_preference: 'dark',
  currency: 'تومان',
  created_at: new Date().toISOString(),
};

export const INITIAL_USER: UserProfile = {
  id: 'usr-admin-01',
  email: 'seyedmahanhejrati@gmail.com',
  full_name: 'سید ماهان هجرتی',
  avatar_url: MALE_AVATAR_SVG,
  role: 'admin',
  tier: 'pro',
  subscription_status: 'active',
  subscription_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  monthly_budget_cap: 35000000,
  theme_preference: 'dark',
  currency: 'تومان',
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_REMINDERS: Reminder[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_TICKETS: Ticket[] = [];

export const INITIAL_MANUAL_PAYMENTS: ManualPaymentSubmission[] = [];

export const INITIAL_GOALS: FinancialGoal[] = [];