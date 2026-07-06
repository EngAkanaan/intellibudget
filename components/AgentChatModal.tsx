import React, { useRef, useCallback } from 'react';
import { Bot, X, Maximize2 } from 'lucide-react';
import { budgetAgentApi } from '../services/budgetAgentApi';
import { quickNotesApi } from '../services/quickNotesApi';
import { agentStore, useAgentMessages } from '../services/agentChatStore';
import { executeAction, friendlyError } from '../utils/agentActions';
import { MessageBubble, ChatInput, buildConversationHistory } from './AgentChatView';
import type { AgentAction, ChatMsg, Expense, IncomeSource, SavingsGoal, RecurringExpense } from '../types';

interface AgentChatModalProps {
  onClose: () => void;
  onOpenFull: () => void;
  addExpense: (month: string, expense: Omit<Expense, 'id'>) => Promise<void>;
  addIncomeSource: (month: string, income: Omit<IncomeSource, 'id'>) => Promise<void>;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'contributions'>) => Promise<void>;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id'>) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  addPaymentMethod: (name: string) => Promise<void>;
  handleSetBudget: (month: string, category: string, amount: number) => Promise<void>;
}

const AgentChatModal: React.FC<AgentChatModalProps> = ({
  onClose,
  onOpenFull,
  addExpense,
  addIncomeSource,
  addSavingsGoal,
  addRecurringExpense,
  addCategory,
  addPaymentMethod,
  handleSetBudget,
}) => {
  const [messages] = useAgentMessages();
  const isSendingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputStateRef = useRef('');
  const [, forceRender] = React.useState(0);
  const expandedRef = useRef<Set<string>>(new Set());
  const listEndRef = useRef<HTMLDivElement>(null);

  const inputText = inputStateRef.current;
  const setInputText = (v: string) => { inputStateRef.current = v; forceRender((n) => n + 1); };
  const isSending = isSendingRef.current;

  React.useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callbacks = { addExpense, addIncomeSource, addSavingsGoal, addRecurringExpense, addCategory, addPaymentMethod, handleSetBudget };

  const handleApplyActions = useCallback(
    async (msgId: string, actions: AgentAction[]) => {
      agentStore.setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, actionStatus: 'applied' } : m))
      );
      const errors: string[] = [];
      for (const action of actions) {
        try { await executeAction(action, callbacks); }
        catch (err) { errors.push(err instanceof Error ? err.message : 'failed'); }
      }
      const prevMsgs = agentStore.getMessages();
      const idx = prevMsgs.findIndex((m) => m.id === msgId);
      const userMsg = idx > 0 ? prevMsgs.slice(0, idx).reverse().find((m) => m.role === 'user') : undefined;
      if (userMsg?.noteId) quickNotesApi.markAsProcessed(userMsg.noteId).catch(() => {});

      const confirmText: ChatMsg = {
        id: `confirm-${Date.now()}`,
        role: 'ai',
        text: errors.length === 0
          ? `Done! ${actions.length} action${actions.length === 1 ? '' : 's'} applied.`
          : `Applied ${actions.length - errors.length}/${actions.length}. Errors: ${errors.join('; ')}`,
      };
      agentStore.setMessages((prev) => [...prev, confirmText]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addExpense, addIncomeSource, addSavingsGoal, addRecurringExpense, addCategory, addPaymentMethod, handleSetBudget]
  );

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSendingRef.current) return;

    setInputText('');
    isSendingRef.current = true;
    forceRender((n) => n + 1);

    const userMsgId = `user-${Date.now()}`;
    const loadingMsgId = `loading-${Date.now()}`;
    const historyForApi = buildConversationHistory(agentStore.getMessages());

    agentStore.setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', text },
      { id: loadingMsgId, role: 'ai', text: '', isLoading: true },
    ]);

    try {
      const note = await quickNotesApi.create(text);
      const response = await budgetAgentApi.parseAndStoreNote({
        noteText: text,
        noteId: note.id,
        messages: historyForApi.length >= 2 ? historyForApi : undefined,
      });

      const needsClarification = (response.missingFields?.length ?? 0) > 0;
      const aiMsg: ChatMsg = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: response.summary || (needsClarification ? 'I need more info.' : 'Done!'),
        actions: needsClarification ? [] : (response.actions ?? []),
        actionStatus: 'pending',
        missingFields: response.missingFields ?? [],
        warnings: response.warnings ?? [],
      };

      agentStore.setMessages((prev) =>
        prev
          .map((m) => (m.id === userMsgId ? { ...m, noteId: note.id } : m))
          .filter((m) => m.id !== loadingMsgId)
          .concat([aiMsg])
      );
    } catch (err) {
      agentStore.setMessages((prev) =>
        prev.filter((m) => m.id !== loadingMsgId).concat([
          { id: `err-${Date.now()}`, role: 'ai', text: `⚠ ${friendlyError(err)}` },
        ])
      );
    } finally {
      isSendingRef.current = false;
      forceRender((n) => n + 1);
      inputRef.current?.focus();
    }
  };

  const toggleExpand = (msgId: string) => {
    const next = new Set(expandedRef.current);
    next.has(msgId) ? next.delete(msgId) : next.add(msgId);
    expandedRef.current = next;
    forceRender((n) => n + 1);
  };

  // Show only the last 8 messages in the compact modal
  const visibleMessages = messages.slice(-8);

  return (
    <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white flex-shrink-0">
        <Bot size={18} />
        <span className="font-semibold text-sm flex-1">AI Budget Agent</span>
        <button
          onClick={onOpenFull}
          title="Open full view"
          className="p-1 rounded hover:bg-blue-500 transition-colors"
        >
          <Maximize2 size={15} />
        </button>
        <button
          onClick={onClose}
          title="Close"
          className="p-1 rounded hover:bg-blue-500 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-900/50" style={{ maxHeight: '420px', minHeight: '200px' }}>
        {visibleMessages.length === 0 && (
          <p className="text-xs text-gray-400 text-center pt-4">
            Start chatting — tell me what you spent, earned, or want to save for.
          </p>
        )}
        {visibleMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            expanded={expandedRef.current.has(msg.id)}
            onToggleExpand={toggleExpand}
            onApply={handleApplyActions}
            onDismiss={(id) =>
              agentStore.setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, actionStatus: 'dismissed' } : m))
              )
            }
          />
        ))}
        <div ref={listEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        inputRef={inputRef}
        value={inputText}
        onChange={setInputText}
        onSend={handleSend}
        disabled={isSending}
        compact
      />
    </div>
  );
};

export default AgentChatModal;
