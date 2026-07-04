import { supabase } from '../lib/supabase';
import type { BudgetAgentParseRequest, BudgetAgentParseResponse } from '../types';

export const budgetAgentApi = {
  /**
   * Parse a note via the budget-agent-parse Edge Function (Gemini runs server-side).
   * When noteId is included, the function also saves agent_result on agent_notes.
   */
  async parseNote(request: BudgetAgentParseRequest): Promise<BudgetAgentParseResponse> {
    const { data, error } = await supabase.functions.invoke<BudgetAgentParseResponse>(
      'budget-agent-parse',
      { body: request }
    );

    if (error) {
      throw new Error(error.message || 'Budget agent request failed');
    }

    const payload = data as BudgetAgentParseResponse & { error?: string };
    if (payload?.error) {
      throw new Error(payload.error);
    }

    if (!payload || !Array.isArray(payload.actions)) {
      throw new Error('Invalid response from budget agent');
    }

    return {
      actions: payload.actions,
      missingFields: payload.missingFields ?? [],
      warnings: payload.warnings ?? [],
      suggestions: payload.suggestions ?? [],
      summary: payload.summary,
    };
  },

  /** Alias: parse and persist on the note row (handled server-side when noteId is set). */
  async parseAndStoreNote(
    request: BudgetAgentParseRequest & { noteId: string }
  ): Promise<BudgetAgentParseResponse> {
    return this.parseNote(request);
  },
};
