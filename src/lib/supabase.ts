import { createClient } from '@supabase/supabase-js';
import { Transaction, UserProfile, DongGroup, CategoryBudget, SupportTicket, TicketStatus } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_PROFILE, INITIAL_DONGS, INITIAL_CATEGORY_BUDGETS, INITIAL_TICKETS } from '../data/initialData';

// Read Supabase credentials from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create Supabase client instance
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// In-memory fallback database store if Supabase credentials are not yet configured
let memoryTransactions: Transaction[] = [...INITIAL_TRANSACTIONS];
let memoryProfile: UserProfile = { ...INITIAL_PROFILE };
let memoryDongs: DongGroup[] = [...INITIAL_DONGS];
let memoryBudgets: CategoryBudget[] = [...INITIAL_CATEGORY_BUDGETS];
let memoryTickets: SupportTicket[] = [...INITIAL_TICKETS];

/* =========================================================================
   TRANSACTIONS DATABASE OPERATIONS
   ========================================================================= */

export async function fetchTransactionsFromDB(): Promise<Transaction[]> {
  if (!isSupabaseConfigured) {
    return memoryTransactions;
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase fetchTransactions error, using memory state:', error.message);
      return memoryTransactions;
    }

    if (!data || data.length === 0) {
      // Seed initial transactions if table is empty
      await seedInitialTransactions();
      return memoryTransactions;
    }

    return data.map((item) => ({
      id: item.id,
      title: item.title,
      amount: Number(item.amount),
      type: item.type,
      category: item.category,
      date: item.date,
      notes: item.notes || undefined,
      merchant: item.merchant || undefined,
    }));
  } catch (err) {
    console.error('Error fetching transactions from Supabase:', err);
    return memoryTransactions;
  }
}

export async function saveTransactionToDB(txData: Omit<Transaction, 'id'> & { id?: string }): Promise<Transaction> {
  const id = txData.id || `tx-${Date.now()}`;
  const fullTx: Transaction = { ...txData, id };

  if (!isSupabaseConfigured) {
    if (txData.id) {
      memoryTransactions = memoryTransactions.map((t) => (t.id === txData.id ? fullTx : t));
    } else {
      memoryTransactions = [fullTx, ...memoryTransactions];
    }
    return fullTx;
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .upsert({
        id: fullTx.id,
        title: fullTx.title,
        amount: fullTx.amount,
        type: fullTx.type,
        category: fullTx.category,
        date: fullTx.date,
        notes: fullTx.notes || null,
        merchant: fullTx.merchant || null,
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase upsert transaction error:', error.message);
      // Fallback to memory
      if (txData.id) {
        memoryTransactions = memoryTransactions.map((t) => (t.id === txData.id ? fullTx : t));
      } else {
        memoryTransactions = [fullTx, ...memoryTransactions];
      }
      return fullTx;
    }

    return {
      id: data.id,
      title: data.title,
      amount: Number(data.amount),
      type: data.type,
      category: data.category,
      date: data.date,
      notes: data.notes || undefined,
      merchant: data.merchant || undefined,
    };
  } catch (err) {
    console.error('Error saving transaction to Supabase:', err);
    return fullTx;
  }
}

export async function deleteTransactionFromDB(id: string): Promise<boolean> {
  memoryTransactions = memoryTransactions.filter((t) => t.id !== id);

  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete transaction error:', error.message);
    }
    return true;
  } catch (err) {
    console.error('Error deleting transaction from Supabase:', err);
    return false;
  }
}

/* =========================================================================
   USER PROFILE DATABASE OPERATIONS
   ========================================================================= */

export async function fetchProfileFromDB(): Promise<UserProfile> {
  if (!isSupabaseConfigured) return memoryProfile;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return memoryProfile;
    }

    return {
      name: data.name || memoryProfile.name,
      email: data.email || memoryProfile.email,
      avatarUrl: data.avatar_url || memoryProfile.avatarUrl,
      monthlyGoal: Number(data.monthly_goal) || memoryProfile.monthlyGoal,
      currentBalance: Number(data.current_balance) || memoryProfile.currentBalance,
      membershipTier: data.membership_tier || memoryProfile.membershipTier,
      currency: data.currency || memoryProfile.currency,
    };
  } catch (err) {
    console.error('Error fetching profile from Supabase:', err);
    return memoryProfile;
  }
}

export async function updateProfileInDB(updated: Partial<UserProfile>): Promise<UserProfile> {
  memoryProfile = { ...memoryProfile, ...updated };

  if (!isSupabaseConfigured) return memoryProfile;

  try {
    const { error } = await supabase.from('profiles').upsert({
      id: 'default-profile',
      name: memoryProfile.name,
      email: memoryProfile.email,
      avatar_url: memoryProfile.avatarUrl,
      monthly_goal: memoryProfile.monthlyGoal,
      current_balance: memoryProfile.currentBalance,
      membership_tier: memoryProfile.membershipTier,
      currency: memoryProfile.currency,
    });

    if (error) {
      console.warn('Supabase update profile error:', error.message);
    }
  } catch (err) {
    console.error('Error updating profile in Supabase:', err);
  }

  return memoryProfile;
}

