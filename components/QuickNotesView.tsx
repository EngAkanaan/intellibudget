import React, { useState, useEffect } from 'react';
import Card from './shared/Card';
import { MessageSquare, CheckCircle2, Trash2, Plus, X } from 'lucide-react';
import { QuickNote } from '../types';
import { quickNotesApi } from '../services/quickNotesApi';
import { formatCurrency } from '../utils/formatters';

interface QuickNotesViewProps {
  categories: string[];
  paymentMethods: string[];
  onAddExpense: (month: string, expense: { date: string; category: string; amount: number; notes: string; paymentMethod?: string }) => Promise<void>;
}

const QuickNotesView: React.FC<QuickNotesViewProps> = ({ 
  categories, 
  paymentMethods, 
  onAddExpense 
}) => {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<QuickNote | null>(null);
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: categories[0] || '',
    amount: '',
    notes: '',
    paymentMethod: paymentMethods[0] || '',
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const allNotes = await quickNotesApi.getAll();
    // Show only unprocessed notes
    const unprocessed = allNotes.filter(n => !n.processed);
    setNotes(unprocessed);
  };

  const handleProcessNote = (note: QuickNote) => {
    setSelectedNote(note);
    
    // Try to extract amount from note text (simple regex)
    const amountMatch = note.text.match(/\$?(\d+\.?\d*)/);
    if (amountMatch) {
      setFormData(prev => ({
        ...prev,
        amount: amountMatch[1],
        notes: note.text,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        notes: note.text,
      }));
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNote || !formData.amount || !formData.category) return;

    setProcessing(true);
    try {
      // Get month from date (YYYY-MM-DD -> YYYY-MM)
      const month = formData.date.substring(0, 7);
      
      await onAddExpense(month, {
        date: formData.date,
        category: formData.category,
        amount: parseFloat(formData.amount),
        notes: formData.notes,
        paymentMethod: formData.paymentMethod || undefined,
      });

      // Mark note as processed
      await quickNotesApi.markAsProcessed(selectedNote.id);
      
      // Reload notes
      await loadNotes();
      
      // Reset form
      setSelectedNote(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: categories[0] || '',
        amount: '',
        notes: '',
        paymentMethod: paymentMethods[0] || '',
      });

      alert('✅ Expense added successfully!');
    } catch (error) {
      console.error('Error processing note:', error);
      alert('Failed to add expense. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Delete this note?')) return;
    
    try {
      await quickNotesApi.delete(id);
      await loadNotes();
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
          <MessageSquare className="text-blue-500" size={32} />
          Process Quick Notes
        </h1>
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold">
          {notes.length} pending
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes List */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">Pending Notes</h2>
          {notes.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <CheckCircle2 size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-lg">All caught up! 🎉</p>
              <p className="text-sm mt-2">No pending notes to process.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedNote?.id === note.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                  onClick={() => handleProcessNote(note)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-gray-800 dark:text-white font-medium mb-2">
                        {note.text}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(note.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      aria-label="Delete note"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Process Note Form */}
        <Card>
          <h2 className="text-2xl font-semibold mb-4">
            {selectedNote ? 'Add as Expense' : 'Select a note to process'}
          </h2>

          {selectedNote ? (
            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {paymentMethods.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={processing || !formData.amount || !formData.category}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Plus size={18} />
                  {processing ? 'Adding...' : 'Add Expense'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNote(null);
                    setFormData({
                      date: new Date().toISOString().split('T')[0],
                      category: categories[0] || '',
                      amount: '',
                      notes: '',
                      paymentMethod: paymentMethods[0] || '',
                    });
                  }}
                  className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
              <p>Select a note from the list to convert it into an expense.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default QuickNotesView;

