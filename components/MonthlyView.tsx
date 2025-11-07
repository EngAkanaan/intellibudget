import React, { useState, useMemo, useEffect } from 'react';
import type { MonthlyData, Expense, ExpenseCategory } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from './shared/Card';
import { PlusCircle, X, Pencil, Trash2, Check, Search, Filter, AlertCircle, Keyboard, CheckSquare, Square, Bell, DollarSign, Calendar, Repeat } from 'lucide-react';

import type { IncomeSource } from '../types';

interface MonthlyViewProps {
  data: MonthlyData[];
  addExpense: (month: string, expense: Omit<Expense, 'id'>) => void;
  updateExpense: (month: string, expense: Expense) => void;
  deleteExpense: (month: string, expenseId: string) => void;
  categories: string[];
  categoryColors: { [key: string]: string };
  budgets: { [month: string]: { [category: string]: number } };
  updateSalary: (month: string, newSalary: number) => void;
  paymentMethods?: string[];
  paymentMethodColors?: { [key: string]: string };
  addIncomeSource: (month: string, income: Omit<IncomeSource, 'id'>) => void;
  updateIncomeSource: (month: string, income: IncomeSource) => void;
  deleteIncomeSource: (month: string, incomeId: string) => void;
}

const BudgetProgressBar: React.FC<{ spent: number; budget: number; color: string }> = ({ spent, budget, color }) => {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const difference = spent - budget;
  const remaining = budget - spent;
  let barColor = 'bg-green-500';
  if (percentage > 100) barColor = 'bg-red-500';
  else if (percentage > 90) barColor = 'bg-orange-500';
  else if (percentage > 50) barColor = 'bg-yellow-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium" style={{ color }}>{formatCurrency(spent)}</span>
        <span className="text-gray-400">/ {formatCurrency(budget)}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
        <div className={`${barColor} h-2.5 rounded-full transition-all`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
      </div>
      <div className="flex justify-between text-xs">
        <span className={`font-medium ${percentage > 100 ? 'text-red-500' : percentage > 90 ? 'text-orange-500' : 'text-green-500'}`}>
          {percentage.toFixed(1)}%
        </span>
        {percentage > 100 ? (
          <span className="text-red-500 font-semibold">Overspent: {formatCurrency(Math.abs(difference))}</span>
        ) : (
          <span className="text-green-500">Remaining: {formatCurrency(remaining)}</span>
       )}
      </div>
    </div>
  );
};

// Helper function to get current month in YYYY-MM format
const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

