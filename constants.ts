import type { ExpenseCategory } from './types';

export const INITIAL_CATEGORIES: ExpenseCategory[] = [
  'Essentials',
  'Food',
  'Fuel',
  'Personal',
  'Gym',
  'Loan',
  'Emergency Fund',
  'Crypto',
  'France Goal',
  'Flex Reserve',
  'Other'
];

export const INITIAL_CATEGORY_COLORS: { [key in ExpenseCategory]: string } = {
  'Essentials': '#3b82f6', // blue-500
  'Food': '#10b981', // emerald-500
  'Fuel': '#f97316', // orange-500
  'Personal': '#8b5cf6', // violet-500
  'Gym': '#ec4899', // pink-500
  'Loan': '#ef4444', // red-500
  'Emergency Fund': '#f59e0b', // amber-500
  'Crypto': '#6366f1', // indigo-500
  'France Goal': '#d946ef', // fuchsia-500
  'Flex Reserve': '#14b8a6', // teal-500
  'Other': '#6b7280', // gray-500
};

// New palette for dynamically added categories
export const PALETTE_COLORS = [
  '#06b6d4', // cyan-500
  '#22c55e', // green-500
  '#a855f7', // purple-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#0891b2', // cyan-600
];


export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Payment Methods
export const INITIAL_PAYMENT_METHODS: string[] = [
  'Cash',
  'Visa Card',
  'E-Wallet',
];

export const INITIAL_PAYMENT_METHOD_COLORS: { [key: string]: string } = {
  'Cash': '#10b981', // emerald-500
  'Visa Card': '#3b82f6', // blue-500
  'E-Wallet': '#8b5cf6', // violet-500
};