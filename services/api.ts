const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to make authenticated API requests
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid, clear it
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response;
};

// Auth API
export const authAPI = {
  async register(email: string, password: string, name?: string) {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async login(email: string, password: string) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  async getCurrentUser() {
    const response = await apiRequest('/auth/me');
    return response.json();
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  isAuthenticated(): boolean {
    return !!getAuthToken();
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Data API
export const dataAPI = {
  // Monthly Data
  async getMonthlyData() {
    const response = await apiRequest('/data/monthly-data');
    const data = await response.json();
    return data.data;
  },

  async getMonthlyDataByMonth(month: string) {
    const response = await apiRequest(`/data/monthly-data/${month}`);
    return response.json();
  },

  async updateSalary(month: string, salary: number) {
    const response = await apiRequest(`/data/monthly-data/${month}/salary`, {
      method: 'PUT',
      body: JSON.stringify({ salary }),
    });
    return response.json();
  },

  // Expenses
  async addExpense(month: string, expense: any) {
    const response = await apiRequest('/data/expenses', {
      method: 'POST',
      body: JSON.stringify({ month, expense }),
    });
    return response.json();
  },

  async updateExpense(id: string, expense: any) {
    const response = await apiRequest(`/data/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
    return response.json();
  },

  async deleteExpense(id: string) {
    const response = await apiRequest(`/data/expenses/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Categories
  async getCategories() {
    const response = await apiRequest('/data/categories');
    return response.json();
  },

  async addCategory(name: string, color: string) {
    const response = await apiRequest('/data/categories', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
    return response.json();
  },

  async deleteCategory(name: string) {
    const response = await apiRequest(`/data/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Budgets
  async getBudgets() {
    const response = await apiRequest('/data/budgets');
    return response.json();
  },

  async setBudget(month: string, category: string, amount: number) {
    const response = await apiRequest('/data/budgets', {
      method: 'POST',
      body: JSON.stringify({ month, category, amount }),
    });
    return response.json();
  },

  // Payment Methods
  async getPaymentMethods() {
    const response = await apiRequest('/data/payment-methods');
    return response.json();
  },

  async addPaymentMethod(name: string, color: string) {
    const response = await apiRequest('/data/payment-methods', {
      method: 'POST',
      body: JSON.stringify({ name, color }),
    });
    return response.json();
  },

  async deletePaymentMethod(name: string) {
    const response = await apiRequest(`/data/payment-methods/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Recurring Expenses
  async getRecurringExpenses() {
    const response = await apiRequest('/data/recurring-expenses');
    return response.json();
  },

  async addRecurringExpense(expense: any) {
    const response = await apiRequest('/data/recurring-expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
    return response.json();
  },

  async deleteRecurringExpense(id: string) {
    const response = await apiRequest(`/data/recurring-expenses/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Recurring Templates
  async getRecurringTemplates() {
    const response = await apiRequest('/data/recurring-templates');
    return response.json();
  },

  async addRecurringTemplate(template: any) {
    const response = await apiRequest('/data/recurring-templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
    return response.json();
  },

  async deleteRecurringTemplate(id: string) {
    const response = await apiRequest(`/data/recurring-templates/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Savings Goals
  async getSavingsGoals() {
    const response = await apiRequest('/data/savings-goals');
    return response.json();
  },

  async addSavingsGoal(goal: any) {
    const response = await apiRequest('/data/savings-goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    return response.json();
  },

  async updateSavingsGoal(id: string, goal: any) {
    const response = await apiRequest(`/data/savings-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    });
    return response.json();
  },

  async deleteSavingsGoal(id: string) {
    const response = await apiRequest(`/data/savings-goals/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async addSavingsContribution(goalId: string, contribution: any) {
    const response = await apiRequest(`/data/savings-goals/${goalId}/contributions`, {
      method: 'POST',
      body: JSON.stringify(contribution),
    });
    return response.json();
  },
};

