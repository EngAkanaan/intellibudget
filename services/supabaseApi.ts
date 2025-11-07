import { supabase } from '../lib/supabase';
import type { MonthlyData, Expense, RecurringExpense, SavingsGoal, RecurringExpenseTemplate, IncomeSource } from '../types';

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

    // Get all income sources grouped by month
    const { data: incomeSources, error: incomeError } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    const incomeSourcesByMonth: { [key: string]: IncomeSource[] } = {};
    if (!incomeError && incomeSources) {
      incomeSources.forEach(i => {
        if (!incomeSourcesByMonth[i.month]) {
          incomeSourcesByMonth[i.month] = [];
        }
        incomeSourcesByMonth[i.month].push({
          id: i.id,
          description: i.description,
          amount: parseFloat(i.amount),
          date: i.date,
          sourceType: i.source_type,
          notes: i.notes || '',
          isRecurring: i.is_recurring || false,
          recurringDayOfMonth: i.recurring_day_of_month,
          recurringStartDate: i.recurring_start_date,
          recurringId: i.recurring_id,
        });
      });
    }

    // Create MonthlyData array
    const result: MonthlyData[] = monthlyData.map(m => ({
      month: m.month,
      salary: parseFloat(m.salary),
      expenses: expensesByMonth[m.month] || [],
      incomeSources: incomeSourcesByMonth[m.month] || [],
    }));

    // Add months that have expenses or income but no monthly_data entry
    const allMonths = new Set([
      ...Object.keys(expensesByMonth),
      ...Object.keys(incomeSourcesByMonth),
    ]);
    allMonths.forEach(month => {
      if (!monthlyData.find(m => m.month === month)) {
        result.push({
          month,
          salary: 0,
          expenses: expensesByMonth[month] || [],
          incomeSources: incomeSourcesByMonth[month] || [],
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
    
    // Check if exists (use maybeSingle() to avoid error if no record exists)
    const { data: existing, error: checkError } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('category', category)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking budget:', checkError);
      throw checkError;
    }

    if (existing) {
      // Update existing budget
      const { error } = await supabase
        .from('budgets')
        .update({ amount })
        .eq('id', existing.id);
      if (error) {
        console.error('Error updating budget:', error);
        throw error;
      }
    } else {
      // Insert new budget
      const { error } = await supabase
        .from('budgets')
        .insert({ user_id: userId, month, category, amount });
      if (error) {
        // If insert fails due to duplicate (race condition), try update instead
        if (error.code === '23505') { // PostgreSQL unique constraint violation
          const { data: existingAfterRace, error: retryError } = await supabase
            .from('budgets')
            .select('id')
            .eq('user_id', userId)
            .eq('month', month)
            .eq('category', category)
            .maybeSingle();
          
          if (retryError || !existingAfterRace) {
            console.error('Error retrying budget update:', retryError || 'No record found');
            throw error;
          }
          
          const { error: updateError } = await supabase
            .from('budgets')
            .update({ amount })
            .eq('id', existingAfterRace.id);
          
          if (updateError) {
            console.error('Error updating budget after race condition:', updateError);
            throw updateError;
          }
        } else {
          console.error('Error inserting budget:', error);
          throw error;
        }
      }
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
    return data.map(e => {
      // Map from database format to frontend format
      // Database has: name, frequency, start_date (may be YYYY-MM-DD)
      // Frontend expects: description, dayOfMonth, startDate (YYYY-MM)
      // Extract dayOfMonth from notes field where we store it
      let dayOfMonth = 1;
      if (e.notes && e.notes.includes('dayOfMonth:')) {
        const match = e.notes.match(/dayOfMonth:(\d+)/);
        if (match) dayOfMonth = parseInt(match[1], 10);
      }
      
      // Convert start_date from YYYY-MM-DD to YYYY-MM if needed
      let startDate = e.start_date;
      if (startDate && startDate.length === 10) {
        startDate = startDate.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD
      }
      
      return {
        id: e.id,
        description: e.name || '', // Map name to description
        category: e.category,
        amount: parseFloat(e.amount),
        dayOfMonth: dayOfMonth,
        startDate: startDate,
        paymentMethod: e.payment_method,
      };
    });
  },

  async create(expense: Omit<RecurringExpense, 'id'>): Promise<RecurringExpense> {
    const userId = await getUserId();
    
    // Map from frontend format to database format
    // Frontend sends: description, dayOfMonth, startDate (YYYY-MM)
    // Database expects: name, frequency, start_date (may need YYYY-MM-DD format)
    // Store dayOfMonth in notes field since database schema uses name/frequency
    const startDate = expense.startDate.length === 7 
      ? `${expense.startDate}-01` // Convert YYYY-MM to YYYY-MM-DD if needed
      : expense.startDate;
    
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert({
        user_id: userId,
        name: expense.description, // Map description to name
        category: expense.category,
        amount: expense.amount,
        frequency: 'monthly', // dayOfMonth implies monthly frequency
        start_date: startDate,
        end_date: null, // Not provided by frontend
        notes: `dayOfMonth:${expense.dayOfMonth}`, // Store dayOfMonth in notes
        payment_method: expense.paymentMethod,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating recurring expense:', error);
      throw error;
    }
    
    // Extract dayOfMonth from notes or use the value we sent
    let dayOfMonth = expense.dayOfMonth;
    if (data.notes && data.notes.includes('dayOfMonth:')) {
      const match = data.notes.match(/dayOfMonth:(\d+)/);
      if (match) dayOfMonth = parseInt(match[1], 10);
    }
    
    // Convert start_date from YYYY-MM-DD to YYYY-MM if needed
    let formattedStartDate = data.start_date;
    if (formattedStartDate && formattedStartDate.length === 10) {
      formattedStartDate = formattedStartDate.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD
    }
    
    return {
      id: data.id,
      description: data.name || '', // Map name back to description
      category: data.category,
      amount: parseFloat(data.amount),
      dayOfMonth: dayOfMonth,
      startDate: formattedStartDate,
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

// ============================================
// INCOME SOURCES
// ============================================
export const incomeSourcesApi = {
  async getByMonth(month: string): Promise<IncomeSource[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data.map(i => ({
      id: i.id,
      description: i.description,
      amount: parseFloat(i.amount),
      date: i.date,
      sourceType: i.source_type,
      notes: i.notes || '',
      isRecurring: i.is_recurring || false,
      recurringDayOfMonth: i.recurring_day_of_month,
      recurringStartDate: i.recurring_start_date,
      recurringId: i.recurring_id,
    }));
  },

  async create(income: Omit<IncomeSource, 'id'>, month: string): Promise<IncomeSource> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('income_sources')
      .insert({
        user_id: userId,
        month,
        description: income.description,
        amount: income.amount,
        date: income.date,
        source_type: income.sourceType,
        notes: income.notes || '',
        is_recurring: income.isRecurring || false,
        recurring_day_of_month: income.recurringDayOfMonth,
        recurring_start_date: income.recurringStartDate,
        recurring_id: income.recurringId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      description: data.description,
      amount: parseFloat(data.amount),
      date: data.date,
      sourceType: data.source_type,
      notes: data.notes || '',
      isRecurring: data.is_recurring || false,
      recurringDayOfMonth: data.recurring_day_of_month,
      recurringStartDate: data.recurring_start_date,
      recurringId: data.recurring_id,
    };
  },

  async update(id: string, updates: Partial<IncomeSource>): Promise<IncomeSource> {
    const { data, error } = await supabase
      .from('income_sources')
      .update({
        description: updates.description,
        amount: updates.amount,
        date: updates.date,
        source_type: updates.sourceType,
        notes: updates.notes,
        is_recurring: updates.isRecurring,
        recurring_day_of_month: updates.recurringDayOfMonth,
        recurring_start_date: updates.recurringStartDate,
        month: updates.date ? updates.date.substring(0, 7) : undefined,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      description: data.description,
      amount: parseFloat(data.amount),
      date: data.date,
      sourceType: data.source_type,
      notes: data.notes || '',
      isRecurring: data.is_recurring || false,
      recurringDayOfMonth: data.recurring_day_of_month,
      recurringStartDate: data.recurring_start_date,
      recurringId: data.recurring_id,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('income_sources')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

