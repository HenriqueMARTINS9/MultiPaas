import { useCallback, useEffect, useMemo, useState } from 'react';
import ConsoleLayout from './ConsoleLayout';
import { IconNavBilling } from './icons';
import { downloadTextFile } from '../../lib/download';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
const PLAN_ORDER = ['starter', 'pro', 'scale'] as const;
const PLAN_PRICE: Record<string, number> = { pro: 7900, scale: 19900, starter: 2900 };
const PLAN_LABEL: Record<string, string> = { pro: 'Pro', scale: 'Scale', starter: 'No plan' };
const PLAN_DESC: Record<string, string> = {
  pro: 'Pro features with analytics and priority support.',
  scale: 'Scale features with higher capacity and SLA.',
  starter: 'No active paid subscription.'
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

type SessionUser = {
  email?: string;
};

function amountToNumber(value: string): number {
  const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toEuro(value: number) {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
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
  const [plan, setPlan] = useState<string>('starter');
  const [paymentBrand, setPaymentBrand] = useState<string>('Not set');
  const [paymentLast4, setPaymentLast4] = useState<string>('0000');
  const [paymentExpiry, setPaymentExpiry] = useState<string>('--/--');
  const [currentMonth, setCurrentMonth] = useState<string>('0.00 €');
  const [projected, setProjected] = useState<string>('0.00 €');
  const [nextInvoiceDate, setNextInvoiceDate] = useState<string>('—');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'error' | 'success'>('success');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const rawUser = window.localStorage.getItem('mpconsole_user');
    if (!rawUser) {
      return;
    }
    try {
      const user = JSON.parse(rawUser) as SessionUser;
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
        description: `Upgrade to ${PLAN_LABEL[upgradedPlan]}`,
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

  async function handleCancelSubscription() {
    try {
      setLoading(true);
      await postJson('/api/billing/subscription/', {
        email,
        plan: 'starter'
      });
      setFeedbackType('success');
      setFeedback('Subscription moved to no-plan tier.');
      await loadSummary(email);
    } catch (error) {
      setFeedbackType('error');
      setFeedback(error instanceof Error ? error.message : 'Unable to cancel subscription.');
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
        brand: paymentBrand === 'Not set' ? 'VISA' : paymentBrand,
        email,
        expiry: `${nextMonth}/${nextYear}`,
        last4: paymentLast4 === '0000' ? '2481' : paymentLast4
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

  function handleScrollInvoices() {
    if (typeof window === 'undefined') {
      return;
    }
    const target = document.getElementById('recent-invoices');
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const currentPlanLabel = useMemo(() => PLAN_LABEL[plan] || 'No plan', [plan]);
  const currentPlanDescription = useMemo(() => PLAN_DESC[plan] || PLAN_DESC.starter, [plan]);
  const currentAmount = useMemo(() => amountToNumber(currentMonth), [currentMonth]);
  const projectedAmount = useMemo(() => amountToNumber(projected), [projected]);
  const serviceAmount = useMemo(() => currentAmount * 0.965, [currentAmount]);
  const objectStorageAmount = useMemo(() => Math.max(currentAmount - serviceAmount, 0), [currentAmount, serviceAmount]);
  const servicePercent = useMemo(() => {
    if (currentAmount <= 0) {
      return 0;
    }
    return Math.round((serviceAmount / currentAmount) * 100);
  }, [currentAmount, serviceAmount]);
  const sixMonthData = useMemo(() => {
    const fallback = [54, 118, 134, 123, 149, 165, 214, 254];
    if (!invoices.length) {
      return fallback;
    }
    const amounts = invoices.slice(0, 8).map((item) => amountToNumber(item.amount));
    while (amounts.length < 8) {
      amounts.push(fallback[amounts.length]);
    }
    return amounts.reverse();
  }, [invoices]);
  const maxChart = useMemo(() => Math.max(...sixMonthData, 1), [sixMonthData]);
  const filteredInvoices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return invoices;
    }
    return invoices.filter((invoice) =>
      [invoice.id, invoice.date, invoice.amount, invoice.status].some((field) => field.toLowerCase().includes(query))
    );
  }, [invoices, searchTerm]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredInvoices.length / 10)), [filteredInvoices.length]);
  const paginatedInvoices = useMemo(() => {
    const start = (page - 1) * 10;
    return filteredInvoices.slice(start, start + 10);
  }, [filteredInvoices, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, invoices.length]);

  return (
    <ConsoleLayout activeRoute="billing">
      <section className="billing-screen billing-figma-screen" data-node-id="206:22131">
        <header className="billing-figma-header">
          <h1 className="console-h1 with-icon">
            <IconNavBilling />
            <span>Billing</span>
          </h1>
          <p className="console-subtext">Manage your subscription and billing details.</p>
        </header>

        <article className="billing-figma-panel">
          <h2 className="console-h4">Billing Information</h2>
          <p className="console-caption">Manage your subscription and billing details</p>

          <div className="billing-info-grid">
            <div className="billing-info-card">
              <p className="billing-label">Current Plan</p>
              <p className="billing-plan-value">{currentPlanLabel}</p>
              <p className="console-caption">{currentPlanDescription}</p>
              <div className="billing-actions">
                <button className="secondary-button narrow" disabled={loading} onClick={handleChangePlan} type="button">
                  Change plan
                </button>
                <button className="primary-button narrow" disabled={loading} onClick={handleUpgradePlan} type="button">
                  Update Plan
                </button>
              </div>
            </div>

            <div className="billing-info-card">
              <p className="billing-label">Next Billing</p>
              <p className="billing-next-main">{nextInvoiceDate}</p>
              <p className="billing-next-secondary">{projected}</p>
              <p className="console-caption">Estimated next invoice amount</p>
            </div>
          </div>

          <div className="billing-payment-row">
            <div className="billing-payment-main">
              <p className="billing-label">Payment Method</p>
              <p className="billing-payment-title">
                {paymentBrand} •••• •••• •••• {paymentLast4}
              </p>
              <p className="console-caption">Expiry {paymentExpiry}</p>
            </div>
            <button className="secondary-button narrow" disabled={loading} onClick={handleUpdateCard} type="button">
              Edit
            </button>
          </div>

          <div className="billing-actions">
            <button className="secondary-button narrow" onClick={handleScrollInvoices} type="button">
              View invoices
            </button>
            <button className="secondary-button narrow" disabled={loading} onClick={handleAddMethod} type="button">
              Update payment
            </button>
            <button className="billing-danger-button" disabled={loading} onClick={handleCancelSubscription} type="button">
              Cancel subscription
            </button>
          </div>
        </article>

        <div className="billing-consumption-grid">
          <article className="billing-figma-panel">
            <h2 className="console-h4">Consommation actuelle</h2>
            <div className="billing-donut-layout">
              <div
                className="billing-donut"
                style={{
                  background: `conic-gradient(#16a249 0 ${servicePercent}%, #cde8d5 ${servicePercent}% 100%)`
                }}
              >
                <div className="billing-donut-inner">
                  <strong>{toEuro(currentAmount)}</strong>
                  <span>HT</span>
                </div>
              </div>
              <div className="billing-legend">
                <p>
                  <span className="legend-dot service" />
                  Bare Metal <strong>{toEuro(serviceAmount)}</strong>
                </p>
                <p>
                  <span className="legend-dot object" />
                  Object Storage <strong>{toEuro(objectStorageAmount)}</strong>
                </p>
              </div>
            </div>
          </article>

          <article className="billing-figma-panel">
            <div className="billing-chart-head">
              <h2 className="console-h4">Consommation sur 6 mois</h2>
              <button className="billing-link-button" type="button">
                Afficher les détails
              </button>
            </div>
            <div className="billing-bars">
              {sixMonthData.map((value, index) => (
                <div className="billing-bar-col" key={`${value}-${index}`}>
                  <span className="billing-bar-value">{Math.round(value)}</span>
                  <div className="billing-bar-track">
                    <span className="billing-bar-fill" style={{ height: `${Math.max(10, (value / maxChart) * 100)}%` }} />
                  </div>
                  <span className="billing-bar-label">T{index + 1}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="billing-figma-panel" id="recent-invoices">
          <div className="billing-table-head">
            <h2 className="console-h4">Factures récentes</h2>
            <button className="primary-button narrow" onClick={handleExportInvoices} type="button">
              Convert
            </button>
          </div>
          <div className="billing-filter-row">
            <input
              className="field-input"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Filtrer..."
              type="text"
              value={searchTerm}
            />
            <button className="secondary-button narrow" onClick={handleExportInvoices} type="button">
              Voir toutes les factures
            </button>
          </div>
          <div className="billing-table-wrap">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>ID facture</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((invoice) => (
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
                {!paginatedInvoices.length && (
                  <tr>
                    <td className="billing-empty-row" colSpan={5}>
                      Aucune facture trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="billing-table-pager">
            <button className="secondary-button narrow" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} type="button">
              Previous
            </button>
            <button
              className="secondary-button narrow"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              type="button"
            >
              Next
            </button>
          </div>
        </article>

        <div className="billing-bottom-grid">
          <article className="billing-figma-panel">
            <h2 className="console-h4">Information de facturation</h2>
            <div className="billing-empty-box">
              <p className="console-caption">Current month: {currentMonth}</p>
              <p className="console-caption">Projected: {projectedAmount ? toEuro(projectedAmount) : projected}</p>
              <p className="console-caption">Plan: {currentPlanLabel}</p>
            </div>
          </article>
          <article className="billing-figma-panel">
            <h2 className="console-h4">Contact de facturation</h2>
            <div className="billing-empty-box">
              <p className="console-caption">{email}</p>
              <p className="console-caption">
                Card: {paymentBrand} •••• {paymentLast4}
              </p>
              <p className="console-caption">Next billing date: {nextInvoiceDate}</p>
            </div>
          </article>
        </div>

        {feedback && (
          <p className={`console-inline-feedback ${feedbackType === 'error' ? 'is-error' : 'is-success'}`}>
            {feedback}
          </p>
        )}
      </section>
    </ConsoleLayout>
  );
}
