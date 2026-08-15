import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserProfile,
  Transaction,
  NotificationItem,
  Ticket,
  TicketMessage,
  ActiveTab,
  TransactionCategory,
} from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { MALE_AVATAR_SVG } from '../utils/avatars';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  adminMode: boolean;
  setAdminMode: (enabled: boolean) => void;

  isDarkMode: boolean;
  toggleDarkMode: () => void;

  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithEmail: (email: string, password?: string) => Promise<boolean>;
  registerWithEmail: (email: string, fullName: string, password?: string, avatarUrl?: string) => Promise<boolean>;
  logout: () => void;

  user: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;

  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  settleNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
  unreadNotificationsCount: number;

  tickets: Ticket[];
  selectedTicket: Ticket | null;
  setSelectedTicket: (ticket: Ticket | null) => void;
  createTicket: (ticket: { subject: string; department: Ticket['department']; priority: Ticket['priority']; initialMessage: string }) => Promise<void>;
  addTicketMessage: (ticketId: string, content: string, asAdmin?: boolean) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => void;

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
  USER: 'kefyar_user_data',
  AUTH: 'kefyar_is_authenticated',
  TRANSACTIONS: 'kefyar_transactions_data',
  NOTIFICATIONS: 'kefyar_notifications_data',
  TICKETS: 'kefyar_tickets_data',
  THEME: 'kefyar_theme_mode',
  REGISTERED_USERS: 'kefyar_registered_users_db',
};

const ADMIN_EMAILS = [
  'seyedmahanhejrati@gmail.com',
  'mahan.hejrati91@gmail.com',
];

