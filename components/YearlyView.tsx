import React, { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import type { MonthlyData, ExpenseCategory } from '../types';
import Card from './shared/Card';
import { MONTH_NAMES } from '../constants';
import { formatCurrency } from '../utils/formatters';
import { BarChart3, LineChart as LineIcon, Calendar, TrendingUp } from 'lucide-react';

interface YearlyViewProps {
  data: MonthlyData[];
  categoryColors: { [key: string]: string };
}

const YearlyView: React.FC<YearlyViewProps> = ({ data, categoryColors }) => {
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [comparisonYear, setComparisonYear] = useState<string | null>(null);
  const filteredData = useMemo(() => {
    if (!dateRange) return data;
    return data.filter(monthData => {
      return monthData.month >= dateRange.start && monthData.month <= dateRange.end;
    });
  }, [data, dateRange]);

  const yearlySummaryData = useMemo(() => {
    return filteredData.map(monthData => {
      const totalExpenses = monthData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const monthIndex = parseInt(monthData.month.split('-')[1], 10) - 1;
      const year = monthData.month.split('-')[0];
      return {
        name: `${MONTH_NAMES[monthIndex]} '${year.slice(2)}`,
        month: monthData.month,
        Income: monthData.salary,
        Expenses: totalExpenses,
        Balance: monthData.salary - totalExpenses
      };
    });
  }, [filteredData]);

  const comparisonData = useMemo(() => {
    if (!comparisonYear) return null;
    const currentYear = comparisonYear;
    const previousYear = String(parseInt(currentYear) - 1);
    
    const currentData = filteredData.filter(m => m.month.startsWith(currentYear));
    const previousData = data.filter(m => m.month.startsWith(previousYear));
    
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    
    return months.map(month => {
      const currentMonth = currentData.find(m => m.month === `${currentYear}-${month}`);
      const previousMonth = previousData.find(m => m.month === `${previousYear}-${month}`);
      
      return {
        month: MONTH_NAMES[parseInt(month) - 1],
        [`${currentYear} Income`]: currentMonth?.salary || 0,
        [`${previousYear} Income`]: previousMonth?.salary || 0,
        [`${currentYear} Expenses`]: currentMonth?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0,
        [`${previousYear} Expenses`]: previousMonth?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0,
      };
    });
  }, [filteredData, data, comparisonYear]);

  const yearlyCategoryData = useMemo(() => {
    const categoryTotals = filteredData.flatMap(m => m.expenses).reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as { [key in ExpenseCategory]: number });

    return Object.entries(categoryTotals).map(([name, Total]) => ({ name, Total })).sort((a,b) => Number(b.Total) - Number(a.Total));
  }, [filteredData]);

  const overallTotals = useMemo(() => {
    const totalIncome = filteredData.reduce((sum, m) => sum + m.salary, 0);
    const totalExpenses = filteredData.flatMap(m => m.expenses).reduce((sum, e) => sum + e.amount, 0);
    return {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses
    };
  }, [filteredData]);

  const availableYears = useMemo(() => {
    const years = new Set(data.map(m => m.month.split('-')[0]));
    return Array.from(years).sort();
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Yearly Summary</h1>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-500" size={18} />
            <input
              type="month"
              placeholder="Start"
              value={dateRange?.start || ''}
              onChange={(e) => setDateRange(prev => ({ start: e.target.value, end: prev?.end || '' }))}
              className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="month"
              placeholder="End"
              value={dateRange?.end || ''}
              onChange={(e) => setDateRange(prev => ({ start: prev?.start || '', end: e.target.value }))}
              className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {dateRange && (
              <button
                onClick={() => setDateRange(null)}
                className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                Clear
              </button>
            )}
          </div>
          <select
            value={comparisonYear || ''}
            onChange={(e) => setComparisonYear(e.target.value || null)}
            className="p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No Comparison</option>
            {availableYears.filter(y => parseInt(y) > parseInt(availableYears[0] || '2025')).map(year => (
              <option key={year} value={year}>Compare with {parseInt(year) - 1}</option>
            ))}
          </select>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card><p className="text-sm text-gray-500 dark:text-gray-400">Total Yearly Income</p><p className="text-2xl font-semibold text-green-500">{formatCurrency(overallTotals.totalIncome)}</p></Card>
          <Card><p className="text-sm text-gray-500 dark:text-gray-400">Total Yearly Expenses</p><p className="text-2xl font-semibold text-red-500">{formatCurrency(overallTotals.totalExpenses)}</p></Card>
          <Card><p className="text-sm text-gray-500 dark:text-gray-400">Yearly Net Balance</p><p className={`text-2xl font-semibold ${overallTotals.netBalance >= 0 ? 'text-blue-500' : 'text-yellow-500'}`}>{formatCurrency(overallTotals.netBalance)}</p></Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center"><LineIcon className="mr-2 text-blue-500"/>Monthly Totals Trend</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yearlySummaryData}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} labelStyle={{ color: '#d1d5db' }}/>
              <Legend />
              <Area type="monotone" dataKey="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
              <Line type="monotone" dataKey="Balance" stroke="#3b82f6" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {comparisonData && (
        <Card>
          <h2 className="text-xl font-semibold mb-4 flex items-center"><TrendingUp className="mr-2 text-blue-500"/>Year-over-Year Comparison</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} labelStyle={{ color: '#d1d5db' }}/>
                <Legend />
                <Bar dataKey={`${comparisonYear} Income`} fill="#10b981" />
                <Bar dataKey={`${parseInt(comparisonYear || '2025') - 1} Income`} fill="#86efac" />
                <Bar dataKey={`${comparisonYear} Expenses`} fill="#ef4444" />
                <Bar dataKey={`${parseInt(comparisonYear || '2025') - 1} Expenses`} fill="#fca5a5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center"><BarChart3 className="mr-2 text-blue-500"/>Total Spending by Category</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyCategoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)"/>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#9ca3af' }}/>
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} labelStyle={{ color: '#d1d5db' }}/>
              <Bar dataKey="Total" fill="#3b82f6" barSize={20}>
                {yearlyCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColors[entry.name as ExpenseCategory] || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default YearlyView;