// User and Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Expense Categories
export type ExpenseCategory = 
  | 'food'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'health'
  | 'education'
  | 'other';

// Expenses
export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer';
  isRecurring: boolean;
  receiptUrl?: string;
  aiCategorized: boolean;
  aiConfidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFormData {
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'bank_transfer';
  isRecurring: boolean;
}

// OCR Receipt Processing
export interface ReceiptData {
  extractedText: string;
  suggestedAmount?: number;
  suggestedCategory?: ExpenseCategory;
  suggestedDescription?: string;
  suggestedDate?: string;
  confidence: number;
}

// Voice Processing
export interface VoiceData {
  transcript: string;
  parsedExpense?: Partial<ExpenseFormData>;
  confidence: number;
}

// Budget
export interface Budget {
  id: string;
  userId: string;
  category: ExpenseCategory;
  amount: number;
  month: string;
  year: number;
  spent: number;
  remaining: number;
}

export interface BudgetSuggestion {
  category: ExpenseCategory;
  suggestedAmount: number;
  currentSpending: number;
  percentChange: number;
  reason: string;
}

// Forecasting
export interface ForecastData {
  month: string;
  predictedAmount: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface SpendingInsight {
  type: 'warning' | 'tip' | 'achievement';
  title: string;
  description: string;
  category?: ExpenseCategory;
}

// Groups
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: string;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  balance: number;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  paidBy: string;
  amount: number;
  description: string;
  date: string;
  splitType: 'equal' | 'percentage' | 'custom';
  splits: ExpenseSplit[];
  receiptUrl?: string;
  createdAt: string;
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
  percentage?: number;
  isPaid: boolean;
}

// Bill Reminders
export interface BillReminder {
  id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: string;
  category: ExpenseCategory;
  isRecurring: boolean;
  recurrence?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  isPaid: boolean;
  notifyDaysBefore: number;
  createdAt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalBalance: number;
  balanceTrend: number;
  monthlySpending: number;
  monthlyBudget: number;
  topCategory: {
    name: ExpenseCategory;
    amount: number;
    percentage: number;
  };
  upcomingBills: number;
}

export interface SpendingByCategory {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  color: string;
}

export interface SpendingOverTime {
  date: string;
  amount: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
