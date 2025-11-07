import type { ExpenseCategory } from './types';

export const INITIAL_CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Travel',
  'Transportation',
  'Gym',
  'Other'
];

export const INITIAL_CATEGORY_COLORS: { [key in ExpenseCategory]: string } = {
  'Food': '#f59e0b', // amber-500
  'Travel': '#3b82f6', // blue-500
  'Transportation': '#10b981', // emerald-500
  'Gym': '#ef4444', // red-500
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
  'MasterCard'
];

export const INITIAL_PAYMENT_METHOD_COLORS: { [key: string]: string } = {
  'Cash': '#10b981', // emerald-500
  'Visa Card': '#3b82f6', // blue-500
  'MasterCard': '#ef4444', // red-500
};