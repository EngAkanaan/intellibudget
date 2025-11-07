import React, { useState, useRef, useEffect } from 'react';
import Card from './shared/Card';
import type { MonthlyData } from '../types';
import { PlusCircle, Trash2 } from 'lucide-react';

interface BudgetsViewProps {
    categories: string[];
    addCategory: (category: string) => void;
    deleteCategory: (category: string) => void;
    data: MonthlyData[];
    budgets: { [month: string]: { [category: string]: number } };
    setBudget: (month: string, category: string, amount: number) => void;
    paymentMethods: string[];
    paymentMethodColors: { [key: string]: string };
    addPaymentMethod: (method: string) => void;
    deletePaymentMethod: (method: string) => void;
}

// Helper function to get current month in YYYY-MM format
const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
};

const BudgetsView: React.FC<BudgetsViewProps> = ({ categories, addCategory, deleteCategory, data, budgets, setBudget, paymentMethods, paymentMethodColors, addPaymentMethod, deletePaymentMethod }) => {
    const [newCategory, setNewCategory] = useState('');
    const [newPaymentMethod, setNewPaymentMethod] = useState('');
    // Get current month or fallback to last month in data if current month doesn't exist
    const currentMonth = getCurrentMonth();
    const defaultMonth = data.find(m => m.month === currentMonth)?.month || data[data.length-1]?.month || '';
    const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
    
    // Local state for budget inputs to update UI immediately
    const [localBudgets, setLocalBudgets] = useState<{ [category: string]: string }>({});
    const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});
    
    // Sync local budgets with prop budgets when selectedMonth changes
    useEffect(() => {
        const monthBudgets = budgets[selectedMonth] || {};
        const local: { [category: string]: string } = {};
        categories.forEach(cat => {
            local[cat] = monthBudgets[cat] ? monthBudgets[cat].toString() : '';
        });
        setLocalBudgets(local);
    }, [selectedMonth, budgets, categories]);

    const handleAddCategory = () => {
        if (newCategory.trim()) {
            addCategory(newCategory.trim());
            setNewCategory('');
        }
    };

    const handleDeleteCategory = (category: string) => {
        if (category === 'Other') {
            alert("The 'Other' category cannot be deleted.");
            return;
        }
        if (window.confirm(`Are you sure you want to delete the "${category}" category? All existing expenses under this category will be moved to 'Other'.`)) {
            deleteCategory(category);
        }
    }
    
    const handleBudgetChange = (category: string, value: string) => {
        // Update local state immediately for responsive UI
        setLocalBudgets(prev => ({
            ...prev,
            [category]: value
        }));
        
        // Clear existing debounce timer for this category
        if (debounceTimers.current[category]) {
            clearTimeout(debounceTimers.current[category]);
        }
        
        // Debounce the API call - wait 800ms after user stops typing
        debounceTimers.current[category] = setTimeout(() => {
            const amount = parseFloat(value) || 0;
            setBudget(selectedMonth, category, amount);
        }, 800);
    };
    
    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            Object.values(debounceTimers.current).forEach(timer => {
                if (timer) clearTimeout(timer);
            });
        };
    }, []);

    const handleAddPaymentMethod = () => {
        if (newPaymentMethod.trim()) {
            addPaymentMethod(newPaymentMethod.trim());
            setNewPaymentMethod('');
        }
    };

    const handleDeletePaymentMethod = (method: string) => {
        if (window.confirm(`Are you sure you want to delete the "${method}" payment method?`)) {
            deletePaymentMethod(method);
        }
    };

    const currentMonthBudgets = budgets[selectedMonth] || {};

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Budgets &amp; Categories</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-2xl font-semibold mb-4">Manage Categories</h2>
                    <div className="space-y-4">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="New category name"
                                className="flex-grow p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button onClick={handleAddCategory} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <PlusCircle size={20} className="mr-2"/> Add
                            </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                            {categories.map(cat => (
                                <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <span className="font-medium">{cat}</span>
                                    {cat !== 'Other' && (
                                        <button onClick={() => handleDeleteCategory(cat)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <h2 className="text-2xl font-semibold">Set Monthly Budgets</h2>
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
                    </div>
                    <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
                        {categories.map(cat => (
                            <div key={cat} className="flex items-center justify-between">
                                <label className="font-medium flex-shrink-0 mr-4">{cat}</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={localBudgets[cat] !== undefined ? localBudgets[cat] : (currentMonthBudgets[cat] || '')}
                                        onChange={(e) => handleBudgetChange(cat, e.target.value)}
                                        onBlur={(e) => {
                                            // Save immediately when user leaves the field
                                            const amount = parseFloat(e.target.value) || 0;
                                            if (debounceTimers.current[cat]) {
                                                clearTimeout(debounceTimers.current[cat]);
                                            }
                                            setBudget(selectedMonth, cat, amount);
                                        }}
                                        className="w-40 p-2 pl-7 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <Card>
                <h2 className="text-2xl font-semibold mb-4">Manage Payment Methods</h2>
                <div className="space-y-4">
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newPaymentMethod}
                            onChange={(e) => setNewPaymentMethod(e.target.value)}
                            placeholder="New payment method name"
                            className="flex-grow p-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button onClick={handleAddPaymentMethod} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <PlusCircle size={20} className="mr-2"/> Add
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                        {paymentMethods.map(method => (
                            <div key={method} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div 
                                        className="w-4 h-4 rounded-full" 
                                        style={{ backgroundColor: paymentMethodColors[method] || '#6b7280' }}
                                    ></div>
                                    <span className="font-medium">{method}</span>
                                </div>
                                <button onClick={() => handleDeletePaymentMethod(method)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default BudgetsView;
