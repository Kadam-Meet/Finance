import type {
  User,
  Expense,
  ExpenseFormData,
  ReceiptData,
  VoiceData,
  Budget,
  BudgetSuggestion,
  ForecastData,
  Group,
  GroupExpense,
  BillReminder,
  DashboardStats,
  SpendingByCategory,
  SpendingOverTime,
  ApiResponse,
  PaginatedResponse,
} from '@/types/models';

// Configure your Django backend URL here
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Auth token management
let authToken: string | null = localStorage.getItem('auth_token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

export const getAuthToken = () => authToken;

// HTTP client with auth headers
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setAuthToken(null);
    window.location.href = '/login';
  }

  return response;
};

const parseApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = (payload as Record<string, unknown> | null)?.detail;
    const error = (payload as Record<string, unknown> | null)?.error;
    return {
      success: false,
      error: (typeof detail === 'string' && detail) || (typeof error === 'string' && error) || `Request failed (${response.status})`,
    };
  }

  if (typeof payload === 'object' && payload !== null && 'success' in (payload as Record<string, unknown>)) {
    return payload as ApiResponse<T>;
  }

  return {
    success: true,
    data: payload as T,
  };
};

// ============================================
// AUTHENTICATION API
// ============================================

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const parsed = await parseApiResponse<{ access_token: string; token_type: string }>(response);
    if (!parsed.success || !parsed.data) {
      return { success: false, error: parsed.error || 'Login failed' };
    }

    setAuthToken(parsed.data.access_token);
    const profileResp = await fetchWithAuth('/auth/profile');
    const profile = await parseApiResponse<User>(profileResp);
    if (!profile.success || !profile.data) {
      return { success: false, error: profile.error || 'Failed to load profile' };
    }

    return {
      success: true,
      data: {
        token: parsed.data.access_token,
        user: profile.data,
      },
    };
  },

  register: async (name: string, email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response = await fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    const parsed = await parseApiResponse<{ message: string }>(response);
    if (!parsed.success) {
      return { success: false, error: parsed.error || 'Registration failed' };
    }

    return authApi.login(email, password);
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await fetchWithAuth('/auth/logout', { method: 'POST' });
    setAuthToken(null);
    return parseApiResponse<null>(response);
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await fetchWithAuth('/auth/profile');
    return parseApiResponse<User>(response);
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await fetchWithAuth('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return parseApiResponse<User>(response);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    return parseApiResponse<{ message: string }>(response);
  },

  logoutAll: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth('/auth/logout-all', { method: 'POST' });
    return parseApiResponse<{ message: string }>(response);
  },

  deleteAccount: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth('/auth/account', { method: 'DELETE' });
    return parseApiResponse<{ message: string }>(response);
  },

  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return parseApiResponse<{ message: string }>(response);
  },

  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    return parseApiResponse<{ message: string }>(response);
  },
};

// ============================================
// EXPENSES API
// ============================================

export const expenseApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    category?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Expense>>> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    const response = await fetchWithAuth(`/expenses/?${queryParams}`);
    const parsed = await parseApiResponse<Expense[] | PaginatedResponse<Expense>>(response);

    if (!parsed.success || !parsed.data) {
      return {
        success: false,
        error: parsed.error || 'Failed to fetch expenses',
      };
    }

    if (Array.isArray(parsed.data)) {
      return {
        success: true,
        data: {
          data: parsed.data,
          total: parsed.data.length,
          page: 1,
          limit: parsed.data.length,
          hasMore: false,
        },
      };
    }

    return parsed as ApiResponse<PaginatedResponse<Expense>>;
  },

  getById: async (id: string): Promise<ApiResponse<Expense>> => {
    const response = await fetchWithAuth(`/expenses/${id}`);
    return parseApiResponse<Expense>(response);
  },

  create: async (data: ExpenseFormData): Promise<ApiResponse<Expense>> => {
    const response = await fetchWithAuth('/expenses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseApiResponse<Expense>(response);
  },

  update: async (id: string, data: Partial<ExpenseFormData>): Promise<ApiResponse<Expense>> => {
    const response = await fetchWithAuth(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return parseApiResponse<Expense>(response);
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await fetchWithAuth(`/expenses/${id}`, { method: 'DELETE' });
    return parseApiResponse<null>(response);
  },

  // Export expenses as CSV
  export: async (startDate?: string, endDate?: string): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    const response = await fetchWithAuth(`/expenses/export?${queryParams}`);
    if (response.ok) {
      return response.blob();
    }

    // Fallback for backends that do not expose /expenses/export.
    if (response.status === 404) {
      const listResponse = await expenseApi.getAll();
      const rows = listResponse.success && listResponse.data ? listResponse.data.data : [];
      const csv = [
        'id,amount,category,description,date,paymentMethod',
        ...rows.map((row) => {
          const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
          return [
            escape(row.id),
            escape(row.amount),
            escape(row.category),
            escape(row.description),
            escape(row.date),
            escape(row.paymentMethod),
          ].join(',');
        }),
      ].join('\n');

      return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    }

    return response.blob();
  },
};

