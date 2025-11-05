import React, { useState, useEffect, lazy, Suspense } from 'react';
import { initialData } from './services/mockData';
import type { MonthlyData, Expense, RecurringExpense, SavingsGoal, RecurringExpenseTemplate } from './types';
import ErrorBoundary from './components/shared/ErrorBoundary';
import LoadingSpinner from './components/shared/LoadingSpinner';
import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import { supabase } from './lib/supabase';
import { 
  monthlyDataApi, 
  expensesApi, 
  categoriesApi, 
  budgetsApi, 
  paymentMethodsApi, 
  recurringExpensesApi, 
  recurringTemplatesApi,
  savingsGoalsApi 
} from './services/supabaseApi';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const MonthlyView = lazy(() => import('./components/MonthlyView'));
const YearlyView = lazy(() => import('./components/YearlyView'));
const BudgetsView = lazy(() => import('./components/BudgetsView'));
const RecurringView = lazy(() => import('./components/RecurringView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const SavingsGoalsView = lazy(() => import('./components/SavingsGoalsView'));
const HelpView = lazy(() => import('./components/HelpView'));
import { LayoutDashboard, Calendar, BarChart3, Wallet, Menu, X, Settings, Repeat, Target, HelpCircle, LogOut } from 'lucide-react';
import { INITIAL_CATEGORIES, INITIAL_CATEGORY_COLORS, PALETTE_COLORS, INITIAL_PAYMENT_METHODS, INITIAL_PAYMENT_METHOD_COLORS } from './constants';
import { exportToCSV, exportToJSON, generateBackup, validateImportData, type ExportData } from './utils/dataExport';

type View = 'dashboard' | 'monthly' | 'yearly' | 'budgets' | 'recurring' | 'settings' | 'savings' | 'help';

const App: React.FC = () => {
  const { user, loading: authLoading, signOut } = useAuth();

  // --- State Initialization (Default values - will load from Supabase when user logs in) ---
  // IMPORTANT: All hooks must be called before any conditional returns
  const [data, setData] = useState<MonthlyData[]>(initialData);
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [categoryColors, setCategoryColors] = useState<{[key: string]: string}>(INITIAL_CATEGORY_COLORS);
  const [budgets, setBudgets] = useState<{ [month: string]: { [category: string]: number } }>({});
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(INITIAL_PAYMENT_METHODS);
  const [paymentMethodColors, setPaymentMethodColors] = useState<{[key: string]: string}>(INITIAL_PAYMENT_METHOD_COLORS);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringExpenseTemplate[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- ALL EFFECTS MUST BE BEFORE CONDITIONAL RETURNS ---
  // --- Effect to Load Data from Supabase when user logs in ---
  useEffect(() => {
    if (!user || dataLoading || dataLoaded) return;
    
    const loadData = async () => {
      setDataLoading(true);
      try {
        console.log('📥 Loading data from Supabase...');
        
        // Load all data in parallel
        const [monthlyData, categoriesData, budgetsData, recurringData, paymentMethodsData, templatesData, goalsData] = await Promise.all([
          monthlyDataApi.getAll().catch(() => initialData),
          categoriesApi.getAll().catch(() => []),
          budgetsApi.getAll().catch(() => ({})),
          recurringExpensesApi.getAll().catch(() => []),
          paymentMethodsApi.getAll().catch(() => []),
          recurringTemplatesApi.getAll().catch(() => []),
          savingsGoalsApi.getAll().catch(() => []),
        ]);
        
        // Set monthly data
        setData(monthlyData.length > 0 ? monthlyData : initialData);
        
        // Set categories and colors
        if (categoriesData.length > 0) {
          const cats = categoriesData.map(c => c.name);
          const colors: {[key: string]: string} = {};
          categoriesData.forEach(c => { colors[c.name] = c.color; });
          setCategories(cats);
          setCategoryColors(colors);
        }
        
        // Set budgets
        setBudgets(budgetsData);
        
        // Set recurring expenses
        setRecurringExpenses(recurringData);
        
        // Set payment methods and colors
        if (paymentMethodsData.length > 0) {
          const methods = paymentMethodsData.map(m => m.name);
          const colors: {[key: string]: string} = {};
          paymentMethodsData.forEach(m => { colors[m.name] = m.color; });
          setPaymentMethods(methods);
          setPaymentMethodColors(colors);
        }
        
        // Set templates
        setRecurringTemplates(templatesData);
        
        // Set savings goals
        setSavingsGoals(goalsData);
        
        console.log('✅ Data loaded from Supabase');
        setDataLoaded(true); // Mark data as loaded to prevent re-loading
      } catch (error) {
        console.error('❌ Error loading data from Supabase:', error);
      } finally {
        setDataLoading(false);
      }
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only reload when user ID changes (new login), not on every render
  
  // Reset dataLoaded when user logs out
  useEffect(() => {
    if (!user) {
      setDataLoaded(false);
      // Reset to initial state when logged out
      setData(initialData);
      setCategories(INITIAL_CATEGORIES);
      setCategoryColors(INITIAL_CATEGORY_COLORS);
      setBudgets({});
      setRecurringExpenses([]);
      setPaymentMethods(INITIAL_PAYMENT_METHODS);
      setPaymentMethodColors(INITIAL_PAYMENT_METHOD_COLORS);
      setSavingsGoals([]);
      setRecurringTemplates([]);
    }
  }, [user]);
  
  // --- Effect to automatically process recurring expenses ---
  useEffect(() => {
    // Only process if user is authenticated
    if (!user) return;
    
    let needsUpdate = false;
    // Create a deep copy to modify
    const newData = JSON.parse(JSON.stringify(data));

    newData.forEach((monthData: MonthlyData) => {
      recurringExpenses.forEach(recurring => {
        const expenseExists = monthData.expenses.some(exp => exp.recurringId === recurring.id);
        
        // Only add if it doesn't exist and the month is on or after the start date
        if (!expenseExists && monthData.month >= recurring.startDate) {
          const year = parseInt(monthData.month.split('-')[0]);
          const month = parseInt(monthData.month.split('-')[1]);
          const daysInMonth = new Date(year, month, 0).getDate();
          
          if (recurring.dayOfMonth <= daysInMonth) {
            const day = String(recurring.dayOfMonth).padStart(2, '0');
            const newExpense: Expense = {
              id: `${recurring.id}-${monthData.month}`,
              recurringId: recurring.id,
              date: `${monthData.month}-${day}`,
              category: recurring.category,
              amount: recurring.amount,
              notes: recurring.description,
            };
            monthData.expenses.push(newExpense);
            needsUpdate = true;
          }
        }
      });
    });

    if (needsUpdate) {
      setData(newData);
    }
  }, [user, recurringExpenses, data]);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Logout button component for sidebar
  const LogoutButton = () => (
    <button
      onClick={async () => {
        try {
          await signOut();
          // Redirect will happen automatically via AuthContext
        } catch (error) {
          // Errors are handled silently in signOut, just reload if needed
          window.location.reload();
        }
      }}
      className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <LogOut size={18} className="flex-shrink-0" />
      <span>Sign Out</span>
    </button>
  );

  // Show loading spinner only on initial auth check or first data load
  if (authLoading || (user && dataLoading && !dataLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show Auth component if not authenticated
  if (!user) {
    return <Auth />;
  }

  const addExpense = async (month: string, expense: Omit<Expense, 'id'>) => {
    try {
      const newExpense = await expensesApi.create(expense, month);
      setData(prevData => {
        return prevData.map(monthlyData => {
          if (monthlyData.month === month) {
            return {
              ...monthlyData,
              expenses: [...monthlyData.expenses, newExpense],
            };
          }
          return monthlyData;
        });
      });
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };
  
  const updateExpense = async (month: string, updatedExpense: Expense) => {
    try {
      // Check if expense exists in Supabase
      const { data: existingExpense, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('id', updatedExpense.id)
        .single();
      
      if (checkError || !existingExpense) {
        // Expense doesn't exist in Supabase - recreate it
        console.warn('Expense ID not found in Supabase, recreating:', updatedExpense.id);
        const newExpense = await expensesApi.create({
          date: updatedExpense.date,
          category: updatedExpense.category,
          subcategory: updatedExpense.subcategory,
          amount: updatedExpense.amount,
          notes: updatedExpense.notes,
          paymentMethod: updatedExpense.paymentMethod,
          recurringId: updatedExpense.recurringId,
        }, month);
        
        // Update local state with new expense
        setData(prevData =>
          prevData.map(monthlyData => {
            if (monthlyData.month === month) {
              return {
                ...monthlyData,
                expenses: monthlyData.expenses.map(exp => 
                  exp.id === updatedExpense.id ? newExpense : exp
                ),
              };
            }
            return monthlyData;
          })
        );
      } else {
        // Expense exists, update it
        await expensesApi.update(updatedExpense.id, updatedExpense);
        setData(prevData =>
          prevData.map(monthlyData => {
            if (monthlyData.month === month) {
              return {
                ...monthlyData,
                expenses: monthlyData.expenses.map(exp => (exp.id === updatedExpense.id ? updatedExpense : exp)),
              };
            }
            return monthlyData;
          })
        );
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Failed to update expense. Please try again.');
    }
  };

  const deleteExpense = async (month: string, expenseId: string) => {
    try {
      // Check if expense exists in Supabase
      const { data: existingExpense, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('id', expenseId)
        .single();
      
      if (checkError || !existingExpense) {
        // Expense doesn't exist in Supabase - just remove from local state
        console.warn('Expense ID not found in Supabase, removing from local state:', expenseId);
        setData(prevData =>
          prevData.map(monthlyData => {
            if (monthlyData.month === month) {
              return {
                ...monthlyData,
                expenses: monthlyData.expenses.filter(exp => exp.id !== expenseId),
              };
            }
            return monthlyData;
          })
        );
      } else {
        // Expense exists, delete it
        await expensesApi.delete(expenseId);
        setData(prevData =>
          prevData.map(monthlyData => {
            if (monthlyData.month === month) {
              return {
                ...monthlyData,
                expenses: monthlyData.expenses.filter(exp => exp.id !== expenseId),
              };
            }
            return monthlyData;
          })
        );
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const updateSalary = async (month: string, newSalary: number) => {
    try {
      await monthlyDataApi.updateSalary(month, newSalary);
      setData(prevData =>
        prevData.map(monthlyData =>
          monthlyData.month === month ? { ...monthlyData, salary: newSalary } : monthlyData
        )
      );
    } catch (error) {
      console.error('Error updating salary:', error);
      alert('Failed to update salary. Please try again.');
    }
  };


  const addCategory = async (newCategory: string) => {
    if (newCategory && !categories.includes(newCategory)) {
      try {
        const newColor = PALETTE_COLORS[categories.length % PALETTE_COLORS.length];
        await categoriesApi.create(newCategory, newColor);
        setCategories(prev => [...prev, newCategory]);
        setCategoryColors(prev => ({...prev, [newCategory]: newColor}));
      } catch (error) {
        console.error('Error adding category:', error);
        alert('Failed to add category. Please try again.');
      }
    }
  };

  const deleteCategory = async (categoryToDelete: string) => {
    try {
      await categoriesApi.delete(categoryToDelete);
      
      // Update expenses to use 'Other' category
      setData(prevData => prevData.map(monthData => ({
        ...monthData,
        expenses: monthData.expenses.map(expense =>
          expense.category === categoryToDelete ? { ...expense, category: 'Other' } : expense
        )
      })));
    
      // Remove from budgets
      setBudgets(prevBudgets => {
        const nextBudgets = { ...prevBudgets };
        Object.keys(nextBudgets).forEach(month => {
          if (nextBudgets[month][categoryToDelete] !== undefined) {
            const { [categoryToDelete]: _, ...remainingCategories } = nextBudgets[month];
            nextBudgets[month] = remainingCategories;
          }
        });
        return nextBudgets;
      });
    
      setCategories(prev => prev.filter(cat => cat !== categoryToDelete));
      setCategoryColors(prev => {
        const { [categoryToDelete]: _, ...newColors } = prev;
        return newColors;
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category. Please try again.');
    }
  };

  const addPaymentMethod = async (newMethod: string) => {
    if (newMethod && !paymentMethods.includes(newMethod)) {
      try {
        const newColor = PALETTE_COLORS[paymentMethods.length % PALETTE_COLORS.length];
        await paymentMethodsApi.create(newMethod, newColor);
        setPaymentMethods(prev => [...prev, newMethod]);
        setPaymentMethodColors(prev => ({...prev, [newMethod]: newColor}));
      } catch (error) {
        console.error('Error adding payment method:', error);
        alert('Failed to add payment method. Please try again.');
      }
    }
  };

  const deletePaymentMethod = async (methodToDelete: string) => {
    try {
      await paymentMethodsApi.delete(methodToDelete);
      
      // Update expenses to remove payment method
      setData(prevData => prevData.map(monthData => ({
        ...monthData,
        expenses: monthData.expenses.map(expense =>
          expense.paymentMethod === methodToDelete ? { ...expense, paymentMethod: undefined } : expense
        )
      })));
  
      setPaymentMethods(prev => prev.filter(method => method !== methodToDelete));
      setPaymentMethodColors(prev => {
        const { [methodToDelete]: _, ...newColors } = prev;
        return newColors;
      });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      alert('Failed to delete payment method. Please try again.');
    }
  };

  // Data Management Functions
  const handleExport = () => {
    exportToCSV(data);
  };

  const handleBackup = (): string => {
    const backupData: ExportData = {
      data,
      categories,
      categoryColors,
      budgets,
      recurringExpenses,
      paymentMethods,
      paymentMethodColors,
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    return generateBackup(backupData);
  };

  const handleRestore = async (backup: string) => {
    try {
      let importData: any;
      try {
        importData = JSON.parse(backup);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please check your backup file.');
      }
      
      if (!validateImportData(importData)) {
        throw new Error('Invalid backup format. Please ensure your backup file is from IntelliBudget.');
      }
      
      // Handle old backup formats - ensure required fields exist
      if (!importData.data || !Array.isArray(importData.data)) {
        throw new Error('Backup file is missing required data. Please ensure it\'s a valid IntelliBudget backup.');
      }
      
      if (window.confirm('This will replace all your current data. Are you sure?')) {
        // Show loading
        setDataLoading(true);
        
        try {
          // Get current user ID
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');
          const userId = user.id;
          
          // Clear existing data from Supabase first (using user_id for RLS)
          // Delete all expenses
          await supabase.from('expenses').delete().eq('user_id', userId);
          
          // Delete all monthly data
          await supabase.from('monthly_data').delete().eq('user_id', userId);
          
          // Delete all categories
          await supabase.from('user_categories').delete().eq('user_id', userId);
          
          // Delete all budgets
          await supabase.from('budgets').delete().eq('user_id', userId);
          
          // Delete all recurring expenses
          await supabase.from('recurring_expenses').delete().eq('user_id', userId);
          
          // Delete all payment methods
          await supabase.from('payment_methods').delete().eq('user_id', userId);
          
          // Delete all templates
          await supabase.from('recurring_templates').delete().eq('user_id', userId);
          
          // Delete all savings goals (contributions will be deleted via foreign key cascade)
          await supabase.from('savings_goals').delete().eq('user_id', userId);
          
          // Now restore categories (handle old format where categories might be an object)
          let categoriesToRestore: string[] = INITIAL_CATEGORIES;
          let categoryColorsToRestore: { [key: string]: string } = INITIAL_CATEGORY_COLORS;
          
          if (Array.isArray(importData.categories)) {
            categoriesToRestore = importData.categories;
          } else if (importData.categories && typeof importData.categories === 'object') {
            // Old format might have categories as object keys
            categoriesToRestore = Object.keys(importData.categories);
          }
          
          if (importData.categoryColors && typeof importData.categoryColors === 'object') {
            categoryColorsToRestore = importData.categoryColors;
          }
          for (const category of categoriesToRestore) {
            await categoriesApi.create(category, categoryColorsToRestore[category] || '#3b82f6');
          }
          
          // Restore payment methods
          const paymentMethodsToRestore = importData.paymentMethods || INITIAL_PAYMENT_METHODS;
          const paymentMethodColorsToRestore = importData.paymentMethodColors || INITIAL_PAYMENT_METHOD_COLORS;
          for (const method of paymentMethodsToRestore) {
            await paymentMethodsApi.create(method, paymentMethodColorsToRestore[method] || '#3b82f6');
          }
          
          // Restore monthly data and expenses
          const dataToRestore = importData.data || initialData;
          for (const monthlyData of dataToRestore) {
            // Update salary
            await monthlyDataApi.updateSalary(monthlyData.month, monthlyData.salary);
            
            // Add expenses (this will create new IDs in Supabase)
            for (const expense of monthlyData.expenses) {
              await expensesApi.create({
                date: expense.date,
                category: expense.category,
                subcategory: expense.subcategory,
                amount: expense.amount,
                notes: expense.notes,
                paymentMethod: expense.paymentMethod,
                recurringId: expense.recurringId,
              }, monthlyData.month);
            }
          }
          
          // Restore budgets
          const budgetsToRestore = importData.budgets || {};
          for (const [month, categories] of Object.entries(budgetsToRestore)) {
            for (const [category, amount] of Object.entries(categories)) {
              await budgetsApi.set(month, category, amount);
            }
          }
          
          // Restore recurring expenses
          const recurringToRestore = importData.recurringExpenses || [];
          for (const recurring of recurringToRestore) {
            await recurringExpensesApi.create({
              name: recurring.name,
              category: recurring.category,
              amount: recurring.amount,
              frequency: recurring.frequency,
              startDate: recurring.startDate,
              endDate: recurring.endDate,
              notes: recurring.notes,
              paymentMethod: recurring.paymentMethod,
            });
          }
          
          // Restore templates
          const templatesToRestore = importData.recurringTemplates || [];
          for (const template of templatesToRestore) {
            await recurringTemplatesApi.create({
              name: template.name,
              category: template.category,
              amount: template.amount,
              frequency: template.frequency,
              paymentMethod: template.paymentMethod,
              notes: template.notes,
            });
          }
          
          // Restore savings goals
          const goalsToRestore = importData.savingsGoals || [];
          for (const goal of goalsToRestore) {
            const newGoal = await savingsGoalsApi.create({
              name: goal.name,
              targetAmount: goal.targetAmount,
              currentAmount: goal.currentAmount || 0,
              targetDate: goal.targetDate,
              category: goal.category,
            });
            
            // Restore contributions
            if (goal.contributions && goal.contributions.length > 0) {
              for (const contribution of goal.contributions) {
                await savingsGoalsApi.addContribution(newGoal.id, {
                  amount: contribution.amount,
                  date: contribution.date,
                  notes: contribution.notes,
                });
              }
            }
          }
          
          // Reload all data from Supabase to get the new IDs
          const [monthlyData, categoriesData, budgetsData, recurringData, paymentMethodsData, templatesData, goalsData] = await Promise.all([
            monthlyDataApi.getAll().catch(() => []),
            categoriesApi.getAll().catch(() => []),
            budgetsApi.getAll().catch(() => ({})),
            recurringExpensesApi.getAll().catch(() => []),
            paymentMethodsApi.getAll().catch(() => []),
            recurringTemplatesApi.getAll().catch(() => []),
            savingsGoalsApi.getAll().catch(() => []),
          ]);
          
          // Update local state with new data from Supabase
          setData(monthlyData.length > 0 ? monthlyData : initialData);
          
          if (categoriesData.length > 0) {
            const cats = categoriesData.map(c => c.name);
            const colors: {[key: string]: string} = {};
            categoriesData.forEach(c => { colors[c.name] = c.color; });
            setCategories(cats);
            setCategoryColors(colors);
          }
          
          setBudgets(budgetsData);
          setRecurringExpenses(recurringData);
          
          if (paymentMethodsData.length > 0) {
            const methods = paymentMethodsData.map(m => m.name);
            const colors: {[key: string]: string} = {};
            paymentMethodsData.forEach(m => { colors[m.name] = m.color; });
            setPaymentMethods(methods);
            setPaymentMethodColors(colors);
          }
          
          setRecurringTemplates(templatesData);
          setSavingsGoals(goalsData);
          
          alert('✅ Data restored successfully! All expenses have been recreated with new IDs.');
        } catch (error) {
          console.error('Error restoring data:', error);
          alert('Failed to restore data. Please try again.');
          throw error;
        } finally {
          setDataLoading(false);
        }
      }
    } catch (error) {
      console.error('Error parsing backup:', error);
      alert('Invalid backup format');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Warning: This action cannot be undone. All your expenses, budgets, categories, and settings will be permanently deleted. Are you sure?')) {
      return;
    }
    
    try {
      setDataLoading(true);
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      const userId = user.id;
      
      // Delete all data from Supabase
      await supabase.from('expenses').delete().eq('user_id', userId);
      await supabase.from('monthly_data').delete().eq('user_id', userId);
      await supabase.from('user_categories').delete().eq('user_id', userId);
      await supabase.from('budgets').delete().eq('user_id', userId);
      await supabase.from('recurring_expenses').delete().eq('user_id', userId);
      await supabase.from('payment_methods').delete().eq('user_id', userId);
      await supabase.from('recurring_templates').delete().eq('user_id', userId);
      await supabase.from('savings_goals').delete().eq('user_id', userId);
      
      // Create default categories and payment methods
      for (const category of INITIAL_CATEGORIES) {
        await categoriesApi.create(category, INITIAL_CATEGORY_COLORS[category] || '#3b82f6');
      }
      
      for (const method of INITIAL_PAYMENT_METHODS) {
        await paymentMethodsApi.create(method, INITIAL_PAYMENT_METHOD_COLORS[method] || '#3b82f6');
      }
      
      // Reload data from Supabase to get fresh state
      const [monthlyData, categoriesData, budgetsData, recurringData, paymentMethodsData, templatesData, goalsData] = await Promise.all([
        monthlyDataApi.getAll().catch(() => []),
        categoriesApi.getAll().catch(() => []),
        budgetsApi.getAll().catch(() => ({})),
        recurringExpensesApi.getAll().catch(() => []),
        paymentMethodsApi.getAll().catch(() => []),
        recurringTemplatesApi.getAll().catch(() => []),
        savingsGoalsApi.getAll().catch(() => []),
      ]);
      
      // Update local state
      setData(monthlyData.length > 0 ? monthlyData : initialData);
      
      if (categoriesData.length > 0) {
        const cats = categoriesData.map(c => c.name);
        const colors: {[key: string]: string} = {};
        categoriesData.forEach(c => { colors[c.name] = c.color; });
        setCategories(cats);
        setCategoryColors(colors);
      } else {
        setCategories(INITIAL_CATEGORIES);
        setCategoryColors(INITIAL_CATEGORY_COLORS);
      }
      
      setBudgets(budgetsData);
      setRecurringExpenses(recurringData);
      
      if (paymentMethodsData.length > 0) {
        const methods = paymentMethodsData.map(m => m.name);
        const colors: {[key: string]: string} = {};
        paymentMethodsData.forEach(m => { colors[m.name] = m.color; });
        setPaymentMethods(methods);
        setPaymentMethodColors(colors);
      } else {
        setPaymentMethods(INITIAL_PAYMENT_METHODS);
        setPaymentMethodColors(INITIAL_PAYMENT_METHOD_COLORS);
      }
      
      setRecurringTemplates(templatesData);
      setSavingsGoals(goalsData);
      
      alert('✅ All data cleared successfully!');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setDataLoading(false);
    }
    
    // Clear localStorage (legacy cleanup)
    localStorage.removeItem('intelliBudgetData');
    localStorage.removeItem('intelliBudgetCategories');
    localStorage.removeItem('intelliBudgetCategoryColors');
    localStorage.removeItem('intelliBudgetBudgets');
    localStorage.removeItem('intelliBudgetRecurring');
    localStorage.removeItem('intelliBudgetPaymentMethods');
    localStorage.removeItem('intelliBudgetPaymentMethodColors');
    localStorage.removeItem('intelliBudgetSavingsGoals');
    localStorage.removeItem('intelliBudgetRecurringTemplates');
    alert('All data has been cleared!');
  };

  const addSavingsGoal = async (goal: Omit<SavingsGoal, 'id' | 'contributions'>) => {
    try {
      const newGoal = await savingsGoalsApi.create(goal);
      setSavingsGoals(prev => [...prev, newGoal]);
    } catch (error) {
      console.error('Error adding savings goal:', error);
      alert('Failed to add savings goal. Please try again.');
    }
  };

  const updateSavingsGoal = async (goal: SavingsGoal) => {
    try {
      await savingsGoalsApi.update(goal.id, goal);
      setSavingsGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    } catch (error) {
      console.error('Error updating savings goal:', error);
      alert('Failed to update savings goal. Please try again.');
    }
  };

  const deleteSavingsGoal = async (id: string) => {
    try {
      await savingsGoalsApi.delete(id);
      setSavingsGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error('Error deleting savings goal:', error);
      alert('Failed to delete savings goal. Please try again.');
    }
  };

  const addRecurringTemplate = async (template: Omit<RecurringExpenseTemplate, 'id'>) => {
    try {
      const newTemplate = await recurringTemplatesApi.create(template);
      setRecurringTemplates(prev => [...prev, newTemplate]);
    } catch (error) {
      console.error('Error adding recurring template:', error);
      alert('Failed to add recurring template. Please try again.');
    }
  };

  const deleteRecurringTemplate = async (id: string) => {
    try {
      await recurringTemplatesApi.delete(id);
      setRecurringTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting recurring template:', error);
      alert('Failed to delete recurring template. Please try again.');
    }
  };

  const handleSetBudget = async (month: string, category: string, amount: number) => {
    try {
      await budgetsApi.set(month, category, amount);
      setBudgets(prev => ({
        ...prev,
        [month]: {
          ...prev[month],
          [category]: amount,
        },
      }));
    } catch (error) {
      console.error('Error setting budget:', error);
      alert('Failed to set budget. Please try again.');
    }
  };
  
  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id'>) => {
    try {
      const newRecurringExpense = await recurringExpensesApi.create(expense);
      setRecurringExpenses(prev => [...prev, newRecurringExpense]);
    } catch (error) {
      console.error('Error adding recurring expense:', error);
      alert('Failed to add recurring expense. Please try again.');
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    try {
      await recurringExpensesApi.delete(id);
      setRecurringExpenses(prev => prev.filter(rec => rec.id !== id));
      setData(prevData =>
          prevData.map(monthData => ({
              ...monthData,
              expenses: monthData.expenses.filter(exp => exp.recurringId !== id),
          }))
      );
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      alert('Failed to delete recurring expense. Please try again.');
    }
  };


  const NavItem: React.FC<{
    view: View;
    icon: React.ReactNode;
    label: string;
  }> = ({ view, icon, label }) => (
    <li
      className={`cursor-pointer flex items-center p-3 rounded-lg transition-all duration-200 ${
        activeView === view
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
      onClick={() => {
        setActiveView(view);
        if (window.innerWidth < 1024) {
          setIsSidebarOpen(false);
        }
      }}
    >
      {icon}
      <span className="ml-4 font-medium">{label}</span>
    </li>
  );

  const renderView = () => {
    const ViewComponent = (() => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard data={data} categoryColors={categoryColors} />;
      case 'monthly':
          return <MonthlyView data={data} addExpense={addExpense} updateExpense={updateExpense} deleteExpense={deleteExpense} categories={categories} categoryColors={categoryColors} budgets={budgets} updateSalary={updateSalary} paymentMethods={paymentMethods} paymentMethodColors={paymentMethodColors} />;
      case 'yearly':
        return <YearlyView data={data} categoryColors={categoryColors} />;
      case 'budgets':
          return <BudgetsView categories={categories} addCategory={addCategory} deleteCategory={deleteCategory} data={data} budgets={budgets} setBudget={handleSetBudget} paymentMethods={paymentMethods} paymentMethodColors={paymentMethodColors} addPaymentMethod={addPaymentMethod} deletePaymentMethod={deletePaymentMethod} />;
      case 'recurring':
          return <RecurringView recurringExpenses={recurringExpenses} addRecurringExpense={addRecurringExpense} deleteRecurringExpense={deleteRecurringExpense} categories={categories} paymentMethods={paymentMethods} templates={recurringTemplates} addTemplate={addRecurringTemplate} deleteTemplate={deleteRecurringTemplate} />;
        case 'savings':
          return <SavingsGoalsView savingsGoals={savingsGoals} addSavingsGoal={addSavingsGoal} updateSavingsGoal={updateSavingsGoal} deleteSavingsGoal={deleteSavingsGoal} categories={categories} />;
        case 'settings':
          return <SettingsView onExport={handleExport} onClearAll={handleClearAll} onBackup={handleBackup} onRestore={handleRestore} />;
        case 'help':
          return <HelpView />;
      default:
        return <Dashboard data={data} categoryColors={categoryColors} />;
    }
    })();

    return (
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      }>
        {ViewComponent}
      </Suspense>
    );
  };

  return (
    <ErrorBoundary>
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 lg:hidden" />}

      <nav className={`w-64 bg-gray-800 dark:bg-black flex flex-col fixed h-full shadow-2xl z-40 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-5 border-b border-gray-700">
          <div className="flex items-center">
            <Wallet className="w-10 h-10 text-blue-500" />
            <h1 className="text-2xl font-bold ml-3 text-white">IntelliBudget</h1>
          </div>
        </div>
        
        {/* Fixed Welcome Section */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-700">
          <div className="px-4 py-3 bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg shadow-md">
            <p className="text-xs text-blue-200 mb-1">Welcome back,</p>
            <p className="text-sm text-white font-semibold truncate">
              {user.user_metadata?.full_name || user.user_metadata?.first_name || user.email?.split('@')[0] || 'User'}
            </p>
          </div>
        </div>
        
        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto min-h-0 scroll-smooth">
          <ul className="space-y-2 p-5">
            <NavItem view="dashboard" icon={<LayoutDashboard />} label="Dashboard" />
            <NavItem view="monthly" icon={<Calendar />} label="Monthly Details" />
            <NavItem view="yearly" icon={<BarChart3 />} label="Yearly Summary" />
            <NavItem view="budgets" icon={<Settings />} label="Budgets & Categories" />
            <NavItem view="recurring" icon={<Repeat />} label="Recurring" />
            <NavItem view="savings" icon={<Target />} label="Savings Goals" />
            <NavItem view="settings" icon={<Settings />} label="Settings" />
            <NavItem view="help" icon={<HelpCircle />} label="Help & Instructions" />
          </ul>
        </div>
        
        {/* Fixed Footer */}
        <div className="flex-shrink-0 pt-4 border-t border-gray-700 px-5 pb-5">
          <LogoutButton />
          <div className="mt-4 p-3 text-center text-gray-400 text-xs">
            <p>&copy; {new Date().getFullYear()} IntelliBudget</p>
            <p className="mt-1">Your smart finance companion.</p>
          </div>
        </div>
      </nav>
      <main className={`flex-1 p-4 sm:p-8 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        <div className="flex items-center mb-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
            {isSidebarOpen ? <X size={24}/> : <Menu size={24} />}
          </button>
        </div>
        {renderView()}
      </main>
    </div>
    </ErrorBoundary>
  );
};

export default App;