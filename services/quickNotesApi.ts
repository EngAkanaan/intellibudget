import { supabase } from '../lib/supabase';
import { QuickNote } from '../types';

// For now, we'll use localStorage as a simple solution
// In the future, this can be migrated to Supabase for sync across devices

const STORAGE_KEY = 'intellibudget_quick_notes';

export const quickNotesApi = {
  async getAll(): Promise<QuickNote[]> {
    try {
      // Try Supabase first (for future sync)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // TODO: Implement Supabase table for quick_notes
        // For now, fall back to localStorage
      }
      
      // Use localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const notes: QuickNote[] = JSON.parse(stored);
      return notes.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error loading quick notes:', error);
      return [];
    }
  },

  async create(text: string): Promise<QuickNote> {
    const note: QuickNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      createdAt: new Date().toISOString(),
      processed: false,
    };

    const existing = await this.getAll();
    const updated = [note, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return note;
  },

  async delete(id: string): Promise<void> {
    const existing = await this.getAll();
    const updated = existing.filter(note => note.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  async markAsProcessed(id: string): Promise<void> {
    const existing = await this.getAll();
    const updated = existing.map(note => 
      note.id === id 
        ? { ...note, processed: true, processedAt: new Date().toISOString() }
        : note
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  async update(id: string, updates: Partial<QuickNote>): Promise<void> {
    const existing = await this.getAll();
    const updated = existing.map(note => 
      note.id === id ? { ...note, ...updates } : note
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },
};