const MonthlyView: React.FC<MonthlyViewProps> = ({ data, addExpense, updateExpense, deleteExpense, categories, categoryColors, budgets, updateSalary, paymentMethods = [], paymentMethodColors = {}, addIncomeSource, updateIncomeSource, deleteIncomeSource }) => {
  // Get current month or fallback to last month in data if current month doesn't exist
  const currentMonth = getCurrentMonth();
  const defaultMonth = data.find(m => m.month === currentMonth)?.month || data[data.length - 1]?.month || '';
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // State for salary editing (deprecated, kept for backward compatibility)
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [newSalary, setNewSalary] = useState('');
  
  // State for income sources management
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSource | null>(null);
  const [incomeFormState, setIncomeFormState] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    sourceType: 'salary',
    notes: '',
    isRecurring: false,
    recurringDayOfMonth: '',
    recurringStartDate: new Date().toISOString().slice(0, 7),
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);

  const [formState, setFormState] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Food' as ExpenseCategory,
    amount: '',
    notes: '',
    paymentMethod: paymentMethods[0] || '',
  });

  useEffect(() => {
    if (editingExpense) {
      setFormState({
        date: editingExpense.date,
        category: editingExpense.category,
        amount: editingExpense.amount.toString(),
        notes: editingExpense.notes,
        paymentMethod: editingExpense.paymentMethod || paymentMethods[0] || '',
      });
      setIsModalOpen(true);
    }
  }, [editingExpense, paymentMethods]);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormState({
      date: new Date().toISOString().split('T')[0],
      category: 'Food' as ExpenseCategory,
      amount: '',
      notes: '',
      paymentMethod: paymentMethods[0] || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const currentMonthData = useMemo(() => {
    return data.find(m => m.month === selectedMonth);
  }, [data, selectedMonth]);

  const monthlySummary = useMemo(() => {
    if (!currentMonthData) return { totalExpenses: 0, totalIncome: 0, balance: 0, highestExpense: 0, avgExpense: 0, categoryTotals: {} };
    const totalExpenses = currentMonthData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    // Calculate total income from income sources, fallback to salary for backward compatibility
    const incomeSources = currentMonthData.incomeSources || [];
    const totalIncome = incomeSources.length > 0 
      ? incomeSources.reduce((sum, inc) => sum + inc.amount, 0)
      : currentMonthData.salary || 0;
    const balance = totalIncome - totalExpenses;
    const highestExpense = Math.max(0, ...currentMonthData.expenses.map(e => e.amount));
    const avgExpense = currentMonthData.expenses.length > 0 ? totalExpenses / currentMonthData.expenses.length : 0;
    const categoryTotals = currentMonthData.expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {} as {[key: string]: number});
    return { totalExpenses, totalIncome, balance, highestExpense, avgExpense, categoryTotals };
  }, [currentMonthData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonth || !formState.amount) return;

    const expenseData = {
      ...formState,
      amount: parseFloat(formState.amount),
      date: formState.date.includes(selectedMonth) ? formState.date : `${selectedMonth}-${formState.date.split('-')[2]}`,
      paymentMethod: formState.paymentMethod || undefined,
    };

    if (editingExpense) {
      updateExpense(selectedMonth, { ...expenseData, id: editingExpense.id });
    } else {
      addExpense(selectedMonth, expenseData);
    }
    closeModal();
  };
  
  const handleDelete = (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
        deleteExpense(selectedMonth, expenseId);
    }
  };

  const toggleBulkMode = () => {
    setIsBulkMode(!isBulkMode);
    setSelectedExpenses(new Set());
  };

  const toggleExpenseSelection = (expenseId: string) => {
    setSelectedExpenses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(expenseId)) {
        newSet.delete(expenseId);
      } else {
        newSet.add(expenseId);
      }
      return newSet;
    });
  };

  const selectAllExpenses = () => {
    if (selectedExpenses.size === filteredAndSortedExpenses.length) {
      setSelectedExpenses(new Set());
    } else {
      setSelectedExpenses(new Set(filteredAndSortedExpenses.map(e => e.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedExpenses.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedExpenses.size} expense(s)?`)) {
      selectedExpenses.forEach(id => deleteExpense(selectedMonth, id));
      setSelectedExpenses(new Set());
      setIsBulkMode(false);
    }
  };

  const handleBulkCategoryChange = (newCategory: string) => {
    if (selectedExpenses.size === 0) return;
    filteredAndSortedExpenses.forEach(expense => {
      if (selectedExpenses.has(expense.id)) {
        updateExpense(selectedMonth, { ...expense, category: newCategory as ExpenseCategory });
      }
    });
    setSelectedExpenses(new Set());
    setIsBulkMode(false);
  };

  const handleSalaryEdit = () => {
    if (currentMonthData) {
      setNewSalary(currentMonthData.salary.toString());
      setIsEditingSalary(true);
    }
  };

  const handleSalarySave = () => {
    const salaryValue = parseFloat(newSalary);
    if (!isNaN(salaryValue) && selectedMonth) {
      updateSalary(selectedMonth, salaryValue);
      setIsEditingSalary(false);
    }
  };

  // Income Sources Management
  const openAddIncomeModal = () => {
    setEditingIncome(null);
    setIncomeFormState({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      sourceType: 'salary',
      notes: '',
      isRecurring: false,
      recurringDayOfMonth: '',
      recurringStartDate: new Date().toISOString().slice(0, 7),
    });
    setIsIncomeModalOpen(true);
  };

  const openEditIncomeModal = (income: IncomeSource) => {
    setEditingIncome(income);
    setIncomeFormState({
      description: income.description,
      amount: income.amount.toString(),
      date: income.date,
      sourceType: income.sourceType,
      notes: income.notes || '',
      isRecurring: income.isRecurring || false,
      recurringDayOfMonth: income.recurringDayOfMonth?.toString() || '',
      recurringStartDate: income.recurringStartDate || new Date().toISOString().slice(0, 7),
    });
    setIsIncomeModalOpen(true);
  };

  const closeIncomeModal = () => {
    setIsIncomeModalOpen(false);
    setEditingIncome(null);
  };

  const handleIncomeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setIncomeFormState(prev => ({ ...prev, [name]: checked }));
    } else {
      setIncomeFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonth || !incomeFormState.amount || !incomeFormState.description) return;

    const incomeData: Omit<IncomeSource, 'id'> = {
      description: incomeFormState.description,
      amount: parseFloat(incomeFormState.amount),
      date: incomeFormState.date,
      sourceType: incomeFormState.sourceType,
      notes: incomeFormState.notes,
      isRecurring: incomeFormState.isRecurring,
      recurringDayOfMonth: incomeFormState.isRecurring && incomeFormState.recurringDayOfMonth 
        ? parseInt(incomeFormState.recurringDayOfMonth, 10) 
        : undefined,
      recurringStartDate: incomeFormState.isRecurring ? incomeFormState.recurringStartDate : undefined,
    };

    if (editingIncome) {
      updateIncomeSource(selectedMonth, { ...incomeData, id: editingIncome.id });
    } else {
      addIncomeSource(selectedMonth, incomeData);
    }
    closeIncomeModal();
  };

  const handleDeleteIncome = (incomeId: string) => {
    if (window.confirm('Are you sure you want to delete this income source?')) {
      deleteIncomeSource(selectedMonth, incomeId);
    }
  };

  // Duplicate detection
  const duplicateExpenses = useMemo(() => {
    if (!currentMonthData) return [];
    const duplicates: { expense: Expense; duplicates: Expense[] }[] = [];
    const seen = new Map<string, Expense[]>();
    
    currentMonthData.expenses.forEach(expense => {
      const key = `${expense.amount}-${expense.category}-${expense.date}`;
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push(expense);
    });
    
    seen.forEach((expenses, key) => {
      if (expenses.length > 1) {
        duplicates.push({ expense: expenses[0], duplicates: expenses });
      }
    });
    
    return duplicates;
  }, [currentMonthData]);

  const filteredAndSortedExpenses = useMemo(() => {
      if (!currentMonthData) return [];
      
      let filtered = currentMonthData.expenses.filter(expense => {
        // Search filter
        const matchesSearch = !searchQuery || 
          expense.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expense.amount.toString().includes(searchQuery) ||
          expense.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase());
        
        // Category filter
        const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
        
        // Payment method filter
        const matchesPaymentMethod = filterPaymentMethod === 'all' || 
          (filterPaymentMethod === 'none' && !expense.paymentMethod) ||
          expense.paymentMethod === filterPaymentMethod;
        
        return matchesSearch && matchesCategory && matchesPaymentMethod;
      });
      
      return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentMonthData, searchQuery, filterCategory, filterPaymentMethod]);

  // Keyboard shortcuts for quick expense entry
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Use Ctrl+E (for Expense) instead of Ctrl+N to avoid browser conflict
      // Ctrl+N opens new window in browsers, so we use Ctrl+E
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        const target = e.target as HTMLElement;
        const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;
        
        if (!isInputField && !isModalOpen) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          setEditingExpense(null);
          setFormState({
            date: new Date().toISOString().split('T')[0],
            category: 'Food' as ExpenseCategory,
            amount: '',
            notes: '',
            paymentMethod: paymentMethods[0] || '',
          });
          setIsModalOpen(true);
        }
      }
      // Escape to close modal
      if (e.key === 'Escape' && isModalOpen) {
        e.preventDefault();
        setIsModalOpen(false);
        setEditingExpense(null);
      }
      // Escape to close income modal
      if (e.key === 'Escape' && isIncomeModalOpen) {
        e.preventDefault();
        closeIncomeModal();
      }
    };

    // Use capture phase to catch the event before browser handles it
    document.addEventListener('keydown', handleKeyPress, true);
    return () => document.removeEventListener('keydown', handleKeyPress, true);
  }, [isModalOpen, isIncomeModalOpen, paymentMethods]);

  const monthBudgets = budgets[selectedMonth] || {};
  const budgetStatusData = useMemo(() => {
    const allRelevantCategories = new Set([
      ...Object.keys(monthBudgets),
      ...Object.keys(monthlySummary.categoryTotals)
    ]);
    return Array.from(allRelevantCategories)
      .map(cat => ({
        category: cat,
        spent: monthlySummary.categoryTotals[cat] || 0,
        budget: monthBudgets[cat] || 0,
      }))
      .filter(item => item.budget > 0);
  }, [monthBudgets, monthlySummary.categoryTotals]);

  // Budget alerts - categories approaching or exceeding budget
  const budgetAlerts = useMemo(() => {
    return budgetStatusData
      .filter(item => {
        const percentage = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;
        return percentage >= 80; // Alert when 80% or more of budget is spent
      })
      .sort((a, b) => {
        const aPct = (a.spent / a.budget) * 100;
        const bPct = (b.spent / b.budget) * 100;
        return bPct - aPct;
      });
  }, [budgetStatusData]);


  return (
    <div className="space-y-6 print-container">
      <div className="flex justify-between items-center flex-wrap gap-4 no-print">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white print:text-black">Monthly Details</h1>
        <div className="flex items-center space-x-4 flex-wrap gap-4">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {data.map(m => (
              <option key={m.month} value={m.month}>
                {new Date(m.month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
          <div className="flex gap-2 flex-wrap">
            <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md no-print">
            <PlusCircle className="mr-2" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Add</span>
              <span className="ml-2 text-xs opacity-75 hidden lg:inline">(Ctrl+E)</span>
            </button>
            <button
              onClick={toggleBulkMode}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors shadow-md no-print ${
                isBulkMode 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {isBulkMode ? <CheckSquare className="mr-2" size={18} /> : <Square className="mr-2" size={18} />}
              <span className="hidden sm:inline">{isBulkMode ? 'Cancel' : 'Bulk Edit'}</span>
              <span className="sm:hidden">{isBulkMode ? 'Cancel' : 'Bulk'}</span>
            </button>
            {isBulkMode && selectedExpenses.size > 0 && (
              <>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md no-print"
                >
                  <Trash2 className="mr-2" size={18} />
                  Delete ({selectedExpenses.size})
                </button>
                <select
                  onChange={(e) => handleBulkCategoryChange(e.target.value)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md no-print"
                  defaultValue=""
                >
                  <option value="">Change Category...</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </>
            )}
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md print-keep"
            >
              Print
          </button>
          </div>
        </div>
      </div>

      {currentMonthData && (
        <Card className="no-print">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                <Search className="mr-2" size={16} />
                Search Expenses
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by notes, category, amount..."
                className="w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                <Filter className="mr-2" size={16} />
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            {paymentMethods.length > 0 && (
              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Payment Method
                </label>
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="none">None</option>
                  {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
                </select>
              </div>
            )}
            {(searchQuery || filterCategory !== 'all' || filterPaymentMethod !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                  setFilterPaymentMethod('all');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
          {filteredAndSortedExpenses.length !== currentMonthData.expenses.length && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredAndSortedExpenses.length} of {currentMonthData.expenses.length} expenses
            </p>
          )}
        </Card>
      )}

      {/* Print header - only visible when printing */}
      {currentMonthData && (
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold text-black mb-2">Monthly Details</h1>
          <p className="text-black text-lg">
            {new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      )}
      
      {currentMonthData && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="flex justify-between items-start mb-2">
                  <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
                      <p className="text-xl font-semibold text-green-500">{formatCurrency(monthlySummary.totalIncome)}</p>
                  </div>
                  <button 
                    onClick={openAddIncomeModal} 
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                    title="Add Income Source"
                  >
                    <PlusCircle size={16} />
                    <span className="hidden sm:inline">Add</span>
                  </button>
              </div>
              {/* Income Sources List */}
              <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
                {currentMonthData.incomeSources && currentMonthData.incomeSources.length > 0 ? (
                  currentMonthData.incomeSources.map((income) => (
                    <div key={income.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{income.description}</span>
                          {income.isRecurring && <Repeat size={12} className="text-blue-500 flex-shrink-0" title="Recurring" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(income.date)}</span>
                          <span className="text-xs text-green-600 dark:text-green-400 font-semibold">{formatCurrency(income.amount)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditIncomeModal(income)} className="p-1 text-gray-400 hover:text-blue-500" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteIncome(income.id)} className="p-1 text-gray-400 hover:text-red-500" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">No income sources yet</p>
                )}
              </div>
            </Card>
            <Card><p className="text-sm text-gray-500 dark:text-gray-400">Expenses</p><p className="text-xl font-semibold text-red-500">{formatCurrency(monthlySummary.totalExpenses)}</p></Card>
            <Card><p className="text-sm text-gray-500 dark:text-gray-400">Balance</p><p className={`text-xl font-semibold ${monthlySummary.balance >= 0 ? 'text-blue-500' : 'text-yellow-500'}`}>{formatCurrency(monthlySummary.balance)}</p></Card>
            <Card><p className="text-sm text-gray-500 dark:text-gray-400">Highest Expense</p><p className="text-xl font-semibold">{formatCurrency(monthlySummary.highestExpense)}</p></Card>
        </div>
        
        {duplicateExpenses.length > 0 && (
          <Card className="border-2 border-yellow-500 dark:border-yellow-600">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <AlertCircle className="mr-2 text-yellow-500" size={20} />
                <h2 className="text-xl font-semibold">Potential Duplicate Expenses</h2>
              </div>
              <button
                onClick={() => setShowDuplicates(!showDuplicates)}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                {showDuplicates ? 'Hide' : 'Show'} ({duplicateExpenses.length})
              </button>
            </div>
            {showDuplicates && (
              <div className="space-y-3">
                {duplicateExpenses.map(({ expense, duplicates }, idx) => (
                  <div key={idx} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="font-semibold mb-2">
                      {formatCurrency(expense.amount)} - {expense.category} on {formatDate(expense.date)}
                      <span className="text-yellow-600 dark:text-yellow-400 ml-2">({duplicates.length} similar entries)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {duplicates.map(dup => (
                        <button
                          key={dup.id}
                          onClick={() => handleDelete(dup.id)}
                          className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          Delete {formatDate(dup.date)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {budgetAlerts.length > 0 && (
          <Card className="border-2 border-orange-500 dark:border-orange-600">
            <div className="flex items-center mb-4">
              <Bell className="mr-2 text-orange-500" size={20} />
              <h2 className="text-xl font-semibold">Budget Alerts</h2>
            </div>
            <div className="space-y-2">
              {budgetAlerts.map(({ category, spent, budget }) => {
                const percentage = (spent / budget) * 100;
                const isOverBudget = percentage > 100;
                return (
                  <div key={category} className={`p-3 rounded-lg ${isOverBudget ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold" style={{ color: categoryColors[category] }}>{category}</span>
                      <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        {percentage.toFixed(1)}% used
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(spent)} / {formatCurrency(budget)}
                      {isOverBudget && (
                        <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">
                          Over by {formatCurrency(spent - budget)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
        
        {budgetStatusData.length > 0 && (
          <Card>
            <h2 className="text-xl font-semibold mb-4">Budget vs Actual Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b dark:border-gray-600">
                  <tr>
                    <th className="p-3 font-semibold">Category</th>
                    <th className="p-3 font-semibold text-right">Budget</th>
                    <th className="p-3 font-semibold text-right">Actual</th>
                    <th className="p-3 font-semibold text-right">Difference</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold w-32">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetStatusData.map(({ category, spent, budget }) => {
                    const difference = spent - budget;
                    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                    return (
                      <tr key={category} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="p-3">
                          <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: `${categoryColors[category]}20`, color: categoryColors[category]}}>
                            {category}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">{formatCurrency(budget)}</td>
                        <td className="p-3 text-right font-mono font-semibold">{formatCurrency(spent)}</td>
                        <td className={`p-3 text-right font-mono font-semibold ${difference > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            percentage > 100 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                            percentage > 90 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                            'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {percentage > 100 ? 'Over Budget' : percentage > 90 ? 'Warning' : 'On Track'}
                          </span>
                        </td>
                        <td className="p-3">
                  <BudgetProgressBar spent={spent} budget={budget} color={categoryColors[category] || '#ccc'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card className="break-inside-avoid">
            <div className="h-[60vh] overflow-auto relative table-responsive">
                <table className="w-full text-left min-w-[700px] print:min-w-0">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10">
                    <tr className="border-b dark:border-gray-600">
                        {isBulkMode && (
                          <th className="p-4 font-semibold w-12">
                            <button
                              onClick={selectAllExpenses}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              {selectedExpenses.size === filteredAndSortedExpenses.length && filteredAndSortedExpenses.length > 0 ? (
                                <CheckSquare size={20} />
                              ) : (
                                <Square size={20} />
                              )}
                            </button>
                          </th>
                        )}
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 font-semibold">Category</th>
                        <th className="p-4 font-semibold">Payment Method</th>
                        <th className="p-4 font-semibold">Notes</th>
                        <th className="p-4 font-semibold text-right">Amount</th>
                        <th className="p-4 font-semibold text-center">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredAndSortedExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={isBulkMode ? 7 : 6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                          {searchQuery || filterCategory !== 'all' || filterPaymentMethod !== 'all' 
                            ? 'No expenses match your filters.'
                            : 'No expenses for this month.'}
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedExpenses.map(expense => {
                        const isHighExpense = expense.amount > monthlySummary.avgExpense * 1.5 && monthlySummary.avgExpense > 0;
                        const isSelected = selectedExpenses.has(expense.id);
                        return (
                        <tr key={expense.id} className={`border-b dark:border-gray-600 last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-700/50 ${isHighExpense ? 'bg-orange-500/10' : ''} ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}>
                            {isBulkMode && (
                              <td className="p-4">
                                <button
                                  onClick={() => toggleExpenseSelection(expense.id)}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                              </td>
                            )}
                            <td className="p-4 whitespace-nowrap">{formatDate(expense.date)}</td>
                            <td className="p-4"><span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: `${categoryColors[expense.category]}20`, color: categoryColors[expense.category]}}>{expense.category}</span></td>
                            <td className="p-4">
                              {expense.paymentMethod ? (
                                <span className="px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1" style={{backgroundColor: `${paymentMethodColors[expense.paymentMethod] || '#6b7280'}20`, color: paymentMethodColors[expense.paymentMethod] || '#6b7280'}}>
                                  <span className="w-2 h-2 rounded-full" style={{backgroundColor: paymentMethodColors[expense.paymentMethod] || '#6b7280'}}></span>
                                  <span>{expense.paymentMethod}</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="p-4 text-gray-600 dark:text-gray-400 max-w-sm truncate" title={expense.notes}>{expense.notes}</td>
                            <td className="p-4 text-right font-mono font-semibold">{formatCurrency(expense.amount)}</td>
                            <td className="p-4 text-center">
                                <div className="flex justify-center items-center space-x-2">
                                    <button onClick={() => setEditingExpense(expense)} className="p-1 text-gray-400 hover:text-blue-500 transition-colors"><Pencil size={16} /></button>
                                    <button onClick={() => handleDelete(expense.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </td>
                        </tr>
                        );
                      })
                    )}
                    </tbody>
                </table>
            </div>
        </Card>
        </>
      )}

      {/* Income Source Modal */}
      {isIncomeModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" 
          onClick={(e) => {
            // Only close if clicking directly on the backdrop, not on modal content
            if (e.target === e.currentTarget) {
              closeIncomeModal();
            }
          }}
        >
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{editingIncome ? 'Edit Income Source' : 'Add Income Source'}</h2>
              <button onClick={closeIncomeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X /></button>
            </div>
            <form onSubmit={handleIncomeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <input 
                  type="text" 
                  name="description" 
                  value={incomeFormState.description} 
                  onChange={handleIncomeInputChange} 
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="e.g., Salary, Business Income, Crypto Trading"
                  className="w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-white" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="amount" 
                    value={incomeFormState.amount} 
                    onChange={handleIncomeInputChange} 
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder="0.00" 
                    className="w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-white" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Source Type *</label>
                  <select 
                    name="sourceType" 
                    value={incomeFormState.sourceType} 
                    onChange={handleIncomeInputChange} 
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    className="w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-white" 
                    required
                  >
                    <option value="salary">Salary</option>
                    <option value="business">Business</option>
                    <option value="crypto">Crypto</option>
                    <option value="loan">Loan Repayment</option>
                    <option value="investment">Investment</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                <input 
                  type="date" 
                  name="date" 
                  value={incomeFormState.date} 
                  onChange={handleIncomeInputChange} 
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  className="w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-white" 
                  required 
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isRecurring" 
                    checked={incomeFormState.isRecurring} 
                    onChange={handleIncomeInputChange}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recurring Income (e.g., salary on 1st and 15th)</span>
                </label>
              </div>
              {incomeFormState.isRecurring && (
                <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-green-500">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day of Month (1-31)</label>
                    <input 
                      type="number" 
                      name="recurringDayOfMonth" 
                      value={incomeFormState.recurringDayOfMonth} 
                      onChange={handleIncomeInputChange} 
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      min="1" 
                      max="31"
                      placeholder="e.g., 1 or 15"
                      className="w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                    <input 
                      type="month" 
                      name="recurringStartDate" 
                      value={incomeFormState.recurringStartDate} 
                      onChange={handleIncomeInputChange} 
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      className="w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-white" 
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                <textarea 
                  name="notes" 
                  value={incomeFormState.notes} 
                  onChange={handleIncomeInputChange} 
                  onClick={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={closeIncomeModal} 
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingIncome ? 'Update' : 'Add'} Income
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <Card className="w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{editingExpense ? 'Edit Expense' : 'New Expense'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-200"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400">Date</label>
                <input type="date" name="date" value={formState.date} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Category</label>
                <select name="category" value={formState.category} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500" required>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400">Amount</label>
                <input type="number" step="0.01" name="amount" value={formState.amount} onChange={handleInputChange} placeholder="0.00" className="mt-1 block w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              {paymentMethods.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-400">Payment Method</label>
                  <select name="paymentMethod" value={formState.paymentMethod} onChange={handleInputChange} className="mt-1 block w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500">
                    <option value="">None</option>
                    {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-400">Notes</label>
                <textarea name="notes" value={formState.notes} onChange={handleInputChange} rows={3} className="mt-1 block w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"></textarea>
              </div>
              <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                {editingExpense ? 'Save Changes' : 'Add Expense'}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MonthlyView;