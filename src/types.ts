export type TransactionType = 'income' | 'expense';

export type CategoryId = 
  | 'housing'
  | 'food'
  | 'transport'
  | 'investment'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'shopping'
  | 'salary'
  | 'freelance'
  | 'other';

export interface Category {
  id: CategoryId;
  nameFa: string;
  nameEn: string;
  type: TransactionType | 'both';
  color: string;
  iconName: string;
}

export interface CategoryBudget {
  categoryId: CategoryId;
  monthlyLimit: number;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number; // In Tomans
  type: TransactionType;
  category: CategoryId;
  date: string; // YYYY/MM/DD in Jalali or ISO format string
  notes?: string;
  merchant?: string;
}

export interface MonthlyHistory {
  month: string; // e.g., 'فروردین', 'اردیبهشت', 'خرداد'
  income: number;
  expense: number;
  savings: number;
  savingsRate: number; // percentage
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  monthlyGoal: number; // Target savings in Tomans
  currentBalance: number;
  membershipTier: string;
  currency: 'تومان' | 'ریال';
}

export interface AuthUser {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  provider: 'email' | 'phone' | 'google';
  isAuthenticated: boolean;
}

export interface DongMember {
  id: string;
  name: string;
  shareAmount: number; // calculated share
  paidAmount: number;  // amount this person actually paid
  isSettled: boolean;
}

export interface DongGroup {
  id: string;
  title: string; // e.g., 'سفر اصفهان - هزینه ویلا و غذا'
  totalAmount: number;
  payerName: string; // who covered the bill
  date: string;
  category: CategoryId;
  members: DongMember[];
  notes?: string;
}

export interface FilterState {
  searchQuery: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export type TicketStatus = 'open' | 'closed' | 'in_progress';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  created_at: string;
  admin_reply?: string;
  updated_at?: string;
}
