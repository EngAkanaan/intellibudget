import { supabase } from '../lib/supabase';
import type { MonthlyData, Expense, RecurringExpense, SavingsGoal, RecurringExpenseTemplate } from '../types';

// Helper to get current user ID
const getUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
};

// ============================================
// EXPENSES
// ============================================
export const expensesApi = {
  async getByMonth(month: string): Promise<Expense[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data.map(e => ({
      id: e.id,
      date: e.date,
      category: e.category,
      subcategory: e.subcategory,
      amount: parseFloat(e.amount),
      notes: e.notes || '',
      paymentMethod: e.payment_method,
      recurringId: e.recurring_id,
    }));
  },

  async create(expense: Omit<Expense, 'id'>, month: string): Promise<Expense> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        month,
        date: expense.date,
        category: expense.category,
        subcategory: expense.subcategory,
        amount: expense.amount,
        notes: expense.notes,
        payment_method: expense.paymentMethod,
        recurring_id: expense.recurringId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      date: data.date,
      category: data.category,
      subcategory: data.subcategory,
      amount: parseFloat(data.amount),
      notes: data.notes || '',
      paymentMethod: data.payment_method,
      recurringId: data.recurring_id,
    };
  },

  async update(id: string, updates: Partial<Expense>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        date: updates.date,
        category: updates.category,
        subcategory: updates.subcategory,
        amount: updates.amount,
        notes: updates.notes,
        payment_method: updates.paymentMethod,
        month: updates.date ? updates.date.substring(0, 7) : undefined,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      date: data.date,
      category: data.category,
      subcategory: data.subcategory,
      amount: parseFloat(data.amount),
      notes: data.notes || '',
      paymentMethod: data.payment_method,
      recurringId: data.recurring_id,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ============================================
// MONTHLY DATA
// ============================================
export const monthlyDataApi = {
  async getAll(): Promise<MonthlyData[]> {
    const userId = await getUserId();
    
    // Get all monthly data
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('monthly_data')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: true });
    
    if (monthlyError) throw monthlyError;

    // Get all expenses grouped by month
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (expensesError) throw expensesError;

    // Combine into MonthlyData format
    const expensesByMonth: { [key: string]: Expense[] } = {};
    expenses.forEach(e => {
      if (!expensesByMonth[e.month]) {
        expensesByMonth[e.month] = [];
      }
      expensesByMonth[e.month].push({
        id: e.id,
        date: e.date,
        category: e.category,
        subcategory: e.subcategory,
        amount: parseFloat(e.amount),
        notes: e.notes || '',
        paymentMethod: e.payment_method,
        recurringId: e.recurring_id,
      });
    });

    // Create MonthlyData array
    const result: MonthlyData[] = monthlyData.map(m => ({
      month: m.month,
      salary: parseFloat(m.salary),
      expenses: expensesByMonth[m.month] || [],
    }));

    // Add months that have expenses but no monthly_data entry
    Object.keys(expensesByMonth).forEach(month => {
      if (!monthlyData.find(m => m.month === month)) {
        result.push({
          month,
          salary: 0,
          expenses: expensesByMonth[month],
        });
      }
    });

    return result.sort((a, b) => a.month.localeCompare(b.month));
  },

  async updateSalary(month: string, salary: number): Promise<void> {
    const userId = await getUserId();
    
    // Try to update existing
    const { data: existing } = await supabase
      .from('monthly_data')
      .select('id')
      .eq('user_id', userId)
      .eq('month', month)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('monthly_data')
        .update({ salary })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      // Create new
      const { error } = await supabase
        .from('monthly_data')
        .insert({ user_id: userId, month, salary });
      if (error) throw error;
    }
  },
};

// ============================================
// CATEGORIES
// ============================================
export const categoriesApi = {
  async getAll(): Promise<{ name: string; color: string }[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('user_categories')
      .select('name, color')
      .eq('user_id', userId)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async create(name: string, color: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('user_categories')
      .insert({ user_id: userId, name, color });
    
    if (error) throw error;
  },

  async delete(name: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('user_categories')
      .delete()
      .eq('user_id', userId)
      .eq('name', name);
    
    if (error) throw error;
  },
};

// ============================================
// BUDGETS
// ============================================
export const budgetsApi = {
  async getAll(): Promise<{ [month: string]: { [category: string]: number } }> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('budgets')
      .select('month, category, amount')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const result: { [month: string]: { [category: string]: number } } = {};
    data.forEach(b => {
      if (!result[b.month]) result[b.month] = {};
      result[b.month][b.category] = parseFloat(b.amount);
    });
    
    return result;
  },

  async set(month: string, category: string, amount: number): Promise<void> {
    const userId = await getUserId();
    
    // Check if exists
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('category', category)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('budgets')
        .update({ amount })
        .eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('budgets')
        .insert({ user_id: userId, month, category, amount });
      if (error) throw error;
    }
  },
};

