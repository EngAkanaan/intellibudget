import type { MonthlyData } from '../types';

/**
 * Generates empty monthly data entries from January 2025 to December 2050
 * Each month starts with zero salary and empty expenses array
 */
const generateEmptyMonthlyData = (): MonthlyData[] => {
  const months: MonthlyData[] = [];
  
  // Generate months from 2025-01 to 2050-12
  for (let year = 2025; year <= 2050; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthString = `${year}-${month.toString().padStart(2, '0')}`;
      months.push({
        month: monthString,
        salary: 0,
        expenses: [],
          });
        }
      }

  return months;
};

export const initialData: MonthlyData[] = generateEmptyMonthlyData();
