import { supabase } from '../lib/supabase';
import type { AgentNoteStatus, AgentParseResult, QuickNote } from '../types';

const STORAGE_KEY = 'intellibudget_quick_notes';
const MIGRATION_FLAG_PREFIX = 'intellibudget_agent_notes_migrated_';

type AgentNoteRow = {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  processed: boolean;
  processed_at: string | null;
  agent_result: AgentParseResult | null;
  agent_status: AgentNoteStatus;
};

const isUuid = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

const isMissingTableError = (error: { code?: string; message?: string }): boolean =>
  error.code === '42P01' ||
  error.code === 'PGRST205' ||
  (error.message?.includes('agent_notes') ?? false);

const rowToNote = (row: AgentNoteRow): QuickNote => ({
  id: row.id,
  text: row.text,
  createdAt: row.created_at,
  processed: row.processed,
  processedAt: row.processed_at ?? undefined,
  agentStatus: row.agent_status,
  agentResult: row.agent_result ?? undefined,
});

const getLocalNotes = (): QuickNote[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as QuickNote[];
  } catch {
    return [];
  }
};

const setLocalNotes = (notes: QuickNote[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
};

const sortNotes = (notes: QuickNote[]): QuickNote[] =>
  [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

const getUserId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
};

const migrationFlagKey = (userId: string) => `${MIGRATION_FLAG_PREFIX}${userId}`;

const migrateLocalNotesToSupabase = async (userId: string): Promise<void> => {
  if (localStorage.getItem(migrationFlagKey(userId))) return;

  const localNotes = getLocalNotes();
  if (localNotes.length === 0) {
    localStorage.setItem(migrationFlagKey(userId), '1');
    return;
  }

  const rows = localNotes.map((note) => ({
    user_id: userId,
    text: note.text,
    created_at: note.createdAt,
    processed: note.processed,
    processed_at: note.processedAt ?? null,
    agent_result: note.agentResult ?? null,
    agent_status: (note.processed ? 'applied' : note.agentStatus ?? 'raw') as AgentNoteStatus,
  }));

  const { error } = await supabase.from('agent_notes').insert(rows);
  if (error) throw error;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(migrationFlagKey(userId), '1');
};

const fetchFromSupabase = async (userId: string): Promise<QuickNote[] | null> => {
  try {
    await migrateLocalNotesToSupabase(userId);

    const { data, error } = await supabase
      .from('agent_notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingTableError(error)) return null;
      throw error;
    }

    return sortNotes((data as AgentNoteRow[]).map(rowToNote));
  } catch (err) {
    const error = err as { code?: string; message?: string };
    if (isMissingTableError(error)) return null;
    console.error('Supabase agent_notes fetch failed:', err);
    return null;
  }
};

const useSupabase = async (): Promise<boolean> => {
  const userId = await getUserId();
  if (!userId) return false;
  const notes = await fetchFromSupabase(userId);
  return notes !== null;
};

export const quickNotesApi = {
  async getAll(): Promise<QuickNote[]> {
    const userId = await getUserId();
    if (userId) {
      const remote = await fetchFromSupabase(userId);
      if (remote !== null) return remote;
    }

    return sortNotes(getLocalNotes());
  },

  async create(text: string): Promise<QuickNote> {
    const userId = await getUserId();

    if (userId) {
      const { data, error } = await supabase
        .from('agent_notes')
        .insert({
          user_id: userId,
          text,
          processed: false,
          agent_status: 'raw',
        })
        .select()
        .single();

      if (!error && data) {
        return rowToNote(data as AgentNoteRow);
      }

      if (error && !isMissingTableError(error)) {
        console.error('Supabase agent_notes create failed, using localStorage:', error);
      }
    }

    const note: QuickNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      text,
      createdAt: new Date().toISOString(),
      processed: false,
      agentStatus: 'raw',
    };

    setLocalNotes([note, ...getLocalNotes()]);
    return note;
  },

  async delete(id: string): Promise<void> {
    const userId = await getUserId();

    if (userId && isUuid(id)) {
      const { error } = await supabase.from('agent_notes').delete().eq('id', id);
      if (!error) return;
      if (error && !isMissingTableError(error)) {
        console.error('Supabase agent_notes delete failed:', error);
        throw error;
      }
    }

    setLocalNotes(getLocalNotes().filter((note) => note.id !== id));
  },

  async markAsProcessed(id: string): Promise<void> {
    const processedAt = new Date().toISOString();
    await this.update(id, {
      processed: true,
      processedAt,
      agentStatus: 'applied',
    });
  },

  async update(id: string, updates: Partial<QuickNote>): Promise<void> {
    const userId = await getUserId();

    if (userId && isUuid(id)) {
      const payload: Record<string, unknown> = {};
      if (updates.text !== undefined) payload.text = updates.text;
      if (updates.processed !== undefined) payload.processed = updates.processed;
      if (updates.processedAt !== undefined) payload.processed_at = updates.processedAt;
      if (updates.agentStatus !== undefined) payload.agent_status = updates.agentStatus;
      if (updates.agentResult !== undefined) payload.agent_result = updates.agentResult;

      if (Object.keys(payload).length > 0) {
        const { error } = await supabase.from('agent_notes').update(payload).eq('id', id);
        if (!error) return;
        if (error && !isMissingTableError(error)) {
          console.error('Supabase agent_notes update failed:', error);
          throw error;
        }
      } else {
        return;
      }
    }

    setLocalNotes(
      getLocalNotes().map((note) => (note.id === id ? { ...note, ...updates } : note))
    );
  },

  /** Whether notes are syncing via Supabase (table exists + user signed in). */
  async isRemoteSyncEnabled(): Promise<boolean> {
    const userId = await getUserId();
    if (!userId) return false;
    return useSupabase();
  },
};
