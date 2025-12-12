import React, { useState } from 'react';
import Card from './shared/Card';
import type { RecurringExpense, ExpenseCategory, RecurringExpenseTemplate } from '../types';
import { PlusCircle, Trash2, Repeat, Save, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface RecurringViewProps {
    recurringExpenses: RecurringExpense[];
    addRecurringExpense: (expense: Omit<RecurringExpense, 'id'>) => void;
    deleteRecurringExpense: (id: string) => void;
    categories: string[];
    paymentMethods: string[];
    templates: RecurringExpenseTemplate[];
    addTemplate: (template: Omit<RecurringExpenseTemplate, 'id'>) => void;
    deleteTemplate: (id: string) => void;
}

const RecurringView: React.FC<RecurringViewProps> = ({ recurringExpenses, addRecurringExpense, deleteRecurringExpense, categories, paymentMethods, templates, addTemplate, deleteTemplate }) => {
    const [formState, setFormState] = useState({
        description: '',
        amount: '',
        category: categories[0] || 'Other',
        dayOfMonth: '1',
        startDate: new Date().toISOString().slice(0, 7), // YYYY-MM
        paymentMethod: paymentMethods[0] || '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.description || !formState.amount || !formState.dayOfMonth) {
            alert('Please fill out all fields.');
            return;
        }

        const day = parseInt(formState.dayOfMonth, 10);
        if (day < 1 || day > 31) {
            alert('Day of month must be between 1 and 31.');
            return;
        }

        const amount = parseFloat(formState.amount);
        if (isNaN(amount) || amount <= 0) {
            alert('Amount must be a positive number.');
            return;
        }

        try {
            await addRecurringExpense({
                description: formState.description.trim(),
                amount,
                category: formState.category as ExpenseCategory,
                dayOfMonth: day,
                startDate: formState.startDate,
                paymentMethod: formState.paymentMethod || undefined,
            });

            // Reset form only on success
            setFormState({
                description: '',
                amount: '',
                category: categories[0] || 'Other',
                dayOfMonth: '1',
                startDate: new Date().toISOString().slice(0, 7),
                paymentMethod: paymentMethods[0] || '',
            });
        } catch (error) {
            console.error('Error adding recurring expense:', error);
            // Error is already handled in addRecurringExpense function
        }
    };

    const handleSaveAsTemplate = () => {
        if (!formState.description || !formState.amount || !formState.dayOfMonth) {
            alert('Please fill out all required fields before saving as template.');
            return;
        }
        const day = parseInt(formState.dayOfMonth, 10);
        if (day < 1 || day > 31) {
            alert('Day of month must be between 1 and 31.');
            return;
        }
        addTemplate({
            name: formState.description,
            description: formState.description,
            amount: parseFloat(formState.amount),
            category: formState.category as ExpenseCategory,
            dayOfMonth: day,
            paymentMethod: formState.paymentMethod || undefined,
        });
        alert('Template saved!');
    };

    const handleUseTemplate = (template: RecurringExpenseTemplate) => {
        setFormState({
            description: template.description,
            amount: template.amount.toString(),
            category: template.category,
            dayOfMonth: template.dayOfMonth.toString(),
            startDate: new Date().toISOString().slice(0, 7),
            paymentMethod: template.paymentMethod || paymentMethods[0] || '',
        });
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this recurring transaction? This will also remove all expenses it has generated.')) {
            deleteRecurringExpense(id);
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Recurring Transactions</h1>

            {templates.length > 0 && (
                <Card>
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <FileText className="mr-2" size={20} />
                        Templates
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {templates.map(template => (
                            <div key={template.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center">
                                <div className="flex-1">
                                    <p className="font-semibold">{template.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatCurrency(template.amount)} • Day {template.dayOfMonth} • {template.category}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleUseTemplate(template)}
                                        className="text-blue-500 hover:text-blue-700"
                                        title="Use template"
                                    >
                                        <PlusCircle size={18} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Delete this template?')) {
                                                deleteTemplate(template.id);
                                            }
                                        }}
                                        className="text-red-500 hover:text-red-700"
                                        title="Delete template"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h2 className="text-2xl font-semibold mb-4">Add Recurring Expense</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Description</label>
                            <input
                                type="text"
                                name="description"
                                value={formState.description}
                                onChange={handleInputChange}
                                placeholder="e.g., Netflix Subscription"
                                className="mt-1 block w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-400">Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                name="amount"
                                value={formState.amount}
                                onChange={handleInputChange}
                                placeholder="0.00"
                                className="mt-1 block w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400">Category</label>
                            <select
                                name="category"
                                value={formState.category}
                                onChange={handleInputChange}
                                className="mt-1 block w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        {paymentMethods.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Payment Method</label>
                                <select
                                    name="paymentMethod"
                                    value={formState.paymentMethod}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">None</option>
                                    {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Day of Month</label>
                                <input
                                    type="number"
                                    name="dayOfMonth"
                                    min="1"
                                    max="31"
                                    value={formState.dayOfMonth}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">Start Date</label>
                                <input
                                    type="month"
                                    name="startDate"
                                    value={formState.startDate}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full p-2 rounded-md bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 flex justify-center items-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            <PlusCircle size={20} className="mr-2"/> Add Transaction
                        </button>
                            <button 
                                type="button"
                                onClick={handleSaveAsTemplate}
                                className="flex items-center justify-center py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                                title="Save as template"
                            >
                                <Save size={20} />
                            </button>
                        </div>
                    </form>
                </Card>
                <Card className="lg:col-span-2">
                    <h2 className="text-2xl font-semibold mb-4">Current Recurring Transactions</h2>
                    <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
                        {recurringExpenses.length > 0 ? (
                            recurringExpenses.sort((a,b) => a.dayOfMonth - b.dayOfMonth).map(rec => (
                                <div key={rec.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-bold">{rec.description}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatCurrency(rec.amount)} in <span className="font-semibold">{rec.category}</span> on day {rec.dayOfMonth}
                                            , starting {new Date(rec.startDate + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <button onClick={() => handleDelete(rec.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <Repeat size={48} className="mx-auto mb-4"/>
                                <p>No recurring transactions set up yet.</p>
                                <p className="text-sm">Add one to automate your monthly entries!</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default RecurringView;