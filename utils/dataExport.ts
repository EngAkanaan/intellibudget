import type { MonthlyData, Expense, RecurringExpense } from '../types';

export interface ExportData {
  data: MonthlyData[];
  categories: string[];
  categoryColors: { [key: string]: string };
  budgets: { [month: string]: { [category: string]: number } };
  recurringExpenses: RecurringExpense[];
  paymentMethods: string[];
  paymentMethodColors: { [key: string]: string };
  savingsGoals?: any[]; // SavingsGoal[] but avoiding circular import
  exportDate: string;
  version: string;
}

export const exportToCSV = (data: MonthlyData[]): void => {
  const headers = ['Date', 'Month', 'Category', 'Payment Method', 'Amount', 'Notes'];
  const rows: string[][] = [headers];

  data.forEach(monthData => {
    monthData.expenses.forEach(expense => {
      rows.push([
        expense.date,
        monthData.month,
        expense.category,
        expense.paymentMethod || '',
        expense.amount.toString(),
        expense.notes.replace(/"/g, '""'), // Escape quotes for CSV
      ]);
    });
  });

  const csvContent = rows.map(row => 
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `intellibudget-export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (exportData: ExportData): string => {
  return JSON.stringify(exportData, null, 2);
};

export const generateBackup = (exportData: ExportData): string => {
  return exportToJSON(exportData);
};

export const validateImportData = (data: any): data is ExportData => {
  return (
    data &&
    Array.isArray(data.data) &&
    Array.isArray(data.categories) &&
    typeof data.categoryColors === 'object' &&
    typeof data.budgets === 'object'
  );
};

