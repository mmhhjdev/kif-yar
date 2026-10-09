/**
 * Complete PostgreSQL & Supabase DDL Schema for Chandboom (چندبوم)
 * Run this in Supabase SQL Editor if setting up a fresh cloud instance.
 */

export const SCHEMA_SQL = `
-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users & Subscription Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'کاربر چندبوم',
  age INT,
  gender TEXT CHECK (gender IN ('مرد', 'زن', 'سایر')),
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'vip')),
  subscription_status TEXT NOT NULL DEFAULT 'none' CHECK (subscription_status IN ('active', 'expired', 'pending_approval', 'none')),
  subscription_expires_at TIMESTAMPTZ,
  monthly_budget_cap NUMERIC NOT NULL DEFAULT 20000000,
  theme_preference TEXT NOT NULL DEFAULT 'dark',
  currency TEXT NOT NULL DEFAULT 'تومان',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  description TEXT NOT NULL,
  account TEXT DEFAULT 'کارت اصلی',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  recurrence TEXT NOT NULL DEFAULT 'once' CHECK (recurrence IN ('once', 'monthly', 'yearly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'payment_alert', 'budget_warning', 'subscription', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  amount NUMERIC,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'dismissed')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  department TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Manual Card-to-Card Payment Submissions
CREATE TABLE IF NOT EXISTS public.manual_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  card_sender_name TEXT NOT NULL,
  card_sender_number TEXT NOT NULL,
  reference_code TEXT NOT NULL,
  tracking_code TEXT NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  receipt_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT
);

-- 8. Dong & Expense Group Sharing
CREATE TABLE IF NOT EXISTS public.dong_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  is_family_mode BOOLEAN NOT NULL DEFAULT false,
  families JSONB DEFAULT '[]'::jsonb,
  members TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.dong_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.dong_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  payer TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  participants TEXT[] NOT NULL DEFAULT '{}',
  is_itemized BOOLEAN NOT NULL DEFAULT false,
  bill_items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. User Verification 6-Digit OTP Table
CREATE TABLE IF NOT EXISTS public.user_otps (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL CHECK (code ~ '^[0-9]{6}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0)
);

CREATE INDEX IF NOT EXISTS idx_user_otps_email_created ON public.user_otps(email, created_at DESC);

-- 10. Financial Goals Table (اهداف مالی)
CREATE TABLE IF NOT EXISTS public.financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  deadline TIMESTAMPTZ NOT NULL,
  category TEXT DEFAULT 'پس‌انداز و سرمایه‌گذاری',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'paused')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_financial_goals_user ON public.financial_goals(user_id, created_at DESC);

-- 11. Plans & Subscription Orders
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  name TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  price_toman BIGINT NOT NULL DEFAULT 0,
  duration_days INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.subscription_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  amount_toman BIGINT NOT NULL CHECK (amount_toman >= 0),
  receipt_path TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dong_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dong_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_orders ENABLE ROW LEVEL SECURITY;

-- User access policies
CREATE POLICY "Users view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Transactions user access" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Reminders user access" ON public.reminders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Notifications user access" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Tickets user access" ON public.tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Payments user access" ON public.manual_payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Goals user access" ON public.financial_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Plans public view" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Subscription orders user access" ON public.subscription_orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Enable insert/select for public OTP verification" ON public.user_otps FOR ALL USING (true) WITH CHECK (true);

-- 13. Smart Subscription Extension RPC
CREATE OR REPLACE FUNCTION public.sync_user_subscription(
  p_user_id UUID,
  p_tier TEXT,
  p_duration_days INT
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_current_expiry TIMESTAMPTZ;
  v_base_time TIMESTAMPTZ;
  v_new_expiry TIMESTAMPTZ;
BEGIN
  SELECT subscription_expires_at INTO v_current_expiry FROM public.users WHERE id = p_user_id;
  
  IF v_current_expiry IS NOT NULL AND v_current_expiry > now() THEN
    v_base_time := v_current_expiry;
  ELSE
    v_base_time := now();
  END IF;
  
  v_new_expiry := v_base_time + (p_duration_days || ' days')::INTERVAL;
  
  UPDATE public.users 
  SET 
    tier = p_tier,
    subscription_status = 'active',
    subscription_expires_at = v_new_expiry,
    updated_at = now()
  WHERE id = p_user_id;
  
  RETURN v_new_expiry;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;
