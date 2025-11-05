import type { ExpenseCategory } from './types';

export const INITIAL_CATEGORIES: ExpenseCategory[] = [
  'Category 1',
  'Category 2',
  'Category 3',
  'Category 4',
  'Category 5',
  'Other'
];

export const INITIAL_CATEGORY_COLORS: { [key in ExpenseCategory]: string } = {
  'Category 1': '#3b82f6', // blue-500
  'Category 2': '#10b981', // emerald-500
  'Category 3': '#f59e0b', // amber-500
  'Category 4': '#ef4444', // red-500
  'Category 5': '#8b5cf6', // violet-500
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
  'Payment Method 1',
  'Payment Method 2',
  'Payment Method 3'
];

export const INITIAL_PAYMENT_METHOD_COLORS: { [key: string]: string } = {
  'Payment Method 1': '#10b981', // emerald-500
  'Payment Method 2': '#3b82f6', // blue-500
  'Payment Method 3': '#f59e0b', // amber-500
};