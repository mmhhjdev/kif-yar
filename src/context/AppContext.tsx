import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  // Navigation & View
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  adminMode: boolean;
  setAdminMode: (enabled: boolean) => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Authentication & Session
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithEmail: (email: string, password?: string, fullName?: string, avatarUrl?: string) => Promise<boolean>;
  registerWithEmail: (email: string, fullName: string, password?: string, avatarUrl?: string) => Promise<boolean>;
  logout: () => void;

  // User Profile
  user: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;

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

  const loginWithEmail = async (email: string, _password?: string, fullName?: string, avatarUrl?: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const derivedName = fullName?.trim() || (cleanEmail === user.email ? user.full_name : cleanEmail.split('@')[0]);
    const isAdmin = ADMIN_EMAILS.includes(cleanEmail);

    const updatedUser: UserProfile = {
      ...user,
      id: user.id || `usr-${Date.now()}`,
      email: cleanEmail,
      full_name: derivedName,
      avatar_url: avatarUrl || user.avatar_url || MALE_AVATAR_SVG,
      role: isAdmin ? 'admin' : 'user',
    };

    setUser(updatedUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    return true;
  };

  const registerWithEmail = async (email: string, fullName: string, _password?: string, avatarUrl?: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(cleanEmail);

    const newUser: UserProfile = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      email: cleanEmail,
      full_name: fullName.trim(),
      avatar_url: avatarUrl || MALE_AVATAR_SVG,
      monthly_budget_cap: 0,
      currency: 'تومان',
      theme_preference: isDarkMode ? 'dark' : 'light',
      created_at: new Date().toISOString(),
      role: isAdmin ? 'admin' : 'user',
    };

    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEYS.AUTH, 'false');
    resetToInitialData();
  };

  // Transactions State (Default to Empty Array)
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

  // Notifications State (Default to Empty Array)
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

  // Support Tickets State (Default to Empty Array)
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
    const ticketId = `tkt-${Date.now()}`;
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: 'user',
      content: initialMessage,
      created_at: new Date().toISOString(),
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [newMsg],
    };

    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicket(newTicket);
  };

  const addTicketMessage = (ticketId: string, content: string, asAdmin: boolean = false) => {
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticket_id: ticketId,
      sender_id: asAdmin ? 'admin-kefyar-01' : user.id,
      sender_name: asAdmin ? 'پشتیبان ارشد کیفیار' : user.full_name,
      sender_role: asAdmin ? 'admin' : 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const nextStatus = asAdmin ? 'resolved' : 'in_progress';
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
  };

  const updateTicketStatus = (ticketId: string, status: Ticket['status']) => {
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