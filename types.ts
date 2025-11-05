export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  subcategory?: string;
  amount: number;
  notes: string;
  recurringId?: string;
  paymentMethod?: PaymentMethod;
}

export type PaymentMethod = string;

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  dayOfMonth: number;
  startDate: string; // YYYY-MM
  paymentMethod?: PaymentMethod;
}

export interface RecurringExpenseTemplate {
  id: string;
  name: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  dayOfMonth: number;
  paymentMethod?: PaymentMethod;
}

export interface MonthlyData {
  month: string; // YYYY-MM, e.g., "2025-11"
  salary: number;
  expenses: Expense[];
}

export type ExpenseCategory = string;

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category?: string; // Optional category to track savings from
  contributions?: SavingsContribution[]; // History of contributions
}