const EMPTY_USER: UserProfile = {
  id: '',
  email: '',
  full_name: '',
  avatar_url: MALE_AVATAR_SVG,
  monthly_budget_cap: 0,
  currency: 'تومان',
  theme_preference: 'dark',
  created_at: '',
  role: 'user',
};

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
  const [adminMode, setAdminMode] = useState<boolean>(false);
  const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
      if (saved !== null) return saved === 'true';
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved && isAuthenticated) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return EMPTY_USER;
  });

  const updateUserProfile = async (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...prev, ...updated };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
      return next;
    });

    const supabase = getSupabaseClient();
    if (supabase && user.id) {
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

  const loginWithEmail = async (email: string, password?: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password || '',
      });
      if (error) {
        throw new Error('ایمیل یا رمز عبور اشتباه است، یا کاربری با این مشخصات وجود ندارد.');
      }
      if (data.user) {
        const isAdmin = ADMIN_EMAILS.includes(cleanEmail);
        const loggedUser: UserProfile = {
          id: data.user.id,
          email: cleanEmail,
          full_name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          avatar_url: data.user.user_metadata?.avatar_url || MALE_AVATAR_SVG,
          monthly_budget_cap: 0,
          currency: 'تومان',
          theme_preference: isDarkMode ? 'dark' : 'light',
          created_at: data.user.created_at,
          role: isAdmin ? 'admin' : 'user',
        };
        setUser(loggedUser);
        setIsAuthenticated(true);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedUser));
        localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
        return true;
      }
    }

    try {
      const storedUsersRaw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      const registeredUsers: Array<UserProfile & { pass?: string }> = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      
      const foundUser = registeredUsers.find((u) => u.email === cleanEmail);
      if (!foundUser) {
        throw new Error('کاربری با این ایمیل ثبت‌نام نکرده است.');
      }

      if (password && foundUser.pass && foundUser.pass !== password) {
        throw new Error('رمز عبور وارد شده نادرست است.');
      }

      const isAdmin = ADMIN_EMAILS.includes(cleanEmail);
      const activeUser: UserProfile = {
        id: foundUser.id,
        email: foundUser.email,
        full_name: foundUser.full_name,
        avatar_url: foundUser.avatar_url,
        monthly_budget_cap: foundUser.monthly_budget_cap || 0,
        currency: foundUser.currency || 'تومان',
        theme_preference: foundUser.theme_preference || 'dark',
        created_at: foundUser.created_at,
        role: isAdmin ? 'admin' : 'user',
      };

      setUser(activeUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(activeUser));
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      return true;
    } catch (err: any) {
      throw err;
    }
  };

  const registerWithEmail = async (email: string, fullName: string, password?: string, avatarUrl?: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password || '',
        options: {
          data: {
            full_name: fullName.trim(),
            avatar_url: avatarUrl || MALE_AVATAR_SVG,
          }
        }
      });
      if (error) {
        throw new Error(error.message || 'خطا در ثبت‌نام با ایمیل.');
      }
    }

    try {
      const storedUsersRaw = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      const registeredUsers: Array<UserProfile & { pass?: string }> = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

      if (registeredUsers.some((u) => u.email === cleanEmail)) {
        throw new Error('این ایمیل قبلاً ثبت‌نام شده است.');
      }

      const isAdmin = ADMIN_EMAILS.includes(cleanEmail);
      const newUser: UserProfile & { pass?: string } = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        email: cleanEmail,
        full_name: fullName.trim(),
        avatar_url: avatarUrl || MALE_AVATAR_SVG,
        monthly_budget_cap: 0,
        currency: 'تومان',
        theme_preference: isDarkMode ? 'dark' : 'light',
        created_at: new Date().toISOString(),
        role: isAdmin ? 'admin' : 'user',
        pass: password,
      };

      registeredUsers.push(newUser);
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(registeredUsers));

      const activeUser: UserProfile = {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        avatar_url: newUser.avatar_url,
        monthly_budget_cap: newUser.monthly_budget_cap,
        currency: newUser.currency,
        theme_preference: newUser.theme_preference,
        created_at: newUser.created_at,
        role: newUser.role,
      };

      setUser(activeUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(activeUser));
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      return true;
    } catch (err: any) {
      throw err;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'false');
    resetToInitialData();
  };

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved && isAuthenticated) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      if (isAuthenticated) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      }
    } catch (e) {
      console.error(e);
    }
  }, [transactions, isAuthenticated]);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (tx.type === 'expense' && user.monthly_budget_cap > 0) {
      const currentMonthExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) + tx.amount;

      if (currentMonthExpenses > user.monthly_budget_cap) {
        addNotification({
          type: 'budget_alert',
          title: 'هشدار عبور از سقف بودجه ماهانه',
          message: `مجموع هزینه‌های شما با ثبت این تراکنش به بیش از سقف بودجه تعیین شده رسید.`,
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

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved && isAuthenticated) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      if (isAuthenticated) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      }
    } catch (e) {
      console.error(e);
    }
  }, [notifications, isAuthenticated]);

  const addNotification = (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user.id,
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

  // Support Tickets State & Supabase Integration Sync
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      if (saved && isAuthenticated) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // بارگذاری تیکت‌ها از Supabase هنگام ورود یا تغییر حالت ادمین/کاربر
  const fetchTicketsFromSupabase = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !isAuthenticated) return;

    try {
      let query = supabase.from('tickets').select('*, messages:ticket_messages(*)');
      
      // اگر ادمین نیست، فقط تیکت‌های خود کاربر را بیاور
      if (user.role !== 'admin' && !adminMode) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });
      if (!error && data) {
        setTickets(data as Ticket[]);
      }
    } catch (err) {
      console.warn('Could not fetch tickets from Supabase:', err);
    }
  }, [isAuthenticated, user.id, user.role, adminMode]);

  useEffect(() => {
    fetchTicketsFromSupabase();
  }, [fetchTicketsFromSupabase]);

  useEffect(() => {
    try {
      if (isAuthenticated) {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
      }
    } catch (e) {
      console.error(e);
    }
  }, [tickets, isAuthenticated]);

  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find((t) => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
  }, [tickets, selectedTicket]);

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
    const ticketId = `tkt-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: 'user',
      content: initialMessage,
      created_at: nowIso,
    };

    const newTicket: Ticket = {
      id: ticketId,
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      subject,
      department,
      priority,
      status: 'open',
      created_at: nowIso,
      updated_at: nowIso,
      messages: [newMsg],
    };

    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicket(newTicket);

    // ارسال به Supabase جهت دسترسی ادمین در پنل پشتیبانی
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('tickets').insert({
          id: ticketId,
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
          subject,
          department,
          priority,
          status: 'open',
          created_at: nowIso,
          updated_at: nowIso,
        });

        await supabase.from('ticket_messages').insert({
          id: newMsg.id,
          ticket_id: ticketId,
          sender_id: user.id,
          sender_name: user.full_name,
          sender_role: 'user',
          content: initialMessage,
          created_at: nowIso,
        });
      } catch (err) {
        console.warn('Could not sync created ticket to Supabase:', err);
      }
    }
  };

  const addTicketMessage = async (ticketId: string, content: string, asAdmin: boolean = false) => {
    const nowIso = new Date().toISOString();
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticket_id: ticketId,
      sender_id: asAdmin ? 'admin-kefyar-01' : user.id,
      sender_name: asAdmin ? 'پشتیبان ارشد کیفیار' : user.full_name,
      sender_role: asAdmin ? 'admin' : 'user',
      content,
      created_at: nowIso,
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const nextStatus = asAdmin ? 'resolved' : 'in_progress';
          return {
            ...t,
            status: nextStatus,
            updated_at: nowIso,
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    // همگام‌سازی پیام جدید با دیتابیس Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const nextStatus = asAdmin ? 'resolved' : 'in_progress';
        await supabase.from('ticket_messages').insert({
          id: newMsg.id,
          ticket_id: ticketId,
          sender_id: newMsg.sender_id,
          sender_name: newMsg.sender_name,
          sender_role: newMsg.sender_role,
          content,
          created_at: nowIso,
        });

        await supabase.from('tickets').update({
          status: nextStatus,
          updated_at: nowIso,
        }).eq('id', ticketId);
      } catch (err) {
        console.warn('Could not sync ticket message to Supabase:', err);
      }
    }
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    const nowIso = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, updated_at: nowIso } : t))
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('tickets').update({
          status,
          updated_at: nowIso,
        }).eq('id', ticketId);
      } catch (err) {
        console.warn('Could not update ticket status in Supabase:', err);
      }
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
    setUser(EMPTY_USER);
    setTransactions([]);
    setNotifications([]);
    setTickets([]);
    setSelectedTicket(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'false');
    setIsAuthenticated(false);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        adminMode,
        setAdminMode,
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