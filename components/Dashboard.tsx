import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector, ComposedChart } from 'recharts';
import type { MonthlyData, Expense, ExpenseCategory } from '../types';
import Card from './shared/Card';
import { MONTH_NAMES } from '../constants';
import { formatCurrency, formatDate } from '../utils/formatters';
import { TrendingUp, TrendingDown, PieChart as PieIcon, List, BarChart3, Calendar } from 'lucide-react';

interface DashboardProps {
  data: MonthlyData[];
  categoryColors: { [key: string]: string };
}

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#999">
        {`${formatCurrency(value)}`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ data, categoryColors }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  const summary = useMemo(() => {
    const totalIncome = data.reduce((sum, month) => sum + month.salary, 0);
    const allExpenses = data.flatMap(month => month.expenses);
    const totalExpenses = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    const categorySpending = allExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as { [key in ExpenseCategory]: number });

    const top5Expenses = [...allExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

    return { totalIncome, totalExpenses, balance, categorySpending, top5Expenses };
  }, [data]);

  const monthlyChartData = useMemo(() => {
    return data.map(monthData => {
      const monthIndex = parseInt(monthData.month.split('-')[1], 10) - 1;
      const year = monthData.month.split('-')[0];
      const totalExpenses = monthData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        name: `${MONTH_NAMES[monthIndex]} '${year.slice(2)}`,
        Income: monthData.salary,
        Expenses: totalExpenses,
        Balance: monthData.salary - totalExpenses
      };
    });
  }, [data]);

  const pieChartData = useMemo(() => {
    return Object.entries(summary.categorySpending).map(([name, value]) => ({
      name: name as ExpenseCategory,
      value,
    })).sort((a,b) => Number(b.value) - Number(a.value));
  }, [summary.categorySpending]);

  const heatmapData = useMemo(() => {
    const dayOfWeekTotals: { [key: string]: number } = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
    data.forEach(monthData => {
      monthData.expenses.forEach(expense => {
        const date = new Date(expense.date);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        dayOfWeekTotals[dayName] = (dayOfWeekTotals[dayName] || 0) + expense.amount;
      });
    });
    return Object.entries(dayOfWeekTotals).map(([day, total]) => ({ day, total }));
  }, [data]);

  const heatmapCells = useMemo(() => {
    const dayOfWeekTotals: { [key: string]: number } = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
    data.forEach(monthData => {
      monthData.expenses.forEach(expense => {
        const date = new Date(expense.date);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        dayOfWeekTotals[dayName] = (dayOfWeekTotals[dayName] || 0) + expense.amount;
      });
    });
    const maxValue = Math.max(...Object.values(dayOfWeekTotals));
    return Object.entries(dayOfWeekTotals).map(([day, total], idx) => {
      const intensity = maxValue > 0 ? total / maxValue : 0;
      const color = `rgba(59, 130, 246, ${0.3 + intensity * 0.7})`;
      return <Cell key={`cell-${idx}`} fill={color} />;
    });
  }, [data]);
  
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  // FIX: The version of @types/recharts seems to be outdated and is missing the 'activeIndex' prop on the Pie component.
  // Casting Pie to `any` to bypass the TypeScript error, as the prop is functionally correct.
  const PieWithActiveIndex = Pie as any;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <TrendingUp className="text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
              <p className="text-2xl font-semibold">{formatCurrency(summary.totalIncome)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <TrendingDown className="text-red-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-semibold">{formatCurrency(summary.totalExpenses)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${summary.balance >= 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-yellow-100 dark:bg-yellow-900'}`}>
              <div className={`${summary.balance >= 0 ? 'text-blue-500' : 'text-yellow-500'}`}>💰</div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Net Balance</p>
              <p className={`text-2xl font-semibold ${summary.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(summary.balance)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <h2 className="text-xl font-semibold mb-4 flex items-center"><BarChart3 className="mr-2 text-blue-500"/>Monthly Trends</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.8)',
                    borderColor: '#4b5563'
                  }}
                  labelStyle={{ color: '#d1d5db' }}
                />
                <Legend />
                <Bar dataKey="Income" fill="#10b981" />
                <Bar dataKey="Expenses" fill="#ef4444" />
                <Bar dataKey="Balance" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 flex items-center"><PieIcon className="mr-2 text-blue-500"/>Category Spending</h2>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                 <PieWithActiveIndex
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[entry.name]} />
                  ))}
                </PieWithActiveIndex>
                 <Legend wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center"><List className="mr-2 text-blue-500"/>Top 5 Expenses</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="border-b dark:border-gray-700">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Notes</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {summary.top5Expenses.map(expense => (
                <tr key={expense.id} className="border-b dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-3">{formatDate(expense.date)}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full" style={{backgroundColor: `${categoryColors[expense.category]}20`, color: categoryColors[expense.category]}}>{expense.category}</span>
                  </td>
                  <td className="p-3 text-gray-500 dark:text-gray-400">{expense.notes}</td>
                  <td className="p-3 text-right font-mono font-semibold">{formatCurrency(expense.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center"><Calendar className="mr-2 text-blue-500"/>Spending Heatmap (by Day of Week)</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={heatmapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4b5563' }} labelStyle={{ color: '#d1d5db' }}/>
              <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {heatmapCells}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;