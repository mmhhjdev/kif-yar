import { UserProfile, Transaction, NotificationItem, Ticket } from '../types';
import { MALE_AVATAR_SVG } from '../utils/avatars';

export const INITIAL_USER: UserProfile = {
  id: '',
  email: '',
  full_name: 'کاربر مهمان',
  avatar_url: MALE_AVATAR_SVG,
  monthly_budget_cap: 0,
  theme_preference: 'dark',
  currency: 'تومان',
  created_at: new Date().toISOString(),
  role: 'user',
};

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

export const INITIAL_TICKETS: Ticket[] = [];

