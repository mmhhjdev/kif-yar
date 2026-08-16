import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserProfile,
  Transaction,
  NotificationItem,
  Ticket,
  TicketMessage,
  ActiveTab,
  TransactionType,
  TransactionCategory,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TICKETS,
} from '../data/initialData';
import { getSupabaseClient } from '../lib/supabase';
import { MALE_AVATAR_SVG } from '../utils/avatars';
import { isAdminEmail } from '../utils/admin';

export interface AuthResult {
  success: boolean;
  error?: string;
  requiresEmailConfirmation?: boolean;
}

interface AppContextType {
  // Navigation & View
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  adminMode: boolean;
  setAdminMode: (enabled: boolean) => void;
  isAdmin: boolean;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Authentication & Session
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithEmail: (email: string, password?: string) => Promise<AuthResult>;
  registerWithEmail: (email: string, fullName: string, password?: string, avatarUrl?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;

  // User Profile
  user: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Notifications & Alarms
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  settleNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
  unreadNotificationsCount: number;

  // Tickets
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  setSelectedTicket: (ticket: Ticket | null) => void;
  createTicket: (ticket: { subject: string; department: Ticket['department']; priority: Ticket['priority']; initialMessage: string }) => void;
  addTicketMessage: (ticketId: string, content: string, asAdmin?: boolean) => void;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => void;

  // Analytics & Summary Computed Stats
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  monthlyBudgetCap: number;
  budgetUtilizationPercent: number;
  expensesByCategory: Record<TransactionCategory, number>;

  // Reset & Helpers
  resetToInitialData: () => void;
  activeSupportTicketId: string | null;
  navigateToSupportWithTicket: (ticketId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'kefyar_user_data',
  AUTH: 'kefyar_is_authenticated',
  TRANSACTIONS: 'kefyar_transactions_data',
  NOTIFICATIONS: 'kefyar_notifications_data',
  TICKETS: 'kefyar_tickets_data',
  THEME: 'kefyar_theme_mode',
};

function translateSupabaseError(msg: string): string {
  if (!msg) return 'خطایی در پردازش اطلاعات رخ داد.';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid path specified in request url') || lower.includes('invalid path')) {
    return 'آدرس یا تنظیمات ارتباط با سرور دیتابیس معتبر نیست. اگر هنوز حسابی نساخته‌اید، لطفاً از تب «ثبت‌نام در کیفیار» ثبت‌نام فرمایید.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'ایمیل یا رمز عبور وارد شده اشتباه است. اگر برای اولین بار وارد می‌شوید، لطفاً ابتدا از تب «ثبت‌نام در کیفیار» ثبت‌نام کنید.';
  }
  if (lower.includes('email not confirmed') || lower.includes('not verified')) {
    return 'آدرس ایمیل شما هنوز تایید نشده است. لطفاً صندوق ورودی ایمیل خود را بررسی و روی لینک فعال‌سازی کلیک کنید.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'حساب کاربری با این ایمیل قبلاً ثبت‌نام شده است. لطفاً از تب ورود وارد شوید.';
  }
  if (lower.includes('password should be at least')) {
    return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'تعداد درخواست‌های ارسالی بیش از حد مجاز است. لطفاً دقایقی دیگر تلاش فرمایید.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network error')) {
    return 'خطای برقراری ارتباط با شبکه یا سرور دیتابیس رخ داده است.';
  }
  return msg;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // 2. Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [adminMode, setAdminModeState] = useState<boolean>(false);
  const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);

  // 3. Authentication & Session State (Starts Logged Out by default unless active Supabase session exists)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (saved === 'true') return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 4. User Profile State (Strictly empty/guest when logged out)
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const isAuth = localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (isAuth && saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USER;
  });

  // Admin Check: Strictly for the designated master admin Gmail
  const isAdmin = useMemo(() => {
    return isAuthenticated && isAdminEmail(user?.email);
  }, [isAuthenticated, user?.email]);

  const setAdminMode = useCallback((enabled: boolean) => {
    if (enabled && !isAdmin) {
      alert('دسترسی به پنل پشتیبان فقط برای مدیر ارشد سامانه (seyedmahanhejrati@gmail.com) امکان‌پذیر است.');
      setAdminModeState(false);
      return;
    }
    setAdminModeState(enabled);
  }, [isAdmin]);

  // Clean legacy mock data if present
  useEffect(() => {
    try {
      const oldTk = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (oldTk && (oldTk.includes('tkt-101') || oldTk.includes('tkt-102') || oldTk.includes('راهنمایی در مورد فرمت خروجی'))) {
        localStorage.removeItem(STORAGE_KEYS.TICKETS);
        setTickets([]);
      }
      const oldTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (oldTx && (oldTx.includes('tx-1') || oldTx.includes('حقوق ماهانه شرکت') || oldTx.includes('فروش دارایی طلا'))) {
        localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        setTransactions([]);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Listen to Supabase Auth State changes on mount
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const isAdm = isAdminEmail(session.user.email);
        const activeUser: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'کاربر کیفیار',
          avatar_url: session.user.user_metadata?.avatar_url || MALE_AVATAR_SVG,
          monthly_budget_cap: session.user.user_metadata?.monthly_budget_cap || 0,
          currency: 'تومان',
          theme_preference: isDarkMode ? 'dark' : 'light',
          role: isAdm ? 'admin' : 'user',
          created_at: session.user.created_at,
        };
        setUser(activeUser);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(activeUser));
      }
    }).catch(console.error);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const isAdm = isAdminEmail(session.user.email);
        const activeUser: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'کاربر کیفیار',
          avatar_url: session.user.user_metadata?.avatar_url || MALE_AVATAR_SVG,
          monthly_budget_cap: session.user.user_metadata?.monthly_budget_cap || 0,
          currency: 'تومان',
          theme_preference: isDarkMode ? 'dark' : 'light',
          role: isAdm ? 'admin' : 'user',
          created_at: session.user.created_at,
        };
        setUser(activeUser);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(activeUser));
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(INITIAL_USER);
        setAdminModeState(false);
        setTransactions([]);
        setNotifications([]);
        setTickets([]);
        setSelectedTicket(null);
        localStorage.removeItem(STORAGE_KEYS.AUTH);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
        localStorage.removeItem(STORAGE_KEYS.TICKETS);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [isDarkMode]);

  const updateUserProfile = async (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...prev, ...updated };
      if (isAuthenticated) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
      }
      return next;
    });

    // Sync to Supabase if connected
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        await supabase.from('users').upsert({
          id: user.id,
          email: updated.email ?? user.email,
          full_name: updated.full_name ?? user.full_name,
          avatar_url: updated.avatar_url !== undefined ? updated.avatar_url : user.avatar_url,
          monthly_budget_cap: updated.monthly_budget_cap ?? user.monthly_budget_cap,
          theme_preference: updated.theme_preference ?? user.theme_preference,
          currency: updated.currency ?? user.currency,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not sync user profile update to Supabase:', err);
      }
    }
  };

  const loginWithEmail = async (email: string, password?: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    if (supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (error) {
          return { success: false, error: translateSupabaseError(error.message) };
        }

        if (data.user) {
          const isAdm = isAdminEmail(data.user.email);
          const activeUser: UserProfile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
            avatar_url: data.user.user_metadata?.avatar_url || MALE_AVATAR_SVG,
            monthly_budget_cap: data.user.user_metadata?.monthly_budget_cap || 0,
            currency: 'تومان',
            theme_preference: isDarkMode ? 'dark' : 'light',
            role: isAdm ? 'admin' : 'user',
            created_at: data.user.created_at,
          };
          setUser(activeUser);
          setIsAuthenticated(true);
          localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(activeUser));
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: translateSupabaseError(err?.message) };
      }
    }

    // Fallback if client is unavailable
    const isAdm = isAdminEmail(cleanEmail);
    const activeUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      full_name: cleanEmail.split('@')[0],
      avatar_url: MALE_AVATAR_SVG,
      monthly_budget_cap: 0,
      currency: 'تومان',
      theme_preference: isDarkMode ? 'dark' : 'light',
      role: isAdm ? 'admin' : 'user',
      created_at: new Date().toISOString(),
    };
    setUser(activeUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(activeUser));
    return { success: true };
  };

  const registerWithEmail = async (
    email: string,
    fullName: string,
    password?: string,
    avatarUrl?: string
  ): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    if (supabase && password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
              avatar_url: avatarUrl || MALE_AVATAR_SVG,
            },
          },
        });

        if (error) {
          return { success: false, error: translateSupabaseError(error.message) };
        }

        // If session was returned immediately without email confirmation
        if (data.session && data.user) {
          const isAdm = isAdminEmail(data.user.email);
          const newUser: UserProfile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name: fullName.trim(),
            avatar_url: avatarUrl || MALE_AVATAR_SVG,
            monthly_budget_cap: 0,
            currency: 'تومان',
            theme_preference: isDarkMode ? 'dark' : 'light',
            created_at: data.user.created_at,
            role: isAdm ? 'admin' : 'user',
          };
          setUser(newUser);
          setIsAuthenticated(true);
          localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
          return { success: true, requiresEmailConfirmation: false };
        }

        // Supabase requires email verification
        if (data.user && !data.session) {
          return { success: true, requiresEmailConfirmation: true };
        }
      } catch (err: any) {
        return { success: false, error: translateSupabaseError(err?.message) };
      }
    }

    // Fallback
    const isAdm = isAdminEmail(cleanEmail);
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      full_name: fullName.trim(),
      avatar_url: avatarUrl || MALE_AVATAR_SVG,
      monthly_budget_cap: 0,
      currency: 'تومان',
      theme_preference: isDarkMode ? 'dark' : 'light',
      created_at: new Date().toISOString(),
      role: isAdm ? 'admin' : 'user',
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    return { success: true, requiresEmailConfirmation: false };
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    setIsAuthenticated(false);
    setAdminModeState(false);
    setUser(INITIAL_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  // 5. Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user.id || 'usr-local',
      created_at: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    // Check if adding this expense pushes monthly expenses over budget cap
    if (tx.type === 'expense' && user.monthly_budget_cap > 0) {
      const currentMonthExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) + tx.amount;

      if (currentMonthExpenses > user.monthly_budget_cap) {
        addNotification({
          type: 'budget_alert',
          title: 'هشدار عبور از سقف بودجه ماهانه',
          message: `مجموع هزینه‌های شما با ثبت این تراکنش به بیش از سقف بودجه تعیین شده (${user.monthly_budget_cap.toLocaleString()} تومان) رسید.`,
          amount: currentMonthExpenses,
          priority: 'urgent',
        });
      }
    }
  };

  const updateTransaction = (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // 6. Notifications & Alarms State
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  const addNotification = (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user.id || 'usr-local',
      is_read: false,
      status: item.status || 'pending',
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const settleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'settled', is_read: true } : n))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // 7. Support Tickets State
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TICKETS;
  });

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    } catch (e) {
      console.error(e);
    }
  }, [tickets]);

  // Keep selected ticket synchronized with latest state
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find((t) => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  }, [tickets]);

  const createTicket = ({
    subject,
    department,
    priority,
    initialMessage,
  }: {
    subject: string;
    department: Ticket['department'];
    priority: Ticket['priority'];
    initialMessage: string;
  }) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const ticketId = `tkt-${Date.now()}`;
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: user.id || 'usr-local',
      sender_name: user.full_name || 'کاربر',
      sender_role: 'user',
      content: initialMessage,
      created_at: new Date().toISOString(),
    };

    const newTicket: Ticket = {
      id: ticketId,
      user_id: user.id || 'usr-local',
      user_name: user.full_name || 'کاربر',
      user_email: user.email || '',
      subject,
      department,
      priority,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [newMsg],
    };

    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicket(newTicket);

    addNotification({
      type: 'system',
      title: 'ثبت تیکت پشتیبانی جدید',
      message: `تیکت «${subject}» با موفقیت در سیستم ثبت گردید و در صف بررسی کارشناسان کیفیار قرار گرفت.`,
      priority: 'normal',
    });
  };

  const addTicketMessage = (ticketId: string, content: string, asAdmin: boolean = false) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const isActAsAdmin = asAdmin && isAdmin;
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticket_id: ticketId,
      sender_id: isActAsAdmin ? 'admin-kefyar-01' : (user.id || 'usr-local'),
      sender_name: isActAsAdmin ? 'پشتیبان ارشد کیفیار' : (user.full_name || 'کاربر'),
      sender_role: isActAsAdmin ? 'admin' : 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const nextStatus = isActAsAdmin ? 'resolved' : 'in_progress';
          return {
            ...t,
            status: nextStatus,
            updated_at: new Date().toISOString(),
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    if (isActAsAdmin) {
      addNotification({
        type: 'system',
        title: 'پاسخ جدید به تیکت پشتیبانی',
        message: `پشتیبان کیفیار به تیکت شما پاسخ داد: "${content.slice(0, 60)}..."`,
        priority: 'high',
      });
    }
  };

  const updateTicketStatus = (ticketId: string, status: Ticket['status']) => {
    if (!isAdmin) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, updated_at: new Date().toISOString() } : t))
    );
  };

  const navigateToSupportWithTicket = (ticketId?: string) => {
    setActiveTab('support');
    if (ticketId) {
      const found = tickets.find((t) => t.id === ticketId);
      if (found) {
        setSelectedTicket(found);
        setActiveSupportTicketId(ticketId);
      }
    }
  };

  // 8. Computed Stats
  const totalIncome = useMemo(() => {
    return transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const netBalance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const monthlyBudgetCap = user.monthly_budget_cap || 0;

  const budgetUtilizationPercent = useMemo(() => {
    if (!monthlyBudgetCap || monthlyBudgetCap <= 0) return 0;
    return Math.min(Math.round((totalExpense / monthlyBudgetCap) * 100), 100);
  }, [totalExpense, monthlyBudgetCap]);

  const expensesByCategory = useMemo(() => {
    const result = {} as Record<TransactionCategory, number>;
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        result[t.category] = (result[t.category] || 0) + t.amount;
      });
    return result;
  }, [transactions]);

  const resetToInitialData = () => {
    setUser(INITIAL_USER);
    setTransactions([]);
    setNotifications([]);
    setTickets([]);
    setSelectedTicket(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        adminMode,
        setAdminMode,
        isAdmin,
        isDarkMode,
        toggleDarkMode,
        isAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithEmail,
        registerWithEmail,
        logout,
        user,
        updateUserProfile,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        settleNotification,
        deleteNotification,
        unreadNotificationsCount,
        tickets,
        selectedTicket,
        setSelectedTicket,
        createTicket,
        addTicketMessage,
        updateTicketStatus,
        totalIncome,
        totalExpense,
        netBalance,
        monthlyBudgetCap,
        budgetUtilizationPercent,
        expensesByCategory,
        resetToInitialData,
        activeSupportTicketId,
        navigateToSupportWithTicket,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
