import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_ACTION_TYPES = new Set([
  'createExpense',
  'createIncome',
  'createBudget',
  'createCategory',
  'createPaymentMethod',
  'createRecurringPayment',
  'createSavingGoal',
  'createFinancialNote',
]);

const VALID_INTENTS = new Set([
  'auto',
  'expense',
  'income',
  'budget',
  'recurring',
  'goal',
  'category',
  'payment_method',
  'note',
]);

type AgentAction = {
  type: string;
  payload: Record<string, unknown>;
  missingFields?: string[];
  confidence?: number;
  warnings?: string[];
  suggestions?: string[];
};

type ParseResponse = {
  actions: AgentAction[];
  missingFields: string[];
  warnings: string[];
  suggestions: string[];
  summary?: string;
};

type ConversationMessage = { role: 'user' | 'model'; text: string };

type UserContext = {
  categories: string[];
  paymentMethods: string[];
  budgetsThisMonth: { category: string; amount: number }[];
  recurringExpenses: { name: string; category: string; amount: number; frequency: string }[];
  savingsGoals: { name: string; targetAmount: number; currentAmount: number }[];
  recentExpenses: { date: string; category: string; amount: number; notes: string }[];
  recentIncome: { date: string; description: string; amount: number; sourceType: string }[];
};

const currentMonth = (): string => new Date().toISOString().slice(0, 7);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

