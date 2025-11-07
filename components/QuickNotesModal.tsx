import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Clock, CheckCircle2, Trash2, StickyNote } from 'lucide-react';
import { QuickNote } from '../types';
import { quickNotesApi } from '../services/quickNotesApi';

interface QuickNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteAdded?: () => void;
}

const QuickNotesModal: React.FC<QuickNotesModalProps> = ({ isOpen, onClose, onNoteAdded }) => {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load notes when modal opens
  useEffect(() => {
    if (isOpen) {
      loadNotes();
      // Focus textarea when modal opens
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const loadNotes = async () => {
    try {
      const allNotes = await quickNotesApi.getAll();
      // Show unprocessed notes first, then processed ones
      const sorted = allNotes.sort((a, b) => {
        if (a.processed !== b.processed) {
          return a.processed ? 1 : -1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setNotes(sorted);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleAddNote = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      await quickNotesApi.create(newNote.trim());
      setNewNote('');
      await loadNotes();
      onNoteAdded?.();
      
      // Show success feedback
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm('Delete this note?')) return;
    
    try {
      await quickNotesApi.delete(id);
      await loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  const unprocessedCount = notes.filter(n => !n.processed).length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Side Panel Bubble */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col rounded-l-2xl border-l border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Quick Notes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {unprocessedCount > 0 ? `${unprocessedCount} pending note${unprocessedCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <StickyNote size={48} className="mx-auto mb-2 opacity-50" />
              <p>No notes yet. Add one below!</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg border ${
                  note.processed
                    ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 opacity-60'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className={`text-sm ${note.processed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-white'}`}>
                      {note.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(note.createdAt)}
                      </span>
                      {note.processed && (
                        <>
                          <CheckCircle2 size={12} className="text-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400">Processed</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    aria-label="Delete note"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleAddNote(e); }} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Quick note... (e.g., 'Coffee $5', 'Lunch $12', 'Gas $40')"
              className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (newNote.trim()) {
                    handleAddNote(e);
                  }
                }
              }}
            />
            <button
              type="submit"
              disabled={!newNote.trim() || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Press Enter to save • Shift+Enter for new line
          </p>
        </form>
      </div>
    </>
  );
};

export default QuickNotesModal;