/* =========================================================================
   DONGS DATABASE OPERATIONS
   ========================================================================= */

export async function fetchDongsFromDB(): Promise<DongGroup[]> {
  if (!isSupabaseConfigured) return memoryDongs;

  try {
    const { data, error } = await supabase.from('dongs').select('*').order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return memoryDongs;
    }

    return data.map((d) => ({
      id: d.id,
      title: d.title,
      totalAmount: Number(d.total_amount),
      payerName: d.payer_name,
      date: d.date,
      category: d.category,
      members: typeof d.members === 'string' ? JSON.parse(d.members) : d.members,
      notes: d.notes || undefined,
    }));
  } catch (err) {
    console.error('Error fetching dongs from Supabase:', err);
    return memoryDongs;
  }
}

export async function saveDongToDB(dong: DongGroup): Promise<DongGroup> {
  memoryDongs = [dong, ...memoryDongs.filter((d) => d.id !== dong.id)];

  if (!isSupabaseConfigured) return dong;

  try {
    const { error } = await supabase.from('dongs').upsert({
      id: dong.id,
      title: dong.title,
      total_amount: dong.totalAmount,
      payer_name: dong.payerName,
      date: dong.date,
      category: dong.category,
      members: JSON.stringify(dong.members),
      notes: dong.notes || null,
    });

    if (error) {
      console.warn('Supabase save dong error:', error.message);
    }
  } catch (err) {
    console.error('Error saving dong to Supabase:', err);
  }

  return dong;
}

export async function deleteDongFromDB(id: string): Promise<boolean> {
  memoryDongs = memoryDongs.filter((d) => d.id !== id);

  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.from('dongs').delete().eq('id', id);
    if (error) console.warn('Supabase delete dong error:', error.message);
    return true;
  } catch (err) {
    console.error('Error deleting dong from Supabase:', err);
    return false;
  }
}

/* =========================================================================
   BUDGETS DATABASE OPERATIONS
   ========================================================================= */

export async function fetchBudgetsFromDB(): Promise<CategoryBudget[]> {
  if (!isSupabaseConfigured) return memoryBudgets;

  try {
    const { data, error } = await supabase.from('category_budgets').select('*');

    if (error || !data || data.length === 0) {
      return memoryBudgets;
    }

    return data.map((b) => ({
      categoryId: b.category_id,
      monthlyLimit: Number(b.monthly_limit),
    }));
  } catch (err) {
    console.error('Error fetching budgets from Supabase:', err);
    return memoryBudgets;
  }
}

export async function updateBudgetInDB(categoryId: string, monthlyLimit: number): Promise<CategoryBudget[]> {
  const exists = memoryBudgets.find((b) => b.categoryId === categoryId);
  if (exists) {
    memoryBudgets = memoryBudgets.map((b) => (b.categoryId === categoryId ? { ...b, monthlyLimit } : b));
  } else {
    memoryBudgets = [...memoryBudgets, { categoryId: categoryId as any, monthlyLimit }];
  }

  if (!isSupabaseConfigured) return memoryBudgets;

  try {
    const { error } = await supabase.from('category_budgets').upsert({
      category_id: categoryId,
      monthly_limit: monthlyLimit,
    });

    if (error) console.warn('Supabase update budget error:', error.message);
  } catch (err) {
    console.error('Error updating budget in Supabase:', err);
  }

  return memoryBudgets;
}

/* Helper to seed initial data */
async function seedInitialTransactions() {
  if (!isSupabaseConfigured) return;
  try {
    const dbPayload = INITIAL_TRANSACTIONS.map((tx) => ({
      id: tx.id,
      title: tx.title,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
      notes: tx.notes || null,
      merchant: tx.merchant || null,
    }));
    await supabase.from('transactions').upsert(dbPayload);
  } catch (e) {
    console.warn('Seeding failed:', e);
  }
}

/* =========================================================================
   GOOGLE OAUTH AUTHENTICATION
   ========================================================================= */

export async function signInWithGoogle(): Promise<{ error?: string; url?: string }> {
  if (!isSupabaseConfigured) {
    return {
      error: 'اتصال دیتابیس Supabase هنوز پیکربندی نشده است. لطفاً متغیرهای محیطی VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY را در داشبورد Netlify تنظیم فرمایید.'
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { error: error.message };
    }
    return { url: data?.url };
  } catch (err: any) {
    return { error: err?.message || 'خطای ناشناخته در اتصال به گوگل' };
  }
}