// ============================================
// AI FEATURES API
// ============================================

export const aiApi = {
  // OCR Receipt Processing
  processReceipt: async (imageFile: File): Promise<ApiResponse<ReceiptData>> => {
    const formData = new FormData();
    formData.append('file', imageFile);

    const runRequest = async (baseUrl: string) => {
      return fetch(`${baseUrl}/receipt/scan`, {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: formData,
      });
    };

    let response = await runRequest(API_BASE_URL);

    if (!response.ok && response.status === 404 && API_BASE_URL.endsWith('/api')) {
      response = await runRequest(API_BASE_URL.replace(/\/api$/, ''));
    }

    const payload = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: payload?.detail || payload?.error || 'Failed to process receipt',
      };
    }

    if (typeof payload?.success === 'boolean') {
      return payload;
    }

    return {
      success: true,
      data: payload as ReceiptData,
    };
  },

  // Voice Processing
  processVoice: async (transcript: string): Promise<ApiResponse<VoiceData>> => {
    const response = await fetchWithAuth('/voice/parse', {
      method: 'POST',
      body: JSON.stringify({ transcript }),
    });
    return parseApiResponse<VoiceData>(response);
  },

  // Get categorization for expense
  categorize: async (description: string, amount: number): Promise<ApiResponse<{
    category: string;
    confidence: number;
  }>> => {
    const lowered = description.toLowerCase();
    let category = 'other';

    if (/(food|restaurant|cafe|swiggy|zomato|grocery|dining)/.test(lowered)) {
      category = 'food';
    } else if (/(uber|ola|fuel|petrol|diesel|taxi|bus|metro)/.test(lowered)) {
      category = 'transport';
    } else if (/(amazon|flipkart|shopping|store|mall)/.test(lowered)) {
      category = 'shopping';
    } else if (/(movie|cinema|netflix|spotify|game)/.test(lowered)) {
      category = 'entertainment';
    } else if (/(rent|electricity|water|internet|bill|utility)/.test(lowered)) {
      category = 'bills';
    } else if (/(hospital|clinic|pharmacy|medical|doctor)/.test(lowered)) {
      category = 'health';
    } else if (/(school|college|course|tuition|book)/.test(lowered)) {
      category = 'education';
    }

    const confidence = Math.min(0.95, Math.max(0.6, amount > 0 ? 0.82 : 0.7));
    return {
      success: true,
      data: {
        category,
        confidence,
      },
    };
  },

  // Budget Suggestions
  getBudgetSuggestions: async (): Promise<ApiResponse<BudgetSuggestion[]>> => {
    const budgetResponse = await budgetApi.getAll();
    if (!budgetResponse.success || !budgetResponse.data) {
      return {
        success: false,
        error: budgetResponse.error || 'Failed to load budgets for suggestions',
      };
    }

    const suggestions: BudgetSuggestion[] = budgetResponse.data.map((budget) => ({
      category: budget.category as BudgetSuggestion['category'],
      suggestedAmount: Number((budget.amount * 0.95).toFixed(2)),
      currentSpending: 0,
      percentChange: -5,
      reason: `Consider reducing ${budget.category} budget by 5% to improve monthly savings.`,
    }));

    return {
      success: true,
      data: suggestions,
    };
  },

  // Spending Forecast
  getForecast: async (months?: number): Promise<ApiResponse<ForecastData[]>> => {
    const queryParams = months ? `?months=${months}` : '';
    const response = await fetchWithAuth(`/forecast/${queryParams}`);
    const parsed = await parseApiResponse<{
      forecast?: Array<{ month: string; predictedAmount: number; confidence: number }>;
    }>(response);

    if (!parsed.success || !parsed.data) {
      return {
        success: false,
        error: parsed.error || 'Failed to load spending forecast',
      };
    }

    const rows = (parsed.data.forecast || []).map((item) => ({
      month: item.month,
      predictedAmount: item.predictedAmount,
      lowerBound: Number((item.predictedAmount * 0.9).toFixed(2)),
      upperBound: Number((item.predictedAmount * 1.1).toFixed(2)),
      confidence: item.confidence,
    }));

    return {
      success: true,
      data: rows,
    };
  },
};