async function fetchUserContext(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<UserContext> {
  const month = currentMonth();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().slice(0, 10);

  const [
    categoriesRes,
    paymentMethodsRes,
    budgetsRes,
    recurringRes,
    goalsRes,
    expensesRes,
    incomeRes,
  ] = await Promise.all([
    supabase.from('user_categories').select('name').eq('user_id', userId).order('name'),
    supabase.from('payment_methods').select('name').eq('user_id', userId).order('name'),
    supabase
      .from('budgets')
      .select('category, amount')
      .eq('user_id', userId)
      .eq('month', month),
    supabase
      .from('recurring_expenses')
      .select('name, category, amount, frequency')
      .eq('user_id', userId)
      .limit(20),
    supabase
      .from('savings_goals')
      .select('name, target_amount, current_amount')
      .eq('user_id', userId)
      .limit(20),
    supabase
      .from('expenses')
      .select('date, category, amount, notes')
      .eq('user_id', userId)
      .gte('date', since)
      .order('date', { ascending: false })
      .limit(25),
    supabase
      .from('income_sources')
      .select('date, description, amount, source_type')
      .eq('user_id', userId)
      .gte('date', since)
      .order('date', { ascending: false })
      .limit(15),
  ]);

  return {
    categories: (categoriesRes.data ?? []).map((r: { name: string }) => r.name),
    paymentMethods: (paymentMethodsRes.data ?? []).map((r: { name: string }) => r.name),
    budgetsThisMonth: (budgetsRes.data ?? []).map((r: { category: string; amount: string }) => ({
      category: r.category,
      amount: parseFloat(r.amount),
    })),
    recurringExpenses: (recurringRes.data ?? []).map(
      (r: { name: string; category: string; amount: string; frequency: string }) => ({
        name: r.name,
        category: r.category,
        amount: parseFloat(r.amount),
        frequency: r.frequency,
      })
    ),
    savingsGoals: (goalsRes.data ?? []).map(
      (r: { name: string; target_amount: string; current_amount: string }) => ({
        name: r.name,
        targetAmount: parseFloat(r.target_amount),
        currentAmount: parseFloat(r.current_amount),
      })
    ),
    recentExpenses: (expensesRes.data ?? []).map(
      (r: { date: string; category: string; amount: string; notes: string | null }) => ({
        date: r.date,
        category: r.category,
        amount: parseFloat(r.amount),
        notes: r.notes ?? '',
      })
    ),
    recentIncome: incomeRes.error
      ? []
      : (incomeRes.data ?? []).map(
          (r: {
            date: string;
            description: string;
            amount: string;
            source_type: string;
          }) => ({
            date: r.date,
            description: r.description,
            amount: parseFloat(r.amount),
            sourceType: r.source_type,
          })
        ),
  };
}

function buildPrompt(noteText: string, intent: string, ctx: UserContext): string {
  const today = new Date().toISOString().slice(0, 10);
  const month = currentMonth();

  return `You are IntelliBudget's AI Budget Agent. Parse the user's note into structured actions for their personal finance app.

TODAY: ${today}
CURRENT_MONTH: ${month}
USER_INTENT_HINT: ${intent}

USER DATA (use exact category and payment method names when they match):
${JSON.stringify(ctx, null, 2)}

USER NOTE:
"""
${noteText}
"""

Return ONLY valid JSON matching this schema (no markdown):
{
  "summary": "one sentence explaining what you understood",
  "actions": [
    {
      "type": "createExpense|createIncome|createBudget|createCategory|createPaymentMethod|createRecurringPayment|createSavingGoal|createFinancialNote",
      "payload": { },
      "missingFields": ["field names still required"],
      "confidence": 0.0 to 1.0,
      "warnings": ["e.g. Over budget for Groceries"],
      "suggestions": ["optional next steps"]
    }
  ],
  "missingFields": ["global missing fields if any"],
  "warnings": ["budget or data warnings"],
  "suggestions": ["helpful follow-ups, no automatic writes"]
}

Payload shapes by type:
- createExpense: { amount: number, date: "YYYY-MM-DD", category: string, notes?: string, paymentMethod?: string }
- createIncome: { amount: number, date: "YYYY-MM-DD", description: string, sourceType?: string, notes?: string }
- createBudget: { month: "YYYY-MM", category: string, amount: number }
- createCategory: { name: string }
- createPaymentMethod: { name: string }
- createRecurringPayment: { description: string, amount: number, category: string, dayOfMonth: number, startDate: "YYYY-MM", paymentMethod?: string }
- createSavingGoal: { name: string, targetAmount: number, targetDate?: "YYYY-MM-DD", category?: string }
- createFinancialNote: { text: string }

Rules:
- Prefer existing categories and payment methods from USER DATA; suggest closest match in suggestions if unsure.
- One note may produce multiple actions (e.g. expense + reminder).
- Put unknown required fields in missingFields (per action and globally).
- If intent is "expense", prioritize createExpense; "income" → createIncome; etc. "auto" → infer best action(s).
- Do not invent transactions the user did not imply.
- Amounts are numbers in the user's currency (no symbols in payload).`;
}

function normalizeParseResult(raw: unknown): ParseResponse {
  const obj = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;

  const actionsRaw = Array.isArray(obj.actions) ? obj.actions : [];
  const actions: AgentAction[] = actionsRaw
    .filter((a) => typeof a === 'object' && a !== null)
    .map((a) => {
      const item = a as Record<string, unknown>;
      const type = String(item.type ?? '');
      return {
        type: VALID_ACTION_TYPES.has(type) ? type : 'createFinancialNote',
        payload:
          typeof item.payload === 'object' && item.payload !== null
            ? (item.payload as Record<string, unknown>)
            : { text: String(item.payload ?? '') },
        missingFields: Array.isArray(item.missingFields)
          ? item.missingFields.map(String)
          : [],
        confidence:
          typeof item.confidence === 'number'
            ? Math.min(1, Math.max(0, item.confidence))
            : undefined,
        warnings: Array.isArray(item.warnings) ? item.warnings.map(String) : [],
        suggestions: Array.isArray(item.suggestions) ? item.suggestions.map(String) : [],
      };
    });

  return {
    actions,
    missingFields: Array.isArray(obj.missingFields) ? obj.missingFields.map(String) : [],
    warnings: Array.isArray(obj.warnings) ? obj.warnings.map(String) : [],
    suggestions: Array.isArray(obj.suggestions) ? obj.suggestions.map(String) : [],
    summary: typeof obj.summary === 'string' ? obj.summary : undefined,
  };
}

function buildSystemInstruction(intent: string, ctx: UserContext): string {
  const today = new Date().toISOString().slice(0, 10);
  const month = currentMonth();

  return `You are IntelliBudget's AI Budget Agent. Parse the user's message into structured actions for their personal finance app. This is a multi-turn conversation — use prior messages for context when resolving ambiguity.

TODAY: ${today}
CURRENT_MONTH: ${month}
USER_INTENT_HINT: ${intent}

USER DATA (use exact category and payment method names when they match):
${JSON.stringify(ctx, null, 2)}

Return ONLY valid JSON matching this schema (no markdown):
{
  "summary": "one sentence explaining what you understood",
  "actions": [
    {
      "type": "createExpense|createIncome|createBudget|createCategory|createPaymentMethod|createRecurringPayment|createSavingGoal|createFinancialNote",
      "payload": { },
      "missingFields": ["field names still required"],
      "confidence": 0.0 to 1.0,
      "warnings": ["e.g. Over budget for Groceries"],
      "suggestions": ["optional next steps"]
    }
  ],
  "missingFields": ["global missing fields if any"],
  "warnings": ["budget or data warnings"],
  "suggestions": ["helpful follow-ups"]
}

Payload shapes by type:
- createExpense: { amount: number, date: "YYYY-MM-DD", category: string, notes?: string, paymentMethod?: string }
- createIncome: { amount: number, date: "YYYY-MM-DD", description: string, sourceType?: string, notes?: string }
- createBudget: { month: "YYYY-MM", category: string, amount: number }
- createCategory: { name: string }
- createPaymentMethod: { name: string }
- createRecurringPayment: { description: string, amount: number, category: string, dayOfMonth: number, startDate: "YYYY-MM", paymentMethod?: string }
- createSavingGoal: { name: string, targetAmount: number, targetDate?: "YYYY-MM-DD", category?: string }
- createFinancialNote: { text: string }

Rules:
- Prefer existing categories and payment methods from USER DATA.
- Put unknown required fields in missingFields.
- If the user is answering a clarification from the prior AI turn, resolve the ambiguity using their answer.
- Amounts are numbers (no symbols in payload).`;
}

async function callGeminiOnce(
  apiKey: string,
  options:
    | { mode: 'single'; prompt: string }
    | { mode: 'multi'; systemInstruction: string; history: ConversationMessage[]; noteText: string }
): Promise<ParseResponse> {
  const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let requestBody: Record<string, unknown>;

  if (options.mode === 'single') {
    requestBody = {
      contents: [{ parts: [{ text: options.prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    };
  } else {
    const contents = [
      ...options.history.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
      { role: 'user', parts: [{ text: options.noteText }] },
    ];
    requestBody = {
      systemInstruction: { parts: [{ text: options.systemInstruction }] },
      contents,
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    };
  }

  const geminiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!geminiRes.ok) {
    const errText = await geminiRes.text();
    console.error('Gemini API error:', geminiRes.status, errText);
    throw Object.assign(new Error(`Gemini API failed (${geminiRes.status})`), { status: geminiRes.status });
  }

  const geminiJson = await geminiRes.json();
  const text = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text || typeof text !== 'string') {
    throw new Error('Empty response from Gemini');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse Gemini JSON');
    parsed = JSON.parse(match[0]);
  }

  return normalizeParseResult(parsed);
}

async function callGemini(
  apiKey: string,
  options:
    | { mode: 'single'; prompt: string }
    | { mode: 'multi'; systemInstruction: string; history: ConversationMessage[]; noteText: string }
): Promise<ParseResponse> {
  try {
    return await callGeminiOnce(apiKey, options);
  } catch (err) {
    // Retry once after a short delay on rate-limit (429) or server errors (5xx)
    const status = (err as { status?: number }).status;
    if (status === 429 || (status !== undefined && status >= 500)) {
      const delay = status === 429 ? 4000 : 1500;
      await new Promise((r) => setTimeout(r, delay));
      return await callGeminiOnce(apiKey, options);
    }
    throw err;
  }
}

function deriveAgentStatus(result: ParseResponse): string {
  const needsInfo =
    result.missingFields.length > 0 ||
    result.actions.some((a) => (a.missingFields?.length ?? 0) > 0);
  return needsInfo ? 'needs_info' : 'parsed';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiKey) {
    return jsonResponse({ error: 'GEMINI_API_KEY is not configured on the server' }, 500);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'Supabase environment is not configured' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let body: { noteText?: string; noteId?: string; intent?: string; messages?: ConversationMessage[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const noteText = typeof body.noteText === 'string' ? body.noteText.trim() : '';
  if (!noteText) {
    return jsonResponse({ error: 'noteText is required' }, 400);
  }

  const intent =
    typeof body.intent === 'string' && VALID_INTENTS.has(body.intent) ? body.intent : 'auto';
  const noteId = typeof body.noteId === 'string' ? body.noteId : undefined;

  const messages: ConversationMessage[] = Array.isArray(body.messages)
    ? (body.messages as ConversationMessage[]).filter(
        (m) =>
          (m.role === 'user' || m.role === 'model') &&
          typeof m.text === 'string' &&
          m.text.trim().length > 0
      )
    : [];

  try {
    const ctx = await fetchUserContext(supabase, user.id);

    const result =
      messages.length >= 2
        ? await callGemini(geminiKey, {
            mode: 'multi',
            systemInstruction: buildSystemInstruction(intent, ctx),
            history: messages,
            noteText,
          })
        : await callGemini(geminiKey, {
            mode: 'single',
            prompt: buildPrompt(noteText, intent, ctx),
          });

    if (noteId) {
      const agentStatus = deriveAgentStatus(result);
      await supabase
        .from('agent_notes')
        .update({
          agent_result: result,
          agent_status: agentStatus,
        })
        .eq('id', noteId)
        .eq('user_id', user.id);
    }

    return jsonResponse(result);
  } catch (err) {
    console.error('budget-agent-parse error:', err);
    const message = err instanceof Error ? err.message : 'Parse failed';

    if (noteId) {
      await supabase
        .from('agent_notes')
        .update({ agent_status: 'failed' })
        .eq('id', noteId)
        .eq('user_id', user.id);
    }

    return jsonResponse({ error: message }, 502);
  }
});