// ============================================
// PAYMENT METHODS
// ============================================
export const paymentMethodsApi = {
  async getAll(): Promise<{ name: string; color: string }[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('payment_methods')
      .select('name, color')
      .eq('user_id', userId)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async create(name: string, color: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('payment_methods')
      .insert({ user_id: userId, name, color });
    
    if (error) throw error;
  },

  async delete(name: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('user_id', userId)
      .eq('name', name);
    
    if (error) throw error;
  },
};

// ============================================
// RECURRING EXPENSES
// ============================================
export const recurringExpensesApi = {
  async getAll(): Promise<RecurringExpense[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(e => ({
      id: e.id,
      name: e.name,
      category: e.category,
      amount: parseFloat(e.amount),
      frequency: e.frequency as 'daily' | 'weekly' | 'monthly',
      startDate: e.start_date,
      endDate: e.end_date,
      notes: e.notes || '',
      paymentMethod: e.payment_method,
    }));
  },

  async create(expense: Omit<RecurringExpense, 'id'>): Promise<RecurringExpense> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert({
        user_id: userId,
        name: expense.name,
        category: expense.category,
        amount: expense.amount,
        frequency: expense.frequency,
        start_date: expense.startDate,
        end_date: expense.endDate,
        notes: expense.notes,
        payment_method: expense.paymentMethod,
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      amount: parseFloat(data.amount),
      frequency: data.frequency as 'daily' | 'weekly' | 'monthly',
      startDate: data.start_date,
      endDate: data.end_date,
      notes: data.notes || '',
      paymentMethod: data.payment_method,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ============================================
// RECURRING TEMPLATES
// ============================================
export const recurringTemplatesApi = {
  async getAll(): Promise<RecurringExpenseTemplate[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('recurring_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      amount: parseFloat(t.amount),
      frequency: t.frequency as 'daily' | 'weekly' | 'monthly',
      paymentMethod: t.payment_method,
      notes: t.notes || '',
    }));
  },

  async create(template: Omit<RecurringExpenseTemplate, 'id'>): Promise<RecurringExpenseTemplate> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('recurring_templates')
      .insert({
        user_id: userId,
        name: template.name,
        category: template.category,
        amount: template.amount,
        frequency: template.frequency,
        payment_method: template.paymentMethod,
        notes: template.notes,
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      category: data.category,
      amount: parseFloat(data.amount),
      frequency: data.frequency as 'daily' | 'weekly' | 'monthly',
      paymentMethod: data.payment_method,
      notes: data.notes || '',
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('recurring_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// ============================================
// SAVINGS GOALS
// ============================================
export const savingsGoalsApi = {
  async getAll(): Promise<SavingsGoal[]> {
    const userId = await getUserId();
    
    // Get goals
    const { data: goals, error: goalsError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (goalsError) throw goalsError;

    // Get contributions for all goals
    const goalIds = goals.map(g => g.id);
    const { data: contributions, error: contributionsError } = await supabase
      .from('savings_contributions')
      .select('*')
      .in('goal_id', goalIds)
      .order('date', { ascending: false });
    
    if (contributionsError) throw contributionsError;

    // Combine
    return goals.map(goal => ({
      id: goal.id,
      name: goal.name,
      targetAmount: parseFloat(goal.target_amount),
      currentAmount: parseFloat(goal.current_amount),
      targetDate: goal.target_date,
      category: goal.category,
      contributions: contributions
        .filter(c => c.goal_id === goal.id)
        .map(c => ({
          id: c.id,
          amount: parseFloat(c.amount),
          date: c.date,
          notes: c.notes || '',
        })),
    }));
  },

  async create(goal: Omit<SavingsGoal, 'id' | 'contributions'>): Promise<SavingsGoal> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: userId,
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount || 0,
        target_date: goal.targetDate,
        category: goal.category,
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      targetAmount: parseFloat(data.target_amount),
      currentAmount: parseFloat(data.current_amount),
      targetDate: data.target_date,
      category: data.category,
      contributions: [],
    };
  },

  async update(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const { data, error } = await supabase
      .from('savings_goals')
      .update({
        name: updates.name,
        target_amount: updates.targetAmount,
        current_amount: updates.currentAmount,
        target_date: updates.targetDate,
        category: updates.category,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      targetAmount: parseFloat(data.target_amount),
      currentAmount: parseFloat(data.current_amount),
      targetDate: data.target_date,
      category: data.category,
      contributions: [], // Will be loaded separately if needed
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async addContribution(goalId: string, contribution: { amount: number; date: string; notes?: string }): Promise<void> {
    const { error } = await supabase
      .from('savings_contributions')
      .insert({
        goal_id: goalId,
        amount: contribution.amount,
        date: contribution.date,
        notes: contribution.notes || '',
      });
    
    if (error) throw error;

    // Update goal's current amount
    const { data: goal } = await supabase
      .from('savings_goals')
      .select('current_amount')
      .eq('id', goalId)
      .single();

    if (goal) {
      const newAmount = parseFloat(goal.current_amount) + contribution.amount;
      await supabase
        .from('savings_goals')
        .update({ current_amount: newAmount })
        .eq('id', goalId);
    }
  },
};

