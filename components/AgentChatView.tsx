import React, { useEffect, useRef, useCallback } from 'react';
import { Bot, Send, CheckCircle, ChevronDown, ChevronUp, LoaderCircle, Sparkles } from 'lucide-react';
import { budgetAgentApi } from '../services/budgetAgentApi';
import { quickNotesApi } from '../services/quickNotesApi';
import { agentStore, useAgentMessages } from '../services/agentChatStore';
import { executeAction, friendlyError } from '../utils/agentActions';
import { formatCurrency } from '../utils/formatters';
import type { AgentAction, ChatMsg, ConversationTurn, Expense, IncomeSource, SavingsGoal, RecurringExpense } from '../types';

interface AgentChatViewProps {
  addExpense: (month: string, expense: Omit<Expense, 'id'>) => Promise<void>;
  addIncomeSource: (month: string, income: Omit<IncomeSource, 'id'>) => Promise<void>;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'contributions'>) => Promise<void>;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id'>) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  addPaymentMethod: (name: string) => Promise<void>;
  handleSetBudget: (month: string, category: string, amount: number) => Promise<void>;
  categories: string[];
  paymentMethods: string[];
}

export function formatActionPreview(action: AgentAction): string {
  const p = action.payload;
  switch (action.type) {
    case 'createExpense':
      return `Add ${formatCurrency(p.amount as number)} expense in ${p.category}${p.notes ? ` — ${p.notes}` : ''}`;
    case 'createIncome':
      return `Record ${formatCurrency(p.amount as number)} income — ${p.description || 'Income'}`;
    case 'createSavingGoal':
      return `Create savings goal "${p.name}" — target ${formatCurrency(p.targetAmount as number)}`;
    case 'createRecurringPayment':
      return `Set up recurring "${p.description}" — ${formatCurrency(p.amount as number)}/month`;
    case 'createCategory':
      return `Add category "${p.name}"`;
    case 'createPaymentMethod':
      return `Add payment method "${p.name}"`;
    case 'createBudget':
      return `Set ${p.category} budget to ${formatCurrency(p.amount as number)}`;
    case 'createFinancialNote':
      return `Save financial note`;
    default:
      return action.type;
  }
}

export function buildConversationHistory(msgs: ChatMsg[]): ConversationTurn[] {
  return msgs
    .filter((m) => !m.isLoading && m.id !== 'welcome' && m.text.trim().length > 0)
    .slice(-14)
    .map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      text: m.text,
    }));
}

const WELCOME: ChatMsg = {
  id: 'welcome',
  role: 'ai',
  text: "Hi! I'm your AI Budget Agent. Tell me what you spent, earned, or want to track — and I'll handle the rest.\n\nTry: \"chicken $5\", \"got paid $800 from Paramarche\", \"new goal: travel to Egypt $1200\", or \"subscribed to Netflix $15\".",
};

const AgentChatView: React.FC<AgentChatViewProps> = ({
  addExpense,
  addIncomeSource,
  addSavingsGoal,
  addRecurringExpense,
  addCategory,
  addPaymentMethod,
  handleSetBudget,
}) => {
  const [messages, setMessages] = useAgentMessages();
  const isSendingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputStateRef = useRef('');
  const [, forceRender] = React.useState(0);
  const expandedActionsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const inputText = inputStateRef.current;
  const setInputText = (v: string) => {
    inputStateRef.current = v;
    forceRender((n) => n + 1);
  };
  const isSending = isSendingRef.current;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load history from DB only on first mount (when store is empty)
  useEffect(() => {
    if (agentStore.isInitialized()) return;

    const load = async () => {
      try {
        const notes = await quickNotesApi.getAll();
        const msgs: ChatMsg[] = [WELCOME];
        for (const note of notes.slice(0, 10).reverse()) {
          msgs.push({ id: note.id, role: 'user', text: note.text, noteId: note.id });
          if (note.agentResult?.summary) {
            msgs.push({
              id: `${note.id}-ai`,
              role: 'ai',
              text: note.agentResult.summary,
              actions: note.agentResult.actions ?? [],
              actionStatus: note.processed ? 'applied' : 'pending',
              missingFields: note.agentResult.missingFields ?? [],
              warnings: note.agentResult.warnings ?? [],
            });
          }
        }
        agentStore.setMessages(msgs);
      } catch {
        agentStore.setMessages([WELCOME]);
      }
    };

    load();
  }, []);

  const callbacks = { addExpense, addIncomeSource, addSavingsGoal, addRecurringExpense, addCategory, addPaymentMethod, handleSetBudget };

  const handleApplyActions = useCallback(
    async (msgId: string, actions: AgentAction[]) => {
      agentStore.setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, actionStatus: 'applied' } : m))
      );

      const errors: string[] = [];
      for (const action of actions) {
        try {
          await executeAction(action, callbacks);
        } catch (err) {
          errors.push(`${action.type}: ${err instanceof Error ? err.message : 'failed'}`);
        }
      }

      const prevMsgs = agentStore.getMessages();
      const idx = prevMsgs.findIndex((m) => m.id === msgId);
      const userMsg = idx > 0 ? prevMsgs.slice(0, idx).reverse().find((m) => m.role === 'user') : undefined;
      if (userMsg?.noteId) quickNotesApi.markAsProcessed(userMsg.noteId).catch(() => {});

      agentStore.setMessages((prev) => [
        ...prev,
        {
          id: `confirm-${Date.now()}`,
          role: 'ai',
          text:
            errors.length === 0
              ? `Done! ${actions.length} action${actions.length === 1 ? '' : 's'} applied.`
              : `Applied ${actions.length - errors.length}/${actions.length}. Errors: ${errors.join('; ')}`,
        },
      ]);
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
        text: response.summary || (needsClarification ? 'I need more info to proceed.' : 'Done!'),
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
    const next = new Set(expandedActionsRef.current);
    next.has(msgId) ? next.delete(msgId) : next.add(msgId);
    expandedActionsRef.current = next;
    forceRender((n) => n + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">AI Budget Agent</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chat to record expenses, income, savings goals, recurring payments &amp; more
          </p>
        </div>
      </div>

      <div
        className="flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700"
        style={{ height: 'calc(100vh - 220px)', minHeight: '480px' }}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              expanded={expandedActionsRef.current.has(msg.id)}
              onToggleExpand={toggleExpand}
              onApply={handleApplyActions}
              onDismiss={(id) =>
                agentStore.setMessages((prev) =>
                  prev.map((m) => (m.id === id ? { ...m, actionStatus: 'dismissed' } : m))
                )
              }
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          inputRef={inputRef}
          value={inputText}
          onChange={setInputText}
          onSend={handleSend}
          disabled={isSending}
        />
      </div>
    </div>
  );
};

