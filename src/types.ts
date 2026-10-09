export type TransactionType = 'expense' | 'income';

export type TransactionCategory =
  | 'خوراک و رستوران'
  | 'مسکن و اجاره'
  | 'حمل‌ونقل و خودرو'
  | 'خرید و پوشاک'
  | 'سرگرمی و تفریح'
  | 'سلامت و درمان'
  | 'قبوض و شارژ'
  | 'آموزش و کتاب'
  | 'حقوق و دستمزد'
  | 'سرمایه‌گذاری و پس‌انداز'
  | 'کسب‌وکار و فروش'
  | 'سایر و متفرقه';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number; // in Tomans
  category: TransactionCategory;
  date: string; // YYYY-MM-DD or Persian Date string
  description: string;
  account: 'کارت اصلی' | 'حساب پس‌انداز' | 'کیف پول نقد' | 'کارت تنخواه';
  tags?: string[];
  created_at: string;
}

export type NotificationType =
  | 'budget_alert'   // هشدار سقف بودجه
  | 'debt_reminder'  // یادآوری پرداخت دنگ و بدهی
  | 'check_due'      // سررسید چک و اقساط
  | 'bill_reminder'  // قبض و اشتراک
  | 'system';        // پیام سیستم

export interface NotificationItem {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  amount?: number;
  due_date?: string;
  person_name?: string; // e.g. علی رضایی (for debt/split)
  is_read: boolean;
  status?: 'pending' | 'settled' | 'dismissed';
  priority?: 'normal' | 'high' | 'urgent';
  created_at: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketDepartment = 'پشتیبانی مالی' | 'پشتیبانی فنی' | 'انتقادات و پیشنهادات' | 'عمومی';

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'user' | 'admin';
  content: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  department: TicketDepartment;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  monthly_budget_cap: number; // in Tomans
  theme_preference: 'dark' | 'light';
  currency: 'تومان';
  created_at: string;
  role: 'user' | 'admin';
}

export interface CategoryBudget {
  category: TransactionCategory;
  monthly_limit: number;
  color: string;
  iconName: string;
}

export type ActiveTab = 'dashboard' | 'transactions' | 'analytics' | 'reminders' | 'support' | 'settings';