// ============================================
// GROUPS API
// ============================================

export const groupApi = {
  getAll: async (): Promise<ApiResponse<Group[]>> => {
    const response = await fetchWithAuth('/groups/');
    return parseApiResponse<Group[]>(response);
  },

  getById: async (id: string): Promise<ApiResponse<Group>> => {
    const response = await groupApi.getAll();
    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to load groups',
      };
    }

    const group = response.data.find((item) => String(item.id) === String(id));
    if (!group) {
      return {
        success: false,
        error: 'Group not found',
      };
    }

    return {
      success: true,
      data: group,
    };
  },

  create: async (data: { name: string; description?: string }): Promise<ApiResponse<Group>> => {
    const response = await fetchWithAuth('/groups/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseApiResponse<Group>(response);
  },

  deleteGroup: async (groupId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth(`/groups/${groupId}`, {
      method: 'DELETE',
    });
    return parseApiResponse<{ message: string }>(response);
  },

  addMember: async (groupId: string, email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return parseApiResponse<{ message: string }>(response);
  },

  getMembers: async (groupId: string): Promise<ApiResponse<Array<{ user_id: string; name: string; email: string }>>> => {
    const response = await fetchWithAuth(`/groups/${groupId}/members`);
    return parseApiResponse<Array<{ user_id: string; name: string; email: string }>>(response);
  },

  removeMember: async (groupId: string, userId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth(`/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
    return parseApiResponse<{ message: string }>(response);
  },

  getExpenses: async (groupId: string): Promise<ApiResponse<GroupExpense[]>> => {
    const response = await fetchWithAuth(`/groups/${groupId}/expenses`);
    return parseApiResponse<GroupExpense[]>(response);
  },

  addExpense: async (
    groupId: string,
    data: {
      description: string;
      amount: number;
      split_type?: 'equal' | 'custom';
      splits?: Array<{ user_id: string; amount: number }>;
    }
  ): Promise<ApiResponse<GroupExpense>> => {
    const response = await fetchWithAuth('/groups/expense', {
      method: 'POST',
      body: JSON.stringify({
        group_id: Number(groupId),
        description: data.description,
        amount: data.amount,
        split_type: data.split_type || 'equal',
        splits: data.splits || [],
      }),
    });
    return parseApiResponse<GroupExpense>(response);
  },

  deleteExpense: async (groupId: string, expenseId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth(`/groups/${groupId}/expenses/${expenseId}`, {
      method: 'DELETE',
    });
    return parseApiResponse<{ message: string }>(response);
  },

  getSettlements: async (groupId: string): Promise<ApiResponse<Array<{ id: number; group_id: number; from_user_id: string; to_user_id: string; from_user_name: string; to_user_name: string; amount: number; created_at: string }>>> => {
    const response = await fetchWithAuth(`/groups/${groupId}/settlements`);
    return parseApiResponse<Array<{ id: number; group_id: number; from_user_id: string; to_user_id: string; from_user_name: string; to_user_name: string; amount: number; created_at: string }>>(response);
  },

  createSettlement: async (groupId: string, data: { from_user_id: string; to_user_id: string; amount: number }): Promise<ApiResponse<{ id: number; group_id: number; from_user_id: string; to_user_id: string; from_user_name: string; to_user_name: string; amount: number; created_at: string }>> => {
    const response = await fetchWithAuth(`/groups/${groupId}/settlements`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseApiResponse<{ id: number; group_id: number; from_user_id: string; to_user_id: string; from_user_name: string; to_user_name: string; amount: number; created_at: string }>(response);
  },

  settleBalance: async (groupId: string, userId: string): Promise<ApiResponse<null>> => {
    return {
      success: false,
      error: `Settle balance endpoint is not available for group ${groupId} and user ${userId}. Use createSettlement instead.`,
    };
  },
};

// ============================================
// BILL REMINDERS API
// ============================================

export const reminderApi = {
  getAll: async (): Promise<ApiResponse<BillReminder[]>> => {
    const response = await fetchWithAuth('/reminders/');
    return parseApiResponse<BillReminder[]>(response);
  },

  create: async (data: { name: string; amount: number; dueDate: string }): Promise<ApiResponse<BillReminder>> => {
    const response = await fetchWithAuth('/reminders/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseApiResponse<BillReminder>(response);
  },

  update: async (id: string, data: Partial<BillReminder>): Promise<ApiResponse<BillReminder>> => {
    const response = await fetchWithAuth(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return parseApiResponse<BillReminder>(response);
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await fetchWithAuth(`/reminders/${id}`, { method: 'DELETE' });
    return parseApiResponse<null>(response);
  },

  markPaid: async (id: string): Promise<ApiResponse<BillReminder>> => {
    const response = await fetchWithAuth(`/reminders/${id}/paid`, { method: 'PUT' });
    return parseApiResponse<BillReminder>(response);
  },
};

export const budgetApi = {
  getAll: async (): Promise<ApiResponse<Array<{ id: string; category: string; amount: number; month: number; year: number }>>> => {
    const response = await fetchWithAuth('/budgets/');
    return parseApiResponse(response);
  },

  create: async (data: { category: string; amount: number; month: string | number; year: number }): Promise<ApiResponse<{ id: string; category: string; amount: number; month: number; year: number }>> => {
    const response = await fetchWithAuth('/budgets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseApiResponse(response);
  },

  delete: async (id: string | number): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth(`/budgets/${id}`, {
      method: 'DELETE',
    });
    return parseApiResponse(response);
  },
};

// ============================================
// DASHBOARD API
// ============================================

export const dashboardApi = {
  getStats: async (): Promise<ApiResponse<DashboardStats>> => {
    const [incomeResponse, expenseResponse, remindersResponse] = await Promise.all([
      incomeApi.getAll(),
      expenseApi.getAll(),
      reminderApi.getAll(),
    ]);

    if (!incomeResponse.success || !expenseResponse.success || !remindersResponse.success) {
      return {
        success: false,
        error:
          incomeResponse.error || expenseResponse.error || remindersResponse.error || 'Failed to compute dashboard stats',
      };
    }

    const incomes = incomeResponse.data || [];
    const expenses = expenseResponse.data?.data || [];
    const reminders = remindersResponse.data || [];

    const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const monthlyIncome = incomes.reduce<Record<string, number>>((acc, item) => {
      const date = new Date(item.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

    const monthlyExpense = expenses.reduce<Record<string, number>>((acc, item) => {
      const date = new Date(item.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

    const monthKeys = Array.from(new Set([...Object.keys(monthlyIncome), ...Object.keys(monthlyExpense)])).sort();
    const latestKey = monthKeys[monthKeys.length - 1];
    const previousKey = monthKeys[monthKeys.length - 2];
    const latestBalance = latestKey ? (monthlyIncome[latestKey] || 0) - (monthlyExpense[latestKey] || 0) : 0;
    const previousBalance = previousKey ? (monthlyIncome[previousKey] || 0) - (monthlyExpense[previousKey] || 0) : 0;
    const balanceTrend =
      previousBalance !== 0
        ? Number((((latestBalance - previousBalance) / Math.abs(previousBalance)) * 100).toFixed(2))
        : 0;

    const categoryTotals = expenses.reduce<Record<string, number>>((acc, item) => {
      const key = item.category || 'other';
      acc[key] = (acc[key] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

    const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['other', 0];
    const monthlyBudget = totalSpent > 0 ? totalSpent * 1.1 : 0;

    return {
      success: true,
      data: {
        totalBalance: Number((totalIncome - totalSpent).toFixed(2)),
        balanceTrend,
        monthlySpending: Number(totalSpent.toFixed(2)),
        monthlyBudget: Number(monthlyBudget.toFixed(2)),
        topCategory: {
          name: topCategoryEntry[0] as DashboardStats['topCategory']['name'],
          amount: Number(topCategoryEntry[1].toFixed(2)),
          percentage: totalSpent > 0 ? Number(((topCategoryEntry[1] / totalSpent) * 100).toFixed(2)) : 0,
        },
        upcomingBills: reminders.filter((item) => !item.isPaid).length,
      },
    };
  },

  getSpendingByCategory: async (month?: string): Promise<ApiResponse<SpendingByCategory[]>> => {
    const expenseResponse = await expenseApi.getAll();
    if (!expenseResponse.success || !expenseResponse.data) {
      return {
        success: false,
        error: expenseResponse.error || 'Failed to compute spending by category',
      };
    }

    const rows = expenseResponse.data.data;
    const normalizedMonth = month?.toLowerCase();
    const filtered = normalizedMonth
      ? rows.filter((item) => new Date(item.date).toLocaleString('en-US', { month: 'long' }).toLowerCase() === normalizedMonth)
      : rows;

    const totals = filtered.reduce<Record<string, number>>((acc, item) => {
      const key = item.category || 'other';
      acc[key] = (acc[key] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

    const totalAmount = Object.values(totals).reduce((sum, value) => sum + value, 0);

    return {
      success: true,
      data: Object.entries(totals).map(([category, amount]) => ({
        category: category as SpendingByCategory['category'],
        amount: Number(amount.toFixed(2)),
        percentage: totalAmount > 0 ? Number(((amount / totalAmount) * 100).toFixed(2)) : 0,
        color: '',
      })),
    };
  },

  getSpendingOverTime: async (period: 'week' | 'month' | 'year' = 'month'): Promise<ApiResponse<SpendingOverTime[]>> => {
    const expenseResponse = await expenseApi.getAll();
    if (!expenseResponse.success || !expenseResponse.data) {
      return {
        success: false,
        error: expenseResponse.error || 'Failed to compute spending over time',
      };
    }

    const formatters: Record<typeof period, (date: Date) => string> = {
      week: (date) => `${date.getFullYear()}-W${Math.ceil((date.getDate() + 6 - date.getDay()) / 7)}`,
      month: (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      year: (date) => `${date.getFullYear()}`,
    };

    const grouped = expenseResponse.data.data.reduce<Record<string, number>>((acc, item) => {
      const key = formatters[period](new Date(item.date));
      acc[key] = (acc[key] || 0) + Number(item.amount || 0);
      return acc;
    }, {});

    return {
      success: true,
      data: Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({
          date,
          amount: Number(amount.toFixed(2)),
        })),
    };
  },

  getRecentExpenses: async (limit: number = 10): Promise<ApiResponse<Expense[]>> => {
    const expenseResponse = await expenseApi.getAll();
    if (!expenseResponse.success || !expenseResponse.data) {
      return {
        success: false,
        error: expenseResponse.error || 'Failed to load recent expenses',
      };
    }

    const recent = [...expenseResponse.data.data]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    return {
      success: true,
      data: recent,
    };
  },
};

export const investmentApi = {
  getAll: async (): Promise<ApiResponse<Array<{
    id: string;
    user_id?: string;
    stock_name: string;
    investment_type?: string;
    buy_price: number;
    sell_price: number | null;
    quantity: number;
    buy_date?: string;
    sell_date?: string | null;
    tax_slab: number;
    status?: string | null;
    created_at?: string;
    updated_at?: string;
  }>>> => {
    const response = await fetchWithAuth('/investments/');
    return parseApiResponse(response);
  },

  create: async (data: {
    stockName: string;
    investmentType?: string;
    buyPrice: number;
    sellPrice?: number | null;
    quantity: number;
    taxSlab: number;
    buyDate?: string;
    sellDate?: string | null;
    status?: string | null;
  }): Promise<ApiResponse<{
    id: string;
    user_id?: string;
    stock_name: string;
    investment_type?: string;
    buy_price: number;
    sell_price: number | null;
    quantity: number;
    buy_date?: string;
    sell_date?: string | null;
    tax_slab: number;
    status?: string | null;
    created_at?: string;
    updated_at?: string;
  }>> => {
    const response = await fetchWithAuth('/investments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseApiResponse(response);
  },

  update: async (id: string, data: {
    stockName: string;
    investmentType?: string;
    buyPrice: number;
    sellPrice?: number | null;
    quantity: number;
    taxSlab: number;
    buyDate?: string;
    sellDate?: string | null;
    status?: string | null;
  }): Promise<ApiResponse<{
    id: string;
    user_id?: string;
    stock_name: string;
    investment_type?: string;
    buy_price: number;
    sell_price: number | null;
    quantity: number;
    buy_date?: string;
    sell_date?: string | null;
    tax_slab: number;
    status?: string | null;
    created_at?: string;
    updated_at?: string;
  }>> => {
    const response = await fetchWithAuth(`/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return parseApiResponse(response);
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth(`/investments/${id}`, {
      method: 'DELETE',
    });
    return parseApiResponse(response);
  },

  analyze: async (data: {
    stockName: string;
    investmentType?: string;
    buyPrice: number;
    sellPrice?: number | null;
    quantity: number;
    taxSlab: number;
    buyDate?: string;
    sellDate?: string | null;
    status?: string | null;
  }): Promise<ApiResponse<{
    investment: {
      id: string;
      stock_name: string;
      investment_type?: string;
      buy_price: number;
      sell_price: number | null;
      quantity: number;
      buy_date?: string;
      sell_date?: string | null;
      tax_slab: number;
      status?: string | null;
      created_at?: string;
      updated_at?: string;
    };
    result: {
      profit: number;
      tax: number;
      netProfit: number;
      aiInsight: string;
    };
  }>> => {
    const response = await fetchWithAuth('/investments/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseApiResponse(response);
  },
};

export const forecastApi = {
  getSummary: async (): Promise<ApiResponse<{
    chartData: Array<{ month: string; income: number; expense: number }>;
    forecast: Array<{ month: string; predictedAmount: number; confidence: number }>;
    insights: Array<{ type: string; title: string; description: string; category?: string }>;
  }>> => {
    const response = await fetchWithAuth('/forecast/');
    return parseApiResponse(response);
  },
};

export const incomeApi = {
  getAll: async (): Promise<ApiResponse<Array<{ id: string; amount: number; source: string; description: string; date: string }>>> => {
    const response = await fetchWithAuth('/income/');
    return parseApiResponse(response);
  },

  create: async (data: { amount: number; source: string; description: string; date: string }): Promise<ApiResponse<{ id: string; amount: number; source: string; description: string; date: string }>> => {
    const response = await fetchWithAuth('/income/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseApiResponse(response);
  },

  update: async (id: string, data: { amount: number; source: string; description: string; date: string }): Promise<ApiResponse<{ id: string; amount: number; source: string; description: string; date: string }>> => {
    const response = await fetchWithAuth(`/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return parseApiResponse(response);
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await fetchWithAuth(`/income/${id}`, {
      method: 'DELETE',
    });
    return parseApiResponse(response);
  },
};

export const settingsApi = {
  get: async (): Promise<ApiResponse<{
    avatar_url?: string | null;
    default_currency: string;
    date_format: string;
    theme: string;
    email_notifications: boolean;
    push_notifications: boolean;
    bill_reminders: boolean;
    weekly_report: boolean;
    budget_alerts: boolean;
  }>> => {
    const response = await fetchWithAuth('/settings/');
    return parseApiResponse(response);
  },

  update: async (data: Partial<{
    avatar_url: string | null;
    default_currency: string;
    date_format: string;
    theme: string;
    email_notifications: boolean;
    push_notifications: boolean;
    bill_reminders: boolean;
    weekly_report: boolean;
    budget_alerts: boolean;
  }>): Promise<ApiResponse<{
    avatar_url?: string | null;
    default_currency: string;
    date_format: string;
    theme: string;
    email_notifications: boolean;
    push_notifications: boolean;
    bill_reminders: boolean;
    weekly_report: boolean;
    budget_alerts: boolean;
  }>> => {
    const response = await fetchWithAuth('/settings/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return parseApiResponse(response);
  },
};
