import type { AgentAction, Expense, IncomeSource, SavingsGoal, RecurringExpense } from '../types';

export interface AgentCallbacks {
  addExpense: (month: string, expense: Omit<Expense, 'id'>) => Promise<void>;
  addIncomeSource: (month: string, income: Omit<IncomeSource, 'id'>) => Promise<void>;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'contributions'>) => Promise<void>;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id'>) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  addPaymentMethod: (name: string) => Promise<void>;
  handleSetBudget: (month: string, category: string, amount: number) => Promise<void>;
}

export async function executeAction(action: AgentAction, cb: AgentCallbacks): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const p = action.payload;

  switch (action.type) {
    case 'createExpense': {
      const date = (p.date as string) || today;
      await cb.addExpense(date.substring(0, 7), {
        date,
        category: (p.category as string) || 'Other',
        amount: p.amount as number,
        notes: (p.notes as string) || '',
        paymentMethod: p.paymentMethod as string | undefined,
      });
      break;
    }
    case 'createIncome': {
      const date = (p.date as string) || today;
      await cb.addIncomeSource(date.substring(0, 7), {
        description: (p.description as string) || 'Income',
        amount: p.amount as number,
        date,
        sourceType: (p.sourceType as string) || 'other',
        notes: (p.notes as string) || '',
      });
      break;
    }
    case 'createSavingGoal':
      await cb.addSavingsGoal({
        name: p.name as string,
        targetAmount: p.targetAmount as number,
        currentAmount: 0,
        targetDate: (p.targetDate as string) || oneYearFromNow,
        category: p.category as string | undefined,
      });
      break;
    case 'createRecurringPayment':
      await cb.addRecurringExpense({
        description: p.description as string,
        amount: p.amount as number,
        category: (p.category as string) || 'Other',
        dayOfMonth: (p.dayOfMonth as number) || 1,
        startDate: (p.startDate as string) || currentMonth,
        paymentMethod: p.paymentMethod as string | undefined,
      });
      break;
    case 'createCategory':
      await cb.addCategory(p.name as string);
      break;
    case 'createPaymentMethod':
      await cb.addPaymentMethod(p.name as string);
      break;
    case 'createBudget':
      await cb.handleSetBudget(
        (p.month as string) || currentMonth,
        p.category as string,
        p.amount as number
      );
      break;
    case 'createFinancialNote':
      break;
    default:
      break;
  }
}

export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('GEMINI_API_KEY'))
    return 'AI not configured yet. Set the GEMINI_API_KEY secret in Supabase and redeploy the function.';
  if (msg.includes('429'))
    return 'AI is busy right now (rate limit). Wait a few seconds and try again.';
  if (msg.includes('not found') || msg.includes('404'))
    return 'AI function not deployed yet. Run: supabase functions deploy budget-agent-parse';
  if (msg.includes('Unauthorized') || msg.includes('401'))
    return 'Session expired. Please sign out and back in.';
  if (msg.includes('fetch') || msg.includes('network'))
    return 'Network error. Check your internet connection.';
  return msg || 'Something went wrong. Please try again.';
}
