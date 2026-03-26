
-- ============================================
-- EXPENSE CATEGORIES TABLE
-- ============================================
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories" ON public.expense_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own categories" ON public.expense_categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON public.expense_categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON public.expense_categories FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  is_recurring BOOLEAN DEFAULT false,
  receipt_url TEXT,
  ai_categorized BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RECEIPT UPLOADS TABLE
-- ============================================
CREATE TABLE public.receipt_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  extracted_text TEXT,
  ai_parsed_data JSONB,
  confidence DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.receipt_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own receipts" ON public.receipt_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own receipts" ON public.receipt_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own receipts" ON public.receipt_uploads FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- INCOME TABLE
-- ============================================
CREATE TABLE public.income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own income" ON public.income FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own income" ON public.income FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own income" ON public.income FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own income" ON public.income FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_income_updated_at BEFORE UPDATE ON public.income FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AI LOGS TABLE
-- ============================================
CREATE TABLE public.ai_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  model_used TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI logs" ON public.ai_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own AI logs" ON public.ai_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- BUDGETS TABLE
-- ============================================
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, month, year)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- EXPENSE FORECASTS TABLE
-- ============================================
CREATE TABLE public.expense_forecasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  predicted_amount DECIMAL(12,2) NOT NULL,
  lower_bound DECIMAL(12,2),
  upper_bound DECIMAL(12,2),
  confidence DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own forecasts" ON public.expense_forecasts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own forecasts" ON public.expense_forecasts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own forecasts" ON public.expense_forecasts FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- GROUPS TABLE
-- ============================================
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- GROUP MEMBERS TABLE
-- ============================================
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  balance DECIMAL(12,2) DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- RLS for groups (users can see groups they are members of)
CREATE POLICY "Users can view groups they belong to" ON public.groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid())
);
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group creators can update groups" ON public.groups FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Group creators can delete groups" ON public.groups FOR DELETE USING (auth.uid() = created_by);

-- RLS for group members
CREATE POLICY "Users can view members of their groups" ON public.group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid())
);
CREATE POLICY "Group creators can add members" ON public.group_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
);
CREATE POLICY "Group creators can remove members" ON public.group_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND created_by = auth.uid())
);

-- ============================================
-- GROUP EXPENSES TABLE
-- ============================================
CREATE TABLE public.group_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  paid_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  split_type TEXT DEFAULT 'equal',
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses of their groups" ON public.group_expenses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_expenses.group_id AND user_id = auth.uid())
);
CREATE POLICY "Group members can add expenses" ON public.group_expenses FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_expenses.group_id AND user_id = auth.uid())
);
CREATE POLICY "Expense creators can update" ON public.group_expenses FOR UPDATE USING (auth.uid() = paid_by);
CREATE POLICY "Expense creators can delete" ON public.group_expenses FOR DELETE USING (auth.uid() = paid_by);

-- ============================================
-- GROUP EXPENSE SPLITS TABLE
-- ============================================
CREATE TABLE public.group_expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES public.group_expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2),
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(expense_id, user_id)
);

ALTER TABLE public.group_expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their splits" ON public.group_expense_splits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their split status" ON public.group_expense_splits FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- BILL REMINDERS TABLE
-- ============================================
CREATE TABLE public.bill_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_date DATE NOT NULL,
  category TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence TEXT,
  is_paid BOOLEAN DEFAULT false,
  notify_days_before INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bill_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders" ON public.bill_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reminders" ON public.bill_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON public.bill_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reminders" ON public.bill_reminders FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_bill_reminders_updated_at BEFORE UPDATE ON public.bill_reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- NOTIFICATION LOGS TABLE
-- ============================================
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_id UUID REFERENCES public.bill_reminders(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notification_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notification_logs FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- INVESTMENTS TABLE
-- ============================================
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stock_name TEXT NOT NULL,
  buy_price DECIMAL(12,2) NOT NULL,
  quantity INTEGER NOT NULL,
  sell_price DECIMAL(12,2),
  buy_date DATE NOT NULL,
  sell_date DATE,
  tax_slab DECIMAL(5,2) NOT NULL,
  status TEXT DEFAULT 'holding',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own investments" ON public.investments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INVESTMENT ANALYSIS TABLE
-- ============================================
CREATE TABLE public.investment_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_investment DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) NOT NULL,
  profit DECIMAL(12,2) NOT NULL,
  return_percentage DECIMAL(8,2) NOT NULL,
  tax_type TEXT NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL,
  net_profit DECIMAL(12,2) NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.investment_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis" ON public.investment_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own analysis" ON public.investment_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INVESTMENT AI INSIGHTS TABLE
-- ============================================
CREATE TABLE public.investment_ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type TEXT NOT NULL,
  insight_text TEXT NOT NULL,
  confidence DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.investment_ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights" ON public.investment_ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own insights" ON public.investment_ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  default_currency TEXT DEFAULT 'INR',
  fiscal_year_start INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