export async function signOutUser() {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign out error:', err);
  }
}

/* =========================================================================
   SUPPORT TICKETS DATABASE OPERATIONS
   ========================================================================= */

export async function fetchSupportTicketsFromDB(): Promise<SupportTicket[]> {
  if (!isSupabaseConfigured) {
    return memoryTickets;
  }

  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchSupportTickets error, using memory fallback:', error.message);
      return memoryTickets;
    }

    if (!data || data.length === 0) {
      return memoryTickets;
    }

    return data.map((item) => ({
      id: String(item.id),
      user_id: item.user_id || 'anonymous_user',
      user_email: item.user_email || 'user@walletyar.ir',
      user_name: item.user_name || undefined,
      subject: item.subject || 'بدون موضوع',
      message: item.message || '',
      status: (item.status as TicketStatus) || 'open',
      priority: item.priority || 'medium',
      category: item.category || 'پشتیبانی عمومی',
      created_at: item.created_at || new Date().toISOString(),
      admin_reply: item.admin_reply || undefined,
      updated_at: item.updated_at || undefined,
    }));
  } catch (err) {
    console.error('Error fetching support tickets from Supabase:', err);
    return memoryTickets;
  }
}

export async function submitSupportTicketToDB(ticketData: {
  user_id?: string;
  user_email: string;
  user_name?: string;
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
}): Promise<{ ticket: SupportTicket; error?: string }> {
  const newTicket: SupportTicket = {
    id: `ticket-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: ticketData.user_id || 'anonymous_user',
    user_email: ticketData.user_email.trim(),
    user_name: ticketData.user_name?.trim() || undefined,
    subject: ticketData.subject.trim(),
    message: ticketData.message.trim(),
    status: 'open',
    priority: ticketData.priority || 'medium',
    category: ticketData.category || 'پشتیبانی عمومی',
    created_at: new Date().toISOString(),
  };

  // Always update memory state for instant responsive UI
  memoryTickets = [newTicket, ...memoryTickets];

  if (!isSupabaseConfigured) {
    return { ticket: newTicket };
  }

  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert([
        {
          user_id: newTicket.user_id,
          user_email: newTicket.user_email,
          user_name: newTicket.user_name || null,
          subject: newTicket.subject,
          message: newTicket.message,
          status: 'open',
          priority: newTicket.priority,
          category: newTicket.category,
          created_at: newTicket.created_at,
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase insert ticket error (falling back to memory):', error.message);
      // Return success with local ticket so UX is not blocked even if RLS/table needs initial setup
      return { ticket: newTicket, error: error.message };
    }

    if (data) {
      const persistedTicket: SupportTicket = {
        id: String(data.id),
        user_id: data.user_id || newTicket.user_id,
        user_email: data.user_email || newTicket.user_email,
        user_name: data.user_name || newTicket.user_name,
        subject: data.subject || newTicket.subject,
        message: data.message || newTicket.message,
        status: (data.status as TicketStatus) || 'open',
        priority: data.priority || newTicket.priority,
        category: data.category || newTicket.category,
        created_at: data.created_at || newTicket.created_at,
      };
      memoryTickets = memoryTickets.map((t) => (t.id === newTicket.id ? persistedTicket : t));
      return { ticket: persistedTicket };
    }

    return { ticket: newTicket };
  } catch (err: any) {
    console.error('Error submitting support ticket:', err);
    return { ticket: newTicket, error: err?.message };
  }
}

export async function updateTicketStatusInDB(
  ticketId: string,
  newStatus: TicketStatus,
  adminReply?: string
): Promise<SupportTicket[]> {
  const now = new Date().toISOString();
  
  memoryTickets = memoryTickets.map((t) =>
    t.id === ticketId
      ? {
          ...t,
          status: newStatus,
          admin_reply: adminReply !== undefined ? adminReply : t.admin_reply,
          updated_at: now,
        }
      : t
  );

  if (!isSupabaseConfigured) {
    return memoryTickets;
  }

  try {
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updated_at: now,
    };
    if (adminReply !== undefined) {
      updatePayload.admin_reply = adminReply;
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', ticketId);

    if (error) {
      console.warn('Supabase update ticket status error:', error.message);
    }
  } catch (err) {
    console.error('Error updating ticket status in Supabase:', err);
  }

  return memoryTickets;
}

export async function deleteTicketFromDB(ticketId: string): Promise<boolean> {
  memoryTickets = memoryTickets.filter((t) => t.id !== ticketId);

  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.from('support_tickets').delete().eq('id', ticketId);
    if (error) console.warn('Supabase delete ticket error:', error.message);
    return true;
  } catch (err) {
    console.error('Error deleting ticket from Supabase:', err);
    return false;
  }
}
