import { useCallback, useEffect, useMemo, useState } from 'react';
import ConsoleLayout from './ConsoleLayout';
import { downloadTextFile } from '../../lib/download';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
const PLAN_ORDER = ['starter', 'pro', 'scale'] as const;
const PLAN_PRICE: Record<string, number> = { pro: 7900, scale: 19900, starter: 2900 };
const PLAN_LABEL: Record<string, string> = { pro: 'Pro', scale: 'Scale', starter: 'Starter' };
const PLAN_DESC: Record<string, string> = {
  pro: 'Includes 2 TB storage, 20 containers, analytics and priority support.',
  scale: 'Includes 10 TB storage, 120 containers, advanced analytics and SLA.',
  starter: 'Includes 512 GB storage, 5 containers, and standard support.'
};

type Invoice = {
  amount: string;
  date: string;
  id: string;
  status: string;
};

type SummaryPayload = {
  invoices: Invoice[];
  profile: {
    email: string;
    payment_brand: string;
    payment_expiry: string;
    payment_last4: string;
    plan: string;
    plan_price_cents: number;
  };
  stats: {
    current_month: string;
    next_invoice_date: string;
    projected: string;
  };
};

function amountToNumber(value: string): number | null {
  const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

function invoiceStatusTone(status: string): 'paid' | 'pending' | 'failed' | 'neutral' {
  const normalized = status.toLowerCase();
  if (normalized.includes('paid') || normalized.includes('success')) {
    return 'paid';
  }
  if (normalized.includes('pending') || normalized.includes('processing')) {
    return 'pending';
  }
  if (normalized.includes('fail') || normalized.includes('cancel') || normalized.includes('error')) {
    return 'failed';
  }
  return 'neutral';
}

function nextPlan(plan: string) {
  const index = PLAN_ORDER.indexOf(plan as (typeof PLAN_ORDER)[number]);
  if (index < 0) {
    return 'pro';
  }
  return PLAN_ORDER[(index + 1) % PLAN_ORDER.length];
}

export default function BillingScreen() {
  const [email, setEmail] = useState<string>('demo@example.com');
  const [plan, setPlan] = useState<string>('pro');
  const [paymentBrand, setPaymentBrand] = useState<string>('VISA');
  const [paymentLast4, setPaymentLast4] = useState<string>('2481');
  const [paymentExpiry, setPaymentExpiry] = useState<string>('08/28');
  const [currentMonth, setCurrentMonth] = useState<string>('$79.00');
  const [projected, setProjected] = useState<string>('$96.30');
  const [nextInvoiceDate, setNextInvoiceDate] = useState<string>('Apr 01, 2026');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'error' | 'success'>('success');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const rawUser = window.localStorage.getItem('mpconsole_user');
    if (!rawUser) {
      return;
    }
    try {
      const user = JSON.parse(rawUser) as { email?: string };
      if (user.email) {
        setEmail(user.email);
      }
    } catch (_error) {
      setEmail('demo@example.com');
    }
  }, []);

  const loadSummary = useCallback(async (targetEmail: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/billing/summary/?email=${encodeURIComponent(targetEmail)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as SummaryPayload;
      setPlan(payload.profile.plan);
      setPaymentBrand(payload.profile.payment_brand);
      setPaymentLast4(payload.profile.payment_last4);
      setPaymentExpiry(payload.profile.payment_expiry);
      setCurrentMonth(payload.stats.current_month);
      setProjected(payload.stats.projected);
      setNextInvoiceDate(payload.stats.next_invoice_date);
      setInvoices(payload.invoices);
    } catch (_error) {
      setFeedbackType('error');
      setFeedback('Unable to load billing data from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary(email);
  }, [email, loadSummary]);

  async function postJson(path: string, body: Record<string, unknown>) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await response.json() : {};
    if (!response.ok) {
      const detail = (payload as { detail?: string }).detail || `HTTP ${response.status}`;
      throw new Error(detail);
    }
    return payload;
  }

  async function handleUpgradePlan() {
    const currentIndex = PLAN_ORDER.indexOf(plan as (typeof PLAN_ORDER)[number]);
    const upgradedPlan = PLAN_ORDER[Math.min(Math.max(currentIndex, 0) + 1, PLAN_ORDER.length - 1)] || 'scale';
    try {
      setLoading(true);
      const payload = (await postJson('/api/billing/checkout/', {
        amount_cents: PLAN_PRICE[upgradedPlan],
        currency: 'eur',
        description: `Upgrade to ${PLAN_LABEL[upgradedPlan]} plan`,
        email,
        plan: upgradedPlan
      })) as { checkout_url?: string };

      if (payload.checkout_url && typeof window !== 'undefined') {
        window.open(payload.checkout_url, '_blank', 'noopener,noreferrer');
      }

      setFeedbackType('success');
      setFeedback('Checkout created. Complete payment in the opened tab.');
      await loadSummary(email);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Unable to create checkout.');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePlan() {
    const updatedPlan = nextPlan(plan);
    try {
      setLoading(true);
      await postJson('/api/billing/subscription/', {
        email,
        plan: updatedPlan
      });
      setFeedbackType('success');
      setFeedback(`Plan changed to ${PLAN_LABEL[updatedPlan]}.`);
      await loadSummary(email);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Unable to change plan.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateCard() {
    try {
      setLoading(true);
      const nextMonth = String(((new Date().getMonth() + 2) % 12) || 12).padStart(2, '0');
      const nextYear = String((new Date().getFullYear() + 2) % 100).padStart(2, '0');
      await postJson('/api/billing/payment-method/', {
        brand: paymentBrand,
        email,
        expiry: `${nextMonth}/${nextYear}`,
        last4: paymentLast4
      });
      setFeedbackType('success');
      setFeedback('Payment method updated.');
      await loadSummary(email);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Unable to update card.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMethod() {
    try {
      setLoading(true);
      await postJson('/api/billing/payment-method/', {
        brand: 'VISA',
        email,
        expiry: '03/30',
        last4: '9042'
      });
      setFeedbackType('success');
      setFeedback('New payment method added and set as default.');
      await loadSummary(email);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Unable to add payment method.');
    } finally {
      setLoading(false);
    }
  }

  function handleExportInvoices() {
    const csvHeader = 'invoice_id,date,amount,status';
    const rows = invoices.map((item) => `${item.id},${item.date},${item.amount},${item.status}`);
    downloadTextFile([csvHeader, ...rows].join('\n'), 'invoices.csv', 'text/csv;charset=utf-8');
    setFeedbackType('success');
    setFeedback('Invoice history exported.');
  }

  function handleDownloadInvoice(invoice: Invoice) {
    const content = [
      `Invoice: ${invoice.id}`,
      `Date: ${invoice.date}`,
      `Amount: ${invoice.amount}`,
      `Status: ${invoice.status}`,
      'Generated by MPConsole'
    ].join('\n');
    downloadTextFile(content, `${invoice.id}.txt`, 'text/plain;charset=utf-8');
  }

  const currentPlanLabel = useMemo(() => PLAN_LABEL[plan] || 'Pro', [plan]);
  const currentPlanDescription = useMemo(() => PLAN_DESC[plan] || PLAN_DESC.pro, [plan]);
  const usagePercent = useMemo(() => {
    const currentValue = amountToNumber(currentMonth);
    const planValue = (PLAN_PRICE[plan] || PLAN_PRICE.pro) / 100;
    if (!currentValue || !planValue) {
      return 63;
    }
    return Math.max(8, Math.min(100, Math.round((currentValue / planValue) * 100)));
  }, [currentMonth, plan]);
  const paidInvoices = useMemo(
    () => invoices.filter((invoice) => invoiceStatusTone(invoice.status) === 'paid').length,
    [invoices]
  );
  const nextInvoiceCountdown = useMemo(() => {
    const parsed = Date.parse(nextInvoiceDate);
    if (Number.isNaN(parsed)) {
      return nextInvoiceDate;
    }
    const days = Math.ceil((parsed - Date.now()) / (24 * 60 * 60 * 1000));
    if (days <= 0) {
      return 'Due today';
    }
    return `In ${days} day${days > 1 ? 's' : ''}`;
  }, [nextInvoiceDate]);

  return (
    <ConsoleLayout activeRoute="billing">
      <section className="billing-screen" data-node-id="206:22131">
        <div className="billing-head">
          <div className="billing-head-copy">
            <h1 className="console-h1">Billing</h1>
            <p className="console-subtext">Manage your subscription, payment method, and invoice history.</p>
          </div>
          <div className="billing-head-actions">
            <button
              className="secondary-button narrow"
              disabled={loading}
              onClick={() => loadSummary(email)}
              type="button"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button className="secondary-button narrow" onClick={handleExportInvoices} type="button">
              Export CSV
            </button>
          </div>
        </div>

        <div className="billing-overview-grid">
          <article className="billing-plan-card">
            <div className="billing-plan-top">
              <div className="billing-plan-meta">
                <div className="billing-card-head">
                  <h2 className="console-h4">Current Plan</h2>
                  <span className="billing-badge">{currentPlanLabel}</span>
                </div>
                <p className="billing-caption">{currentPlanDescription}</p>
              </div>
              <div className="billing-price-wrap">
                <p className="billing-price">
                  {currentMonth}
                  <span>/month</span>
                </p>
              </div>
            </div>

            <div className="billing-kpi-row">
              <div className="billing-kpi">
                <p className="billing-kpi-label">Current month</p>
                <p className="billing-kpi-value">{currentMonth}</p>
              </div>
              <div className="billing-kpi">
                <p className="billing-kpi-label">Projected</p>
                <p className="billing-kpi-value">{projected}</p>
              </div>
              <div className="billing-kpi">
                <p className="billing-kpi-label">Next invoice</p>
                <p className="billing-kpi-value">{nextInvoiceCountdown}</p>
              </div>
            </div>

            <div className="billing-progress-wrap">
              <div className="billing-progress">
                <span style={{ width: `${usagePercent}%` }} />
              </div>
              <p className="billing-progress-label">{usagePercent}% of monthly compute quota used</p>
            </div>
            <div className="billing-actions">
              <button className="primary-button narrow" disabled={loading} onClick={handleUpgradePlan} type="button">
                Upgrade Plan
              </button>
              <button className="secondary-button narrow" disabled={loading} onClick={handleChangePlan} type="button">
                Change Plan
              </button>
            </div>
          </article>

          <article className="billing-method-card">
            <div className="billing-card-head">
              <h2 className="console-h4">Payment Method</h2>
              <span className="billing-mini-tag">Default</span>
            </div>
            <p className="billing-caption">Default card</p>
            <div className="billing-method">
              <div className="billing-method-chip">{paymentBrand}</div>
              <div>
                <p className="billing-method-title">•••• •••• •••• {paymentLast4}</p>
                <p className="billing-method-caption">Expires {paymentExpiry}</p>
              </div>
            </div>
            <div className="billing-contact">
              <p className="billing-contact-label">Billing contact</p>
              <p className="billing-contact-value">{email}</p>
            </div>
            <div className="billing-actions">
              <button className="secondary-button narrow" disabled={loading} onClick={handleUpdateCard} type="button">
                Update Card
              </button>
              <button className="secondary-button narrow" disabled={loading} onClick={handleAddMethod} type="button">
                Add Method
              </button>
            </div>
          </article>
        </div>

        <div className="billing-stats-grid">
          <article className="billing-stat-card">
            <p className="billing-stat-label">Current Month</p>
            <p className="billing-stat-value">{currentMonth}</p>
          </article>
          <article className="billing-stat-card">
            <p className="billing-stat-label">Projected</p>
            <p className="billing-stat-value">{projected}</p>
          </article>
          <article className="billing-stat-card">
            <p className="billing-stat-label">Next Invoice</p>
            <p className="billing-stat-value">{nextInvoiceDate}</p>
          </article>
          <article className="billing-stat-card">
            <p className="billing-stat-label">Paid Invoices</p>
            <p className="billing-stat-value">{paidInvoices}</p>
          </article>
        </div>

        <section className="billing-table-card">
          <div className="billing-table-head">
            <div>
              <h2 className="console-h4">Invoice History</h2>
              <p className="billing-caption">Latest invoices and downloadable receipts.</p>
            </div>
            {loading && <span className="billing-loading-pill">Syncing...</span>}
          </div>
          <div className="billing-table-wrap">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.id}</td>
                    <td>{invoice.date}</td>
                    <td>{invoice.amount}</td>
                    <td>
                      <span className={`billing-status billing-status-${invoiceStatusTone(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="billing-link-button"
                        onClick={() => handleDownloadInvoice(invoice)}
                        type="button"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
                {!invoices.length && (
                  <tr>
                    <td className="billing-empty-row" colSpan={5}>
                      No invoices yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {feedback && (
          <p className={`console-inline-feedback ${feedbackType === 'error' ? 'is-error' : 'is-success'}`}>
            {feedback}
          </p>
        )}
      </section>
    </ConsoleLayout>
  );
}
