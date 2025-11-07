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

export interface IncomeSource {
  id: string;
  description: string; // e.g., "Salary", "Business Income", "Crypto Trading", "Loan Repayment"
  amount: number;
  date: string; // YYYY-MM-DD for one-time income
  sourceType: string; // "salary", "business", "crypto", "loan", "investment", "other"
  notes?: string;
  isRecurring?: boolean; // If true, generates income on specific day each month
  recurringDayOfMonth?: number; // Day of month for recurring income (1-31)
  recurringStartDate?: string; // YYYY-MM - when recurring income starts
  recurringId?: string; // ID for recurring income template
}

export interface MonthlyData {
  month: string; // YYYY-MM, e.g., "2025-11"
  salary: number; // DEPRECATED: Use incomeSources instead. Kept for backward compatibility
  expenses: Expense[];
  incomeSources?: IncomeSource[]; // New: Multiple income sources
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

// Quick Note for fast expense capture
export interface QuickNote {
  id: string;
  text: string;
  createdAt: string; // ISO timestamp
  processed: boolean; // Whether it's been converted to an expense
  processedAt?: string; // When it was processed
}
