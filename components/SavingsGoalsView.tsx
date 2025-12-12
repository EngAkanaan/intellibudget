import React, { useState, useMemo } from 'react';
import Card from './shared/Card';
import type { SavingsGoal, SavingsContribution } from '../types';
import { PlusCircle, Trash2, Target, TrendingUp, DollarSign, X, History } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

interface SavingsGoalsViewProps {
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateSavingsGoal: (goal: SavingsGoal) => void;
  deleteSavingsGoal: (id: string) => void;
  addContribution: (goalId: string, contribution: { amount: number; date: string; notes?: string }) => void;
  categories: string[];
}

const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({
  savingsGoals,
  addSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  addContribution,
  categories,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: '',
  });
  const [contributionForm, setContributionForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const openAddModal = () => {
    setEditingGoal(null);
    setFormState({
      name: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: '',
      category: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setFormState({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: goal.targetDate,
      category: goal.category || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.name || !formState.targetAmount || !formState.targetDate) {
      alert('Please fill in all required fields (Name, Target Amount, and Target Date).');
      return;
    }

    const targetAmount = parseFloat(formState.targetAmount);
    const currentAmount = parseFloat(formState.currentAmount || '0');
    
    if (isNaN(targetAmount) || targetAmount <= 0) {
      alert('Target amount must be a positive number.');
      return;
    }
    
    if (isNaN(currentAmount) || currentAmount < 0) {
      alert('Current amount must be a non-negative number.');
      return;
    }

    const goalData = {
      name: formState.name.trim(),
      targetAmount,
      currentAmount,
      targetDate: formState.targetDate,
      category: formState.category || undefined,
    };

    try {
      if (editingGoal) {
        await updateSavingsGoal({ ...goalData, id: editingGoal.id, contributions: editingGoal.contributions || [] });
      } else {
        await addSavingsGoal(goalData);
      }
      closeModal();
    } catch (error) {
      console.error('Error saving goal:', error);
      // Error is already handled in addSavingsGoal/updateSavingsGoal functions
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const openContributionModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContributionForm({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsContributionModalOpen(true);
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contributionForm.amount) return;

    const contributionAmount = parseFloat(contributionForm.amount);
    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    try {
      await addContribution(selectedGoal.id, {
        amount: contributionAmount,
        date: contributionForm.date,
        notes: contributionForm.notes || undefined,
      });
      
      setIsContributionModalOpen(false);
      setSelectedGoal(null);
      setContributionForm({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch (error) {
      console.error('Error adding contribution:', error);
      // Error is already handled in the addContribution function
    }
  };

  const openHistoryModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setIsHistoryModalOpen(true);
  };

  const goalsWithProgress = useMemo(() => {
    return savingsGoals.map(goal => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const daysRemaining = Math.ceil(
        (new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      const dailyNeeded = daysRemaining > 0 ? (goal.targetAmount - goal.currentAmount) / daysRemaining : 0;
      
      return {
        ...goal,
        progress: Math.min(progress, 100),
        daysRemaining,
        dailyNeeded,
        isOnTrack: dailyNeeded <= 0 || (goal.currentAmount / goal.targetAmount) >= (daysRemaining / 365),
      };
    });
  }, [savingsGoals]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Savings Goals</h1>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <PlusCircle className="mr-2" />
          Add Goal
        </button>
      </div>

      {goalsWithProgress.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Target className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No savings goals set yet.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Create your first goal to start tracking your progress!</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goalsWithProgress.map(goal => (
            <Card key={goal.id} className="relative">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">{goal.name}</h3>
                  {goal.category && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">{goal.category}</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(goal)}
                    className="text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(['Are you sure you want to delete this goal?'])) {
                        deleteSavingsGoal(goal.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                  </span>
                  <span className={`font-semibold ${goal.progress >= 100 ? 'text-green-500' : 'text-blue-500'}`}>
                    {goal.progress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      goal.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Target Date</p>
                  <p className="font-semibold">{new Date(goal.targetDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Days Remaining</p>
                  <p className={`font-semibold ${goal.daysRemaining < 0 ? 'text-red-500' : ''}`}>
                    {goal.daysRemaining < 0 ? 'Overdue' : `${goal.daysRemaining} days`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Remaining</p>
                  <p className="font-semibold">{formatCurrency(goal.targetAmount - goal.currentAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Daily Needed</p>
                  <p className={`font-semibold ${goal.isOnTrack ? 'text-green-500' : 'text-orange-500'}`}>
                    {goal.dailyNeeded > 0 ? formatCurrency(goal.dailyNeeded) : 'On Track!'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => openContributionModal(goal)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={goal.progress >= 100}
                >
                  <DollarSign className="mr-2" size={18} />
                  Add Contribution
                </button>
                {goal.contributions && goal.contributions.length > 0 && (
                  <button
                    onClick={() => openHistoryModal(goal)}
                    className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <History className="mr-2" size={18} />
                    History
                  </button>
                )}
              </div>

              {goal.progress >= 100 && (
                <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                  <TrendingUp className="mx-auto mb-1 text-green-600 dark:text-green-400" size={24} />
                  <p className="text-green-700 dark:text-green-300 font-semibold">Goal Achieved! 🎉</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Contribution Modal */}
      {isContributionModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Add Contribution</h2>
              <button onClick={() => setIsContributionModalOpen(false)} className="text-gray-400 hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Goal: <span className="font-semibold">{selectedGoal.name}</span></p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current: {formatCurrency(selectedGoal.currentAmount)} / {formatCurrency(selectedGoal.targetAmount)}</p>
            </div>
            <form onSubmit={handleContributionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={contributionForm.amount}
                  onChange={(e) => setContributionForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={contributionForm.date}
                  onChange={(e) => setContributionForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Notes (Optional)</label>
                <textarea
                  value={contributionForm.notes}
                  onChange={(e) => setContributionForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="e.g., Monthly savings deposit"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Add Contribution
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* Contribution History Modal */}
      {isHistoryModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Contribution History</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-semibold">{selectedGoal.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Contributions: {formatCurrency(selectedGoal.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0)}
              </p>
            </div>
            <div className="overflow-y-auto flex-1">
              {selectedGoal.contributions && selectedGoal.contributions.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10">
                    <tr className="border-b dark:border-gray-600">
                      <th className="p-3 font-semibold">Date</th>
                      <th className="p-3 font-semibold text-right">Amount</th>
                      <th className="p-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedGoal.contributions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(contrib => (
                      <tr key={contrib.id} className="border-b dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="p-3">{formatDate(contrib.date)}</td>
                        <td className="p-3 text-right font-mono font-semibold text-green-600 dark:text-green-400">
                          +{formatCurrency(contrib.amount)}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">{contrib.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <History className="mx-auto mb-2" size={32} />
                  <p>No contributions yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <Card className="w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{editingGoal ? 'Edit Goal' : 'New Savings Goal'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-200">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Goal Name</label>
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Target Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    name="targetAmount"
                    value={formState.targetAmount}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Current Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    name="currentAmount"
                    value={formState.currentAmount}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Target Date</label>
                <input
                  type="date"
                  name="targetDate"
                  value={formState.targetDate}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Category (Optional)</label>
                <select
                  name="category"
                  value={formState.category}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">None</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SavingsGoalsView;

