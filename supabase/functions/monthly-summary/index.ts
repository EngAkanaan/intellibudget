// Supabase Edge Function: monthly-summary
//
// Setup (one-time):
//   1. Sign up at https://resend.com (free tier: 3 000 emails/month)
//   2. Create an API key and add it to Supabase secrets:
//        supabase secrets set RESEND_API_KEY=<your-key>
//   3. In Resend, verify a sending domain (or use the sandbox address for testing).
//   4. Set your sender address:
//        supabase secrets set FROM_EMAIL="IntelliBudget <noreply@yourdomain.com>"
//   5. Deploy:  supabase functions deploy monthly-summary
//
// The frontend calls this automatically on the first login of each new month.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
// Update this to your verified Resend sender address
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'IntelliBudget <noreply@yourdomain.com>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildEmailHtml(params: {
  monthName: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  topCategories: Array<{ category: string; amount: number }>;
}): string {
  const { monthName, totalIncome, totalExpenses, netSavings, topCategories } = params;
  const savingsColor = netSavings >= 0 ? '#16a34a' : '#dc2626';
  const savingsLabel = netSavings >= 0 ? 'Net Saved' : 'Over Budget';

  const categoryRows = topCategories
    .map(
      (c) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;">${c.category}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;color:#111827;">${formatUSD(c.amount)}</td>
        </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your ${monthName} Summary</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.07);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:36px 32px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#bfdbfe;text-transform:uppercase;letter-spacing:1px;">IntelliBudget</p>
            <h1 style="margin:0;font-size:28px;color:#ffffff;">Monthly Summary</h1>
            <p style="margin:8px 0 0;font-size:16px;color:#bfdbfe;">${monthName}</p>
          </td>
        </tr>

        <!-- Stats -->
        <tr>
          <td style="padding:28px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="text-align:center;padding:16px 8px;background:#f0f9ff;border-radius:8px;">
                  <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Income</p>
                  <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#2563eb;">${formatUSD(totalIncome)}</p>
                </td>
                <td width="4%"></td>
                <td width="33%" style="text-align:center;padding:16px 8px;background:#fff1f2;border-radius:8px;">
                  <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">Expenses</p>
                  <p style="margin:6px 0 0;font-size:22px;font-weight:700;color:#dc2626;">${formatUSD(totalExpenses)}</p>
                </td>
                <td width="4%"></td>
                <td width="33%" style="text-align:center;padding:16px 8px;border-radius:8px;" bgcolor="${netSavings >= 0 ? '#f0fdf4' : '#fff1f2'}">
                  <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;">${savingsLabel}</p>
                  <p style="margin:6px 0 0;font-size:22px;font-weight:700;" style="color:${savingsColor};">${formatUSD(Math.abs(netSavings))}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Top Categories -->
        ${
          topCategories.length > 0
            ? `
        <tr>
          <td style="padding:28px 32px 0;">
            <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">Top Spending Categories</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${categoryRows}
            </table>
          </td>
        </tr>`
            : ''
        }

        <!-- Footer -->
        <tr>
          <td style="padding:32px;text-align:center;border-top:1px solid #f3f4f6;margin-top:24px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">IntelliBudget &middot; Your smart finance companion</p>
            <p style="margin:4px 0 0;font-size:11px;color:#d1d5db;">Summary for ${monthName}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user || !user.email) throw new Error('Unauthorized or no email on account');

    const body = await req.json().catch(() => ({}));
    const { month } = body as { month?: string };
    if (!month || !/^\d{4}-\d{2}$/.test(month)) throw new Error('month must be in YYYY-MM format');

    // Fetch expenses and income for the requested month
    const [expensesRes, incomeRes] = await Promise.all([
      supabase.from('expenses').select('category, amount').eq('user_id', user.id).eq('month', month),
      supabase.from('income_sources').select('amount').eq('user_id', user.id).like('date', `${month}%`),
    ]);

    const expenses: Array<{ category: string; amount: string }> = expensesRes.data ?? [];
    const incomeSources: Array<{ amount: string }> = incomeRes.data ?? [];

    const totalExpenses = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const totalIncome = incomeSources.reduce((s, i) => s + parseFloat(i.amount), 0);
    const netSavings = totalIncome - totalExpenses;

    // Aggregate top 3 spending categories
    const catMap: Record<string, number> = {};
    for (const e of expenses) {
      catMap[e.category] = (catMap[e.category] ?? 0) + parseFloat(e.amount);
    }
    const topCategories = Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));

    const monthName = new Date(`${month}-02`).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const html = buildEmailHtml({ monthName, totalIncome, totalExpenses, netSavings, topCategories });

    let emailSent = false;
    if (RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [user.email],
          subject: `Your IntelliBudget Summary for ${monthName}`,
          html,
        }),
      });
      emailSent = res.ok;
      if (!res.ok) {
        const errBody = await res.text();
        console.error('Resend error:', errBody);
      }
    } else {
      console.log('RESEND_API_KEY not set — skipping email send (summary computed only)');
    }

    return new Response(
      JSON.stringify({ success: true, emailSent, month, totalIncome, totalExpenses, netSavings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('monthly-summary error:', err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
