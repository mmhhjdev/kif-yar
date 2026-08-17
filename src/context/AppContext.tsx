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
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  adminMode: boolean;
  setAdminMode: (enabled: boolean) => void;
  isAdmin: boolean;

  isDarkMode: boolean;
  toggleDarkMode: () => void;

  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithEmail: (email: string, password?: string) => Promise<AuthResult>;
  registerWithEmail: (email: string, fullName: string, password?: string, avatarUrl?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;

  user: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;

  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  settleNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  unreadNotificationsCount: number;

  tickets: Ticket[];
  selectedTicket: Ticket | null;
  setSelectedTicket: (ticket: Ticket | null) => void;
  createTicket: (ticket: { subject: string; department: Ticket['department']; priority: Ticket['priority']; initialMessage: string }) => Promise<void>;
  addTicketMessage: (ticketId: string, content: string, asAdmin?: boolean) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => Promise<void>;

  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  monthlyBudgetCap: number;
  budgetUtilizationPercent: number;
  expensesByCategory: Record<TransactionCategory, number>;

  resetToInitialData: () => void;
  activeSupportTicketId: string | null;
  navigateToSupportWithTicket: (ticketId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: 'kefyar_theme_mode',
};

function translateSupabaseError(msg: string): string {
  if (!msg) return 'خطایی در پردازش اطلاعات رخ داد.';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid path specified in request url') || lower.includes('invalid path')) {
    return 'آدرس یا تنظیمات ارتباط با سرور دیتابیس معتبر نیست.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'ایمیل یا رمز عبور وارد شده اشتباه است.';
  }
  if (lower.includes('email not confirmed') || lower.includes('not verified')) {
    return 'آدرس ایمیل شما هنوز تایید نشده است.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'حساب کاربری با این ایمیل قبلاً ثبت‌نام شده است.';
  }
  return msg;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [adminMode, setAdminModeState] = useState<boolean>(false);
  const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const isAdmin = useMemo(() => {
    return isAuthenticated && isAdminEmail(user?.email);
  }, [isAuthenticated, user?.email]);

  const setAdminMode = useCallback((enabled: boolean) => {
    if (enabled && !isAdmin) {
      alert('دسترسی به پنل پشتیبان فقط برای مدیر ارشد سامانه امکان‌پذیر است.');
      setAdminModeState(false);
      return;
    }
    setAdminModeState(enabled);
  }, [isAdmin]);

  // تابع کمکی برای بارگذاری داده‌های کاربر از Supabase
  const fetchUserDataFromSupabase = async (userId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      // 1. دریافت پروفایل
      const { data: profileData } = await supabase.from('users').select('*').eq('id', userId).single();
      if (profileData) {
        setUser((prev) => ({ ...prev, ...profileData }));
      }

      // 2. دریافت تراکنش‌ها
      const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (txData) setTransactions(txData);

      // 3. دریافت نوتیفیکیشن‌ها
      const { data: notifData } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (notifData) setNotifications(notifData);

      // 4. دریافت تیکت‌ها (اگر ادمین باشد همه را می‌گیرد، وگرنه تیکت‌های خودش را)
      const isAdm = isAdminEmail(profileData?.email);
      let ticketQuery = supabase.from('tickets').select('*').order('updated_at', { ascending: false });
      if (!isAdm) {
        ticketQuery = ticketQuery.eq('user_id', userId);
      }
      const { data: ticketData } = await ticketQuery;
      if (ticketData) setTickets(ticketData);

    } catch (err) {
      console.error('Error fetching user data from Supabase:', err);
    }
  };

  // مدیریت Session و لیسنر Supabase Auth
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

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
        fetchUserDataFromSupabase(session.user.id);
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
        fetchUserDataFromSupabase(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(INITIAL_USER);
        setAdminModeState(false);
        setTransactions([]);
        setNotifications([]);
        setTickets([]);
        setSelectedTicket(null);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [isDarkMode]);

  const updateUserProfile = async (updated: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updated }));

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
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: translateSupabaseError(err?.message) };
      }
    }
    return { success: false, error: 'خطا در ارتباط با سرور' };
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

        if (data.user && !data.session) {
          return { success: true, requiresEmailConfirmation: true };
        }
        return { success: true, requiresEmailConfirmation: false };
      } catch (err: any) {
        return { success: false, error: translateSupabaseError(err?.message) };
      }
    }
    return { success: false, error: 'خطا در ثبت‌نام' };
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
    setTransactions([]);
    setNotifications([]);
    setTickets([]);
  };

  // مدیریت تراکنش‌ها با دیتابیس
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    const newTxData = {
      user_id: user.id,
      amount: tx.amount,
      category: tx.category,
      type: tx.type,
      date: tx.date,
      description: tx.description,
      account: tx.account,
      tags: tx.tags,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('transactions').insert([newTxData]).select().single();
      if (!error && data) {
        setTransactions((prev) => [data, ...prev]);
      } else {
        console.error('Error adding transaction:', error);
      }
    }
  };

  const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('transactions').update(updated).eq('id', id);
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('transactions').delete().eq('id', id);
    }
  };

  // مدیریت نوتیفیکیشن‌ها با دیتابیس
  const addNotification = async (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => {
    if (!isAuthenticated) return;

    const newNotifData = {
      user_id: user.id,
      type: item.type,
      title: item.title,
      message: item.message,
      amount: item.amount,
      priority: item.priority || 'normal',
      status: item.status || 'pending',
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('notifications').insert([newNotifData]).select().single();
      if (!error && data) {
        setNotifications((prev) => [data, ...prev]);
      }
    }
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const supabase = getSupabaseClient();
    if (supabase && user.id) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    }
  };

  const settleNotification = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'settled', is_read: true } : n)));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('notifications').update({ status: 'settled', is_read: true }).eq('id', id);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('notifications').delete().eq('id', id);
    }
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // مدیریت تیکت‌ها با دیتابیس
  const createTicket = async ({
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
      sender_id: user.id,
      sender_name: user.full_name || 'کاربر',
      sender_role: 'user',
      content: initialMessage,
      created_at: new Date().toISOString(),
    };

    const newTicket: Ticket = {
      id: ticketId,
      user_id: user.id,
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

    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('tickets').insert([newTicket]);
    }
  };

  const addTicketMessage = async (ticketId: string, content: string, asAdmin: boolean = false) => {
    if (!isAuthenticated) return;

    const isActAsAdmin = asAdmin && isAdmin;
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticket_id: ticketId,
      sender_id: isActAsAdmin ? 'admin-kefyar-01' : user.id,
      sender_name: isActAsAdmin ? 'پشتیبان ارشد کیفیار' : (user.full_name || 'کاربر'),
      sender_role: isActAsAdmin ? 'admin' : 'user',
      content,
      created_at: new Date().toISOString(),
    };

    let updatedTicketList: Ticket[] = [];

    setTickets((prev) => {
      updatedTicketList = prev.map((t) => {
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
      });
      return updatedTicketList;
    });

    const targetTicket = updatedTicketList.find((t) => t.id === ticketId);
    const supabase = getSupabaseClient();
    if (supabase && targetTicket) {
      await supabase.from('tickets').update({
        status: targetTicket.status,
        updated_at: targetTicket.updated_at,
        messages: targetTicket.messages,
      }).eq('id', ticketId);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    if (!isAdmin) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, updated_at: new Date().toISOString() } : t))
    );
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', ticketId);
    }
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

  // محاسبات آماری
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