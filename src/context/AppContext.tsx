import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  UserProfile,
  Transaction,
  NotificationItem,
  Ticket,
  TicketMessage,
  ActiveTab,
  UserRole,
  SubscriptionTier,
  Reminder,
  ManualPaymentSubmission,
  AIBudgetAlert,
  TransactionCategory,
  FinancialGoal,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TICKETS,
  INITIAL_REMINDERS,
  INITIAL_MANUAL_PAYMENTS,
  INITIAL_GOALS,
  GUEST_USER,
} from '../data/initialData';
import { generatePredictiveBudgetAlerts } from '../utils/aiParser';
import { isAdminEmail } from '../utils/admin';
import {
  requestAdminOtpViaEdgeFunction,
  verifyAdminOtpViaEdgeFunction,
  isAdmin2FAVerified as checkAdmin2FASession,
  revokeAdmin2FA,
} from '../utils/admin2fa';
import { updatePageSeo } from '../utils/seo';
import { getSupabaseClient, createUserOtp, verifyUserOtp } from '../lib/supabase';
import { MALE_AVATAR_SVG } from '../utils/avatars';

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

  // Admin 2FA / OTP via Edge Functions
  isAdmin2FAVerified: boolean;
  verifyAdmin2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
  requestAdminOtp: () => Promise<{ success: boolean; message?: string; error?: string; code?: string }>;
  logoutAdmin2FA: () => void;

  isDarkMode: boolean;
  toggleDarkMode: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (email: string, password?: string) => Promise<AuthResult>;
  register: (
    email: string,
    passwordOrFullName: string,
    fullNameOrPassword?: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر'
  ) => Promise<AuthResult>;
  loginWithEmail: (email: string, password?: string) => Promise<AuthResult>;
  registerWithEmail: (
    email: string,
    fullName: string,
    password?: string,
    avatarUrl?: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر'
  ) => Promise<AuthResult>;
  requestSignupOtp: (email: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  verifySignupOtpAndRegister: (
    email: string,
    code: string,
    password: string,
    fullName: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر'
  ) => Promise<AuthResult>;
  loginAsRole: (role: UserRole) => void;
  logout: () => Promise<void>;

  user: UserProfile;
  currentUser: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isProUser: boolean;
  upgradeUserTier: (tier: SubscriptionTier, durationMonths: number) => Promise<void>;

  // Financial Goals (اهداف مالی)
  goals: FinancialGoal[];
  addGoal: (goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;

  // Subscription modal
  isSubscriptionModalOpen: boolean;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;

  // Auth Guard modal
  isAuthGuardOpen: boolean;
  authGuardMessage: string;
  openAuthGuard: (message?: string) => void;
  closeAuthGuard: () => void;
  requestSubscription: () => void;

  // Users management for Admin
  allUsers: UserProfile[];
  updateUserRoleAndTier: (userId: string, role: UserRole, tier: SubscriptionTier) => Promise<void>;

  // Manual Card-to-Card Payment System
  manualPayments: ManualPaymentSubmission[];
  submitManualPayment: (data: Omit<ManualPaymentSubmission, 'id' | 'created_at' | 'status'>) => Promise<void>;
  approveManualPayment: (paymentId: string, adminNotes?: string) => Promise<void>;
  rejectManualPayment: (paymentId: string, adminNotes?: string) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Reminders
  reminders: Reminder[];
  addReminder: (rem: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateReminder: (id: string, rem: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminderPaid: (id: string) => Promise<void>;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  settleNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  unreadNotificationsCount: number;

  // Tickets
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  setSelectedTicket: (ticket: Ticket | null) => void;
  createTicket: (ticket: {
    subject: string;
    department: Ticket['department'];
    priority: Ticket['priority'];
    initialMessage: string;
  }) => Promise<void>;
  addTicket: (
    subject: string,
    department: Ticket['department'],
    priority: Ticket['priority'],
    initialMessage: string
  ) => Promise<void>;
  addTicketMessage: (ticketId: string, content: string, asAdmin?: boolean) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => Promise<void>;

  // Financial Metrics & Predictive AI
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  monthlyBudgetCap: number;
  budgetUtilizationPercent: number;
  expensesByCategory: Record<TransactionCategory, number>;
  predictiveAlerts: AIBudgetAlert[];
  metrics: {
    balance: number;
    totalIncome: number;
    totalExpense: number;
    categoryBreakdown: Record<string, number>;
  };
  budgetInsight: {
    message: string;
    isWarning: boolean;
    dailyBurnRate: number;
  };

  // AI Assistant Modal
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;

  resetToInitialData: () => void;
  resetToDefaults: () => void;
  activeSupportTicketId: string | null;
  navigateToSupportWithTicket: (ticketId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
    return 'آدرس ایمیل شما هنوز تایید نشده است. لطفاً لینک فعال‌سازی ایمیل را بررسی نمایید.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'حساب کاربری با این ایمیل قبلاً ثبت‌نام شده است.';
  }
  if (lower.includes('password should be at least')) {
    return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
  }
  return msg;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Strict Zero LocalStorage & Zero SessionStorage policy:
  // Theme relies solely on component state and system preferences (no browser storage).
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const [activeTab, setActiveTabState] = useState<ActiveTab>('dashboard');
  const [adminMode, setAdminModeState] = useState<boolean>(false);
  const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);

  // Authenticated State strictly driven by Supabase Auth Session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  const [user, setUser] = useState<UserProfile>(GUEST_USER);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>(INITIAL_REMINDERS);
  const [manualPayments, setManualPayments] = useState<ManualPaymentSubmission[]>(INITIAL_MANUAL_PAYMENTS);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([INITIAL_USER]);
  const [goals, setGoals] = useState<FinancialGoal[]>(INITIAL_GOALS);

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const openSubscriptionModal = () => setIsSubscriptionModalOpen(true);
  const closeSubscriptionModal = () => setIsSubscriptionModalOpen(false);

  // Auth Guard State
  const [isAuthGuardOpen, setIsAuthGuardOpen] = useState(false);
  const [authGuardMessage, setAuthGuardMessage] = useState(
    'برای خرید اشتراک و استفاده از امکانات، لطفاً ابتدا ثبت‌نام کنید یا وارد حساب خود شوید.'
  );

  const openAuthGuard = (message?: string) => {
    if (message) setAuthGuardMessage(message);
    setIsAuthGuardOpen(true);
  };

  const closeAuthGuard = () => {
    setIsAuthGuardOpen(false);
  };

  const requestSubscription = () => {
    if (!isAuthenticated) {
      openAuthGuard('برای خرید اشتراک و استفاده از امکانات، لطفاً ابتدا ثبت‌نام کنید یا وارد حساب خود شوید.');
    } else {
      setIsSubscriptionModalOpen(true);
    }
  };

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    updatePageSeo(tab);
  };

  const isAdmin = useMemo(() => {
    return isAuthenticated && (user?.role === 'admin' || isAdminEmail(user?.email));
  }, [isAuthenticated, user?.role, user?.email]);

  const [admin2FAVerified, setAdmin2FAVerified] = useState<boolean>(() => {
    return checkAdmin2FASession(INITIAL_USER.email);
  });

  const requestAdminOtp = async () => {
    return await requestAdminOtpViaEdgeFunction(user.email || 'seyedmahanhejrati@gmail.com');
  };

  const verifyAdmin2FA = async (code: string) => {
    const result = await verifyAdminOtpViaEdgeFunction(code, user.email || 'seyedmahanhejrati@gmail.com');
    if (result.success) {
      setAdmin2FAVerified(true);
    }
    return result;
  };

  const logoutAdmin2FA = () => {
    revokeAdmin2FA();
    setAdmin2FAVerified(false);
    setAdminModeState(false);
  };

  const setAdminMode = useCallback(
    (enabled: boolean) => {
      if (enabled && !isAdmin) {
        alert('دسترسی به پنل مدیریت ارشد فقط برای مدیر سامانه چندبوم امکان‌پذیر است.');
        setAdminModeState(false);
        return;
      }
      setAdminModeState(enabled);
    },
    [isAdmin]
  );

  const isProUser = useMemo(() => {
    if (isAdmin) return true;
    if (user.tier === 'pro' || user.tier === 'vip') {
      if (user.subscription_expires_at) {
        return new Date(user.subscription_expires_at).getTime() > Date.now();
      }
      return user.subscription_status === 'active';
    }
    return false;
  }, [isAdmin, user.tier, user.subscription_status, user.subscription_expires_at]);

  // Direct Supabase synchronization
  const fetchUserDataFromSupabase = async (userId: string, userEmail: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      // 1. Fetch User Profile
      const { data: profileData } = await supabase.from('users').select('*').eq('id', userId).single();
      const isAdm = isAdminEmail(userEmail) || profileData?.role === 'admin';
      const currentRole: UserRole = isAdm ? 'admin' : (profileData?.role || 'user');

      const mergedUser: UserProfile = {
        ...GUEST_USER,
        ...profileData,
        id: userId,
        email: userEmail,
        role: currentRole,
        full_name: profileData?.full_name || userEmail.split('@')[0],
      };

      setUser(mergedUser);

      // 2. Fetch User Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (txData && txData.length > 0) {
        setTransactions(txData);
      }

      // 3. Fetch User Reminders
      const { data: remData } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });
      if (remData && remData.length > 0) {
        setReminders(remData);
      }

      // 4. Fetch User Notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (notifData && notifData.length > 0) {
        setNotifications(notifData);
      }

      // 5. Fetch Support Tickets
      let ticketQuery = supabase.from('tickets').select('*').order('updated_at', { ascending: false });
      if (!isAdm) {
        ticketQuery = ticketQuery.eq('user_id', userId);
      }
      const { data: ticketData } = await ticketQuery;
      if (ticketData && ticketData.length > 0) {
        setTickets(ticketData);
      }

      // 6. Fetch Manual Payments
      let payQuery = supabase.from('manual_payments').select('*').order('created_at', { ascending: false });
      if (!isAdm) {
        payQuery = payQuery.eq('user_id', userId);
      }
      const { data: payData } = await payQuery;
      if (payData && payData.length > 0) {
        setManualPayments(payData);
      }

      // 7. If Admin, fetch all users
      if (isAdm) {
        const { data: usersData } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (usersData && usersData.length > 0) {
          setAllUsers(usersData);
        }
      }

      // 8. Fetch Financial Goals
      const { data: goalsData } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (goalsData && goalsData.length > 0) {
        setGoals(goalsData);
      }
    } catch (err) {
      console.error('Error fetching live data from Supabase:', err);
    }
  };

  // Restore session via real Supabase Auth
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session retrieval error:', error);
          return;
        }

        if (session?.user) {
          setIsAuthenticated(true);
          const email = session.user.email || '';
          await fetchUserDataFromSupabase(session.user.id, email);
        }
      } catch (e) {
        console.warn('Could not restore Supabase session:', e);
      }
    };

    restoreSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
        const email = session.user.email || '';
        await fetchUserDataFromSupabase(session.user.id, email);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(GUEST_USER);
        setAdminModeState(false);
        setAdmin2FAVerified(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const updateUserProfile = async (updated: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updated }));
    setAllUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, ...updated, updated_at: new Date().toISOString() } : u))
    );

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        await supabase.from('users').upsert({
          ...user,
          ...updated,
          id: user.id,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not sync user profile update to Supabase:', err);
      }
    }
  };

  const upgradeUserTier = async (tier: SubscriptionTier, durationMonths: number) => {
    const durationDays = durationMonths * 30;
    // Smart Subscription Extension: Accumulate remaining active days without loss
    const currentExpiryTime = user.subscription_expires_at ? new Date(user.subscription_expires_at).getTime() : 0;
    const baseTime = currentExpiryTime > Date.now() ? currentExpiryTime : Date.now();
    const expiresAt = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();

    await updateUserProfile({
      tier,
      subscription_status: 'active',
      subscription_expires_at: expiresAt,
    });

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        await supabase.rpc('sync_user_subscription', {
          p_user_id: user.id,
          p_tier: tier,
          p_duration_days: durationDays,
        });
      } catch (rpcErr) {
        // Fallback to direct upsert handled by updateUserProfile
      }
    }

    await addNotification({
      type: 'subscription',
      title: 'ارتقای حساب به اشتراک طلایی چندبوم',
      message: `حساب کاربری شما با موفقیت به سطح ${tier.toUpperCase()} ارتقا یافت و روزهای باقی‌مانده اشتراک قبلی به دوره جدید افزوده شد.`,
      priority: 'normal',
      status: 'settled',
    });
  };

  const updateUserRoleAndTier = async (userId: string, role: UserRole, tier: SubscriptionTier) => {
    if (!isAdmin) return;
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role, tier, updated_at: new Date().toISOString() } : u))
    );
    if (user.id === userId) {
      setUser((prev) => ({ ...prev, role, tier }));
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('users').update({ role, tier, updated_at: new Date().toISOString() }).eq('id', userId);
      } catch (err) {
        console.error('Supabase updateUserRoleAndTier error:', err);
      }
    }
  };

  // Forward administrative comments / subscription status into Support Ticketing system
  const forwardAdminNotificationToTicket = async (
    targetUserId: string,
    targetUserName: string,
    targetUserEmail: string,
    subject: string,
    messageContent: string
  ) => {
    const supabase = getSupabaseClient();
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: '',
      sender_id: user.id || 'admin',
      sender_name: 'پشتیبان رسمی چندبوم (مدیریت)',
      sender_role: 'admin',
      content: messageContent,
      created_at: new Date().toISOString(),
    };

    // Find if user already has a ticket for subscription
    const existingTicket = tickets.find(
      (t) => (t.user_id === targetUserId || t.user_email === targetUserEmail) && t.subject.includes('اشتراک')
    );

    if (existingTicket) {
      newMsg.ticket_id = existingTicket.id;
      const updatedMessages = [...existingTicket.messages, newMsg];
      setTickets((prev) =>
        prev.map((t) =>
          t.id === existingTicket.id
            ? { ...t, status: 'resolved', updated_at: new Date().toISOString(), messages: updatedMessages }
            : t
        )
      );
      if (supabase) {
        try {
          await supabase
            .from('tickets')
            .update({
              status: 'resolved',
              updated_at: new Date().toISOString(),
              messages: updatedMessages,
            })
            .eq('id', existingTicket.id);
        } catch (e) {
          console.warn('Could not update ticket in Supabase:', e);
        }
      }
    } else {
      const ticketId = `tkt-${Date.now()}`;
      newMsg.ticket_id = ticketId;
      const newTicket: Ticket = {
        id: ticketId,
        user_id: targetUserId,
        user_name: targetUserName,
        user_email: targetUserEmail,
        subject,
        department: 'پشتیبانی مالی',
        priority: 'high',
        status: 'resolved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [newMsg],
      };
      setTickets((prev) => [newTicket, ...prev]);
      if (supabase) {
        try {
          await supabase.from('tickets').insert([newTicket]);
        } catch (e) {
          console.warn('Could not insert ticket in Supabase:', e);
        }
      }
    }
  };

  // Manual Card-to-Card Payment Actions
  const submitManualPayment = async (data: Omit<ManualPaymentSubmission, 'id' | 'created_at' | 'status'>) => {
    const newSubmission: ManualPaymentSubmission = {
      ...data,
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setManualPayments((prev) => [newSubmission, ...prev]);

    // Instantly update user subscription_status to 'pending_approval' to display the golden review badge
    await updateUserProfile({
      subscription_status: 'pending_approval',
    });

    // Immutably record in transactions history
    await addTransaction({
      amount: data.amount,
      type: 'expense',
      category: 'سایر',
      description: `واریز وجه اشتراک طلایی ${data.plan_name} (کد رهگیری: ${data.tracking_code})`,
      date: new Date().toISOString(),
      account: 'بانک سامان (کارت به کارت)',
    });

    await addNotification({
      type: 'subscription',
      title: 'رسید پرداخت ثبت شد',
      message: `اطلاعات واریزی کارت به کارت برای پلن «${data.plan_name}» ثبت و برای بررسی به مدیریت ارسال گردید.`,
      amount: data.amount,
      priority: 'normal',
      status: 'pending',
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('manual_payments').insert([newSubmission]);
        // Also insert in subscription_orders if user is authenticated
        if (data.user_id && data.user_id !== 'guest') {
          await supabase.from('subscription_orders').insert([{
            user_id: data.user_id,
            plan_id: data.plan_id,
            amount_toman: data.amount,
            receipt_path: data.receipt_url || '',
            note: data.notes || '',
            status: 'pending',
          }]);
        }
      } catch (err) {
        console.error('Supabase manual_payment insert error:', err);
      }
    }
  };

  const approveManualPayment = async (paymentId: string, adminNotes?: string) => {
    if (!isAdmin) return;
    let targetPayment: ManualPaymentSubmission | undefined;

    setManualPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          targetPayment = {
            ...p,
            status: 'approved',
            admin_notes: adminNotes || 'پرداخت تایید شد و اشتراک فعال گردید.',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.email,
          };
          return targetPayment;
        }
        return p;
      })
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('manual_payments')
          .update({
            status: 'approved',
            admin_notes: adminNotes || 'پرداخت تایید شد و اشتراک فعال گردید.',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.email,
          })
          .eq('id', paymentId);

        await supabase
          .from('subscription_orders')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
          })
          .eq('user_id', targetPayment?.user_id);
      } catch (err) {
        console.error('Supabase payment approval error:', err);
      }
    }

    if (targetPayment) {
      const p = targetPayment as ManualPaymentSubmission;
      let durationMonths = 1;
      let tier: SubscriptionTier = 'pro';
      if (p.plan_id.includes('3m')) durationMonths = 3;
      if (p.plan_id.includes('6m')) durationMonths = 6;
      if (p.plan_id.includes('1y')) durationMonths = 12;
      if (p.plan_id.includes('vip')) tier = 'vip';

      const durationDays = durationMonths * 30;
      const targetUser = allUsers.find((u) => u.id === p.user_id) || (user.id === p.user_id ? user : null);
      const currentExpiry = targetUser?.subscription_expires_at ? new Date(targetUser.subscription_expires_at).getTime() : 0;
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const expiresAt = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();

      if (user.id === p.user_id) {
        await updateUserProfile({
          tier,
          subscription_status: 'active',
          subscription_expires_at: expiresAt,
        });
      } else if (supabase) {
        await supabase
          .from('users')
          .update({
            tier,
            subscription_status: 'active',
            subscription_expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', p.user_id);
      }

      // Automatically forward support notification to user's ticket inbox
      const noteMsg = adminNotes?.trim() ? `\nیادداشت و نظر مدیر: ${adminNotes}` : '';
      const forwardText = `✅ کاربر گرامی، فیش واریزی شما برای اشتراک «${p.plan_name}» تایید و حساب شما به اشتراک طلایی ارتقا یافت.${noteMsg}`;
      await forwardAdminNotificationToTicket(
        p.user_id,
        p.user_name,
        p.user_email,
        'تایید و فعال‌سازی اشتراک طلایی چندبوم',
        forwardText
      );

      // Immutably record in transactions
      await addTransaction({
        amount: p.amount,
        type: 'expense',
        category: 'سایر',
        description: `تایید نهایی اشتراک طلایی ${p.plan_name}`,
        date: new Date().toISOString(),
        account: 'حساب چندبوم',
      });
    }
  };

  const rejectManualPayment = async (paymentId: string, adminNotes?: string) => {
    if (!isAdmin) return;
    let targetPayment: ManualPaymentSubmission | undefined;

    setManualPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          targetPayment = {
            ...p,
            status: 'rejected',
            admin_notes: adminNotes || 'اطلاعات واریزی مطابقت نداشت یا نامعتبر بود.',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.email,
          };
          return targetPayment;
        }
        return p;
      })
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('manual_payments')
          .update({
            status: 'rejected',
            admin_notes: adminNotes || 'اطلاعات واریزی مطابقت نداشت یا نامعتبر بود.',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.email,
          })
          .eq('id', paymentId);

        await supabase
          .from('subscription_orders')
          .update({
            status: 'rejected',
            reject_reason: adminNotes || 'عدم تطابق فیش',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
          })
          .eq('user_id', targetPayment?.user_id);
      } catch (err) {
        console.error('Supabase reject payment error:', err);
      }
    }

    if (targetPayment) {
      const p = targetPayment as ManualPaymentSubmission;
      if (user.id === p.user_id) {
        await updateUserProfile({
          subscription_status: 'none',
        });
      } else if (supabase) {
        await supabase
          .from('users')
          .update({
            subscription_status: 'none',
            updated_at: new Date().toISOString(),
          })
          .eq('id', p.user_id);
      }

      // Automatically forward rejection notification to user's ticket inbox
      const noteMsg = adminNotes?.trim() ? `\nتوضیح مدیریت: ${adminNotes}` : '';
      const forwardText = `❌ کاربر گرامی، فیش واریزی شما برای اشتراک «${p.plan_name}» تایید نگردید.${noteMsg}\nلطفاً در صورت نیاز مجدداً فیش معتبر ارسال فرمایید.`;
      await forwardAdminNotificationToTicket(
        p.user_id,
        p.user_name,
        p.user_email,
        'وضعیت درخواست اشتراک طلایی چندبوم',
        forwardText
      );
    }
  };

  // Transaction Actions
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user.id || 'guest',
      created_at: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert([
            {
              user_id: user.id,
              amount: tx.amount,
              category: tx.category,
              type: tx.type,
              date: tx.date || new Date().toISOString(),
              description: tx.description,
              account: tx.account || 'کارت اصلی',
              tags: tx.tags || [],
            },
          ])
          .select()
          .single();

        if (!error && data) {
          setTransactions((prev) => [data, ...prev.filter((t) => t.id !== newTx.id)]);
        }
      } catch (err) {
        console.error('Supabase insert transaction error:', err);
      }
    }
  };

  const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('transactions').update(updated).eq('id', id);
      } catch (err) {
        console.error('Supabase update transaction error:', err);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete transaction error:', err);
      }
    }
  };

  // Notification Actions
  const addNotification = async (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      user_id: user.id || 'guest',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newItem, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        await supabase.from('notifications').insert([newItem]);
      } catch (err) {
        console.error('Supabase notification insert error:', err);
      }
    }
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (err) {
        console.error('Supabase update notification error:', err);
      }
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      } catch (err) {
        console.error('Supabase mark all notifications error:', err);
      }
    }
  };

  const settleNotification = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'settled', is_read: true } : n))
    );
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('notifications').update({ status: 'settled', is_read: true }).eq('id', id);
      } catch (err) {
        console.error('Supabase settle notification error:', err);
      }
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('notifications').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete notification error:', err);
      }
    }
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // Support Ticket Actions
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
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: user.id || 'guest',
      sender_name: user.full_name || 'کاربر چندبوم',
      sender_role: 'user',
      content: initialMessage,
      created_at: new Date().toISOString(),
    };

    const newTicket: Ticket = {
      id: ticketId,
      user_id: user.id || 'guest',
      user_name: user.full_name || 'کاربر چندبوم',
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
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('tickets').insert([newTicket]);
      } catch (err) {
        console.error('Supabase create ticket error:', err);
      }
    }
  };

  const addTicketMessage = async (ticketId: string, content: string, asAdmin: boolean = false) => {
    const isActAsAdmin = asAdmin && isAdmin;
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: user.id || 'guest',
      sender_name: isActAsAdmin ? 'پشتیبان رسمی چندبوم' : user.full_name || 'کاربر چندبوم',
      sender_role: isActAsAdmin ? 'admin' : 'user',
      content,
      created_at: new Date().toISOString(),
    };

    let updatedList: Ticket[] = [];
    setTickets((prev) => {
      updatedList = prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: isActAsAdmin ? 'resolved' : 'in_progress',
            updated_at: new Date().toISOString(),
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      });
      return updatedList;
    });

    const target = updatedList.find((t) => t.id === ticketId);
    if (target) {
      setSelectedTicket(target);
      const supabase = getSupabaseClient();
      if (supabase && isAuthenticated) {
        try {
          await supabase
            .from('tickets')
            .update({
              status: target.status,
              updated_at: target.updated_at,
              messages: target.messages,
            })
            .eq('id', ticketId);
        } catch (err) {
          console.error('Supabase update ticket message error:', err);
        }
      }
    }
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    if (!isAdmin) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, updated_at: new Date().toISOString() } : t))
    );
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', ticketId);
      } catch (err) {
        console.error('Supabase update ticket status error:', err);
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

  // Real Supabase Authentication Methods
  const loginWithEmail = async (email: string, password?: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    if (!cleanEmail || !password) {
      return { success: false, error: 'لطفاً ایمیل و رمز عبور را وارد نمایید.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        return { success: false, error: translateSupabaseError(error.message) };
      }

      if (data?.user) {
        setIsAuthenticated(true);
        await fetchUserDataFromSupabase(data.user.id, cleanEmail);
        return { success: true };
      }

      return { success: false, error: 'اطلاعات ورود تایید نشد.' };
    } catch (err: any) {
      return { success: false, error: translateSupabaseError(err?.message) };
    }
  };

  const registerWithEmail = async (
    email: string,
    fullName: string,
    password?: string,
    avatarUrl?: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر'
  ): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    if (!cleanEmail || !password || !fullName.trim()) {
      return { success: false, error: 'لطفاً تمام فیلدهای الزامی را تکمیل نمایید.' };
    }

    try {
      const isAdm = isAdminEmail(cleanEmail);
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            age: age || null,
            gender: gender || null,
            avatar_url: avatarUrl || MALE_AVATAR_SVG,
          },
        },
      });

      if (error) {
        return { success: false, error: translateSupabaseError(error.message) };
      }

      if (data?.user) {
        // Upsert into Supabase public.users table with demographics for AI personalization
        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: cleanEmail,
            full_name: fullName.trim(),
            age: age || null,
            gender: gender || null,
            avatar_url: avatarUrl || MALE_AVATAR_SVG,
            role: isAdm ? 'admin' : 'user',
            tier: 'free',
            subscription_status: 'none',
            monthly_budget_cap: 20000000,
            theme_preference: isDarkMode ? 'dark' : 'light',
            currency: 'تومان',
          });
        } catch (dbErr) {
          console.warn('Could not insert profile row immediately into users table:', dbErr);
        }

        if (!data.session) {
          return { success: true, requiresEmailConfirmation: true };
        }

        setIsAuthenticated(true);
        await fetchUserDataFromSupabase(data.user.id, cleanEmail);
        return { success: true, requiresEmailConfirmation: false };
      }

      return { success: false, error: 'ثبت‌نام ناموفق بود.' };
    } catch (err: any) {
      return { success: false, error: translateSupabaseError(err?.message) };
    }
  };

  const login = async (email: string, password?: string) => {
    return loginWithEmail(email, password);
  };

  const register = async (
    email: string,
    arg2: string,
    arg3?: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر'
  ) => {
    // Gracefully handle either (email, password, fullName) or (email, fullName, password)
    let password = arg2;
    let fullName = arg3 || '';
    if (arg2.includes(' ') || (arg3 && arg3.length < arg2.length && !arg2.includes('@'))) {
      fullName = arg2;
      password = arg3 || '';
    } else if (!fullName) {
      fullName = email.split('@')[0];
    }
    return registerWithEmail(email, fullName, password, undefined, age, gender);
  };

  const requestSignupOtp = async (email: string) => {
    return await createUserOtp(email);
  };

  const verifySignupOtpAndRegister = async (
    email: string,
    code: string,
    password: string,
    fullName: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر'
  ): Promise<AuthResult> => {
    const verifyRes = await verifyUserOtp(email, code);
    if (!verifyRes.success) {
      return { success: false, error: verifyRes.error || 'کد تایید اشتباه است.' };
    }

    // Now complete registration in Supabase Auth & public.users
    const regRes = await registerWithEmail(email, fullName, password, undefined, age, gender);
    if (regRes.success) {
      await loginWithEmail(email, password);
    }
    return regRes;
  };

  // Financial Goals Handlers (اهداف مالی)
  const addGoal = async (goalData: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>) => {
    const newGoal: FinancialGoal = {
      ...goalData,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user.id || 'guest',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setGoals((prev) => [newGoal, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id && user.id !== 'guest') {
      try {
        await supabase.from('financial_goals').insert([{
          id: newGoal.id,
          user_id: user.id,
          title: newGoal.title,
          target_amount: newGoal.target_amount,
          current_amount: newGoal.current_amount,
          deadline: newGoal.deadline,
          category: newGoal.category,
          status: newGoal.status,
          notes: newGoal.notes,
        }]);
      } catch (err) {
        console.warn('Supabase add goal note:', err);
      }
    }
  };

  const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g))
    );
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase
          .from('financial_goals')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update goal note:', err);
      }
    }
  };

  const deleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('financial_goals').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete goal note:', err);
      }
    }
  };

  const contributeToGoal = async (id: string, amount: number) => {
    const target = goals.find((g) => g.id === id);
    if (!target) return;
    const newCurrent = target.current_amount + amount;
    const newStatus = newCurrent >= target.target_amount ? 'achieved' : target.status;
    await updateGoal(id, { current_amount: newCurrent, status: newStatus });

    // Immutably record in Supabase transactions history
    await addTransaction({
      amount,
      type: 'expense',
      category: 'سرمایه‌گذاری',
      description: `واریز پس‌انداز به هدف مالی «${target.title}»`,
      date: new Date().toISOString(),
      account: 'صندوق اهداف مالی',
    });

    await addNotification({
      type: 'system',
      title: 'واریز به هدف مالی ثبت شد',
      message: `مبلغ ${amount.toLocaleString('fa-IR')} تومان به هدف «${target.title}» افزوده شد.`,
      amount,
      priority: 'normal',
      status: 'pending',
    });
  };

  const loginAsRole = (role: UserRole) => {
    setUser((prev) => ({
      ...prev,
      role,
      tier: role === 'admin' ? 'vip' : 'pro',
    }));
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
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
    setUser(GUEST_USER);
    setAdminModeState(false);
    setAdmin2FAVerified(false);
    setActiveTab('dashboard');
  };

  const addReminder = async (rem: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => {
    const newRem: Reminder = {
      ...rem,
      id: `rem-${Date.now()}`,
      user_id: user.id || 'guest',
      created_at: new Date().toISOString(),
    };
    setReminders((prev) => [newRem, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .insert([
            {
              user_id: user.id,
              title: rem.title,
              amount: rem.amount,
              due_date: rem.due_date,
              category: rem.category,
              is_paid: rem.is_paid || false,
              recurrence: rem.recurrence || 'once',
            },
          ])
          .select()
          .single();

        if (!error && data) {
          setReminders((prev) => [data, ...prev.filter((r) => r.id !== newRem.id)]);
        }
      } catch (err) {
        console.error('Supabase insert reminder error:', err);
      }
    }
  };

  const updateReminder = async (id: string, updated: Partial<Reminder>) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('reminders').update(updated).eq('id', id);
      } catch (err) {
        console.error('Supabase update reminder error:', err);
      }
    }
  };

  const deleteReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('reminders').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete reminder error:', err);
      }
    }
  };

  const toggleReminderPaid = async (id: string) => {
    const current = reminders.find((r) => r.id === id);
    const newPaidStatus = current ? !current.is_paid : true;

    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, is_paid: newPaidStatus } : r)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('reminders').update({ is_paid: newPaidStatus }).eq('id', id);
      } catch (err) {
        console.error('Supabase toggle reminder error:', err);
      }
    }
  };

  const addTicket = async (
    subject: string,
    department: Ticket['department'],
    priority: Ticket['priority'],
    initialMessage: string
  ) => {
    await createTicket({ subject, department, priority, initialMessage });
  };

  // Financial Metrics & Calculations
  const totalIncome = useMemo(() => {
    return transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const netBalance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const monthlyBudgetCap = user.monthly_budget_cap || 20000000;

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

  const predictiveAlerts = useMemo(() => {
    return generatePredictiveBudgetAlerts(transactions, monthlyBudgetCap);
  }, [transactions, monthlyBudgetCap]);

  const metrics = useMemo(
    () => ({
      balance: netBalance,
      totalIncome,
      totalExpense,
      categoryBreakdown: expensesByCategory,
    }),
    [netBalance, totalIncome, totalExpense, expensesByCategory]
  );

  const budgetInsight = useMemo(() => {
    const now = new Date();
    const currentDay = Math.max(1, now.getDate());
    const dailyBurnRate = Math.round(totalExpense / currentDay);

    const topAlert = predictiveAlerts[0];
    if (topAlert) {
      return {
        message: topAlert.message,
        isWarning: topAlert.severity === 'warning' || topAlert.severity === 'critical',
        dailyBurnRate,
      };
    }
    return {
      message: 'مخارج ماهانه شما در سطح متعادل و تحت کنترل است.',
      isWarning: false,
      dailyBurnRate,
    };
  }, [predictiveAlerts, totalExpense]);

  const resetToInitialData = () => {
    setUser(INITIAL_USER);
    setTransactions(INITIAL_TRANSACTIONS);
    setReminders(INITIAL_REMINDERS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setTickets(INITIAL_TICKETS);
    setManualPayments(INITIAL_MANUAL_PAYMENTS);
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
        isAdmin2FAVerified: admin2FAVerified,
        verifyAdmin2FA,
        requestAdminOtp,
        logoutAdmin2FA,
        isDarkMode,
        toggleDarkMode,
        theme: isDarkMode ? 'dark' : 'light',
        toggleTheme: toggleDarkMode,
        isAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithEmail,
        registerWithEmail,
        login,
        register,
        requestSignupOtp,
        verifySignupOtpAndRegister,
        loginAsRole,
        logout,
        user,
        currentUser: user,
        updateUserProfile,
        isProUser,
        upgradeUserTier,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        isSubscriptionModalOpen,
        openSubscriptionModal,
        closeSubscriptionModal,
        isAuthGuardOpen,
        authGuardMessage,
        openAuthGuard,
        closeAuthGuard,
        requestSubscription,
        allUsers,
        updateUserRoleAndTier,
        manualPayments,
        submitManualPayment,
        approveManualPayment,
        rejectManualPayment,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        reminders,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleReminderPaid,
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
        addTicket,
        addTicketMessage,
        updateTicketStatus,
        totalIncome,
        totalExpense,
        netBalance,
        monthlyBudgetCap,
        budgetUtilizationPercent,
        expensesByCategory,
        predictiveAlerts,
        metrics,
        budgetInsight,
        isAIAssistantOpen,
        setIsAIAssistantOpen,
        resetToInitialData,
        resetToDefaults: resetToInitialData,
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
