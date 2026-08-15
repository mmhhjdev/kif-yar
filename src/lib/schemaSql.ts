/**
 * Supabase PostgreSQL DDL Schema with Row Level Security (RLS)
 * Designed for Kefyar (کیفیار)
 * Strictly omits any phone number field.
 */

export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- سامانه مدیریت مالی «کیفیار» (kifyar Database Schema)
-- ساختار جداول PostgreSQL، توابع خودکار و سیاست‌های امنیتی (RLS) در Supabase
-- ==========================================================

-- فعال‌سازی افزونه uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. جدول کاربران (پروفایل کاربری بدون فیلد شماره تلفن)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    monthly_budget_cap NUMERIC DEFAULT 25000000, -- سقف بودجه به تومان
    currency TEXT DEFAULT 'تومان',
    theme_preference TEXT DEFAULT 'dark',
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول تراکنش‌های مالی (Transactions)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    account TEXT DEFAULT 'کارت اصلی',
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول مرکزی تیکت‌های پشتیبانی (Tickets)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'عمومی',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول پیام‌های گفتگوی تیکت (Ticket Messages)
CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول هشدارها و یادآورهای هوشمند مالی (Notifications & Alarms)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('budget_alert', 'debt_reminder', 'check_due', 'bill_reminder', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    amount NUMERIC,
    due_date DATE,
    person_name TEXT, -- طرف حساب برای دنگ و طلب/بدهی
    is_read BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'dismissed')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- فعال‌سازی Row Level Security (RLS) برای تمامی جداول
-- ==========================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- حذف سیاست‌های قبلی در صورت وجود مجدد
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users or Admins can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view messages of their tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can post messages to their tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can manage own notifications" ON public.notifications;

-- سیاست‌های جدول کاربران (Users RLS)
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- سیاست‌های تراکنش‌ها (Transactions RLS)
CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

-- سیاست‌های تیکت‌ها (Tickets RLS)
CREATE POLICY "Users can view own tickets" ON public.tickets
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert own tickets" ON public.tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users or Admins can update tickets" ON public.tickets
    FOR UPDATE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- سیاست‌های پیام‌های تیکت (Ticket Messages RLS)
CREATE POLICY "Users can view messages of their tickets" ON public.ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_messages.ticket_id
            AND (tickets.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
        )
    );

CREATE POLICY "Users can post messages to their tickets" ON public.ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE tickets.id = ticket_messages.ticket_id
            AND (tickets.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
        )
    );

-- سیاست‌های اعلان‌ها و یادآورها (Notifications RLS)
CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ==========================================================
-- تریگر خودکار ساخت پروفایل هنگام ثبت‌نام کاربر در Supabase Auth
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, monthly_budget_cap, currency, theme_preference, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
        25000000,
        'تومان',
        'dark',
        'user'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- اتصال تریگر به جدول auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ایندکس‌ها برای حداکثر سرعت کوئری‌ها
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_user_status ON public.tickets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
`;