// ─── Shared sub-components (also used by AgentChatModal) ──────────────────────

interface BubbleProps {
  msg: ChatMsg;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onApply: (id: string, actions: AgentAction[]) => void;
  onDismiss: (id: string) => void;
}

export const MessageBubble: React.FC<BubbleProps> = ({ msg, expanded, onToggleExpand, onApply, onDismiss }) => {
  if (msg.isLoading) {
    return (
      <div className="flex items-start gap-2">
        <BotAvatar />
        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="flex gap-1 items-center h-4">
            {[0, 150, 300].map((d) => (
              <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-xs sm:max-w-sm lg:max-w-md bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-line">
          {msg.text}
        </div>
      </div>
    );
  }

  const hasActions = (msg.actions?.length ?? 0) > 0 && msg.actionStatus !== 'dismissed';
  const hasMissingFields = (msg.missingFields?.length ?? 0) > 0;

  return (
    <div className="flex items-start gap-2">
      <BotAvatar />
      <div className="max-w-xs sm:max-w-sm lg:max-w-md space-y-2">
        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm text-sm text-gray-800 dark:text-white leading-relaxed whitespace-pre-line">
          {msg.text}
          {(msg.warnings?.length ?? 0) > 0 && (
            <div className="mt-2 space-y-0.5">
              {msg.warnings!.map((w, i) => (
                <p key={i} className="text-amber-600 dark:text-amber-400 text-xs">⚠ {w}</p>
              ))}
            </div>
          )}
        </div>

        {hasActions && !hasMissingFields && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
            <button
              onClick={() => onToggleExpand(msg.id)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-blue-500" />
                {msg.actions!.length === 1 ? '1 action ready' : `${msg.actions!.length} actions ready`}
              </span>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expanded && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                {msg.actions!.map((action, i) => (
                  <div key={i} className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                    {formatActionPreview(action)}
                  </div>
                ))}
              </div>
            )}

            {msg.actionStatus === 'pending' && (
              <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => onApply(msg.id, msg.actions!)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <CheckCircle size={14} />
                  Apply
                </button>
                <button
                  onClick={() => onDismiss(msg.id)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}

            {msg.actionStatus === 'applied' && (
              <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs flex items-center gap-1.5 border-t border-gray-100 dark:border-gray-700">
                <CheckCircle size={13} />
                Applied successfully
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const BotAvatar: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
    <Bot size={15} className="text-white" />
  </div>
);

interface ChatInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  compact?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ inputRef, value, onChange, onSend, disabled, compact }) => (
  <div className={`border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${compact ? 'p-3 rounded-b-xl' : 'p-4 rounded-b-xl'}`}>
    <div className="flex gap-2 items-end">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder='e.g. "chicken $5", "got paid $800", "new goal: Egypt $1200"...'
        className="flex-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm text-gray-800 dark:text-white placeholder-gray-400"
        rows={compact ? 1 : 2}
        disabled={disabled}
      />
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center"
      >
        {disabled ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </div>
    {!compact && (
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
        Press Enter to send &bull; Shift+Enter for new line
      </p>
    )}
  </div>
);

export default AgentChatView;
