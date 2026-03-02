import { useMemo, useState } from 'react';
import ConsoleLayout from './ConsoleLayout';

type Range = 'hour' | 'day' | 'month' | 'year';

type AnalyticsData = {
  buckets: string;
  bytes: string;
  meanBytes: string;
  objects: string;
};

const RANGE_LABELS: Record<Range, string> = {
  day: 'Day',
  hour: 'Hour',
  month: 'Month',
  year: 'Year'
};

const RANGE_DATA: Record<Range, AnalyticsData> = {
  day: {
    buckets: '0',
    bytes: '0 B',
    meanBytes: '0 B',
    objects: '0'
  },
  hour: {
    buckets: '0',
    bytes: '0 B',
    meanBytes: '0 B',
    objects: '0'
  },
  month: {
    buckets: '0',
    bytes: '0 B',
    meanBytes: '0 B',
    objects: '0'
  },
  year: {
    buckets: '0',
    bytes: '0 B',
    meanBytes: '0 B',
    objects: '0'
  }
};

export default function AnalyticsScreen() {
  const [range, setRange] = useState<Range>('day');
  const values = useMemo(() => RANGE_DATA[range], [range]);

  return (
    <ConsoleLayout activeRoute="analytics">
      <section className="analytics-screen" data-node-id="206:13991">
        <div className="analytics-topbar">
          <h1 className="console-h3">Analytics</h1>
          <div className="analytics-tabs">
            {Object.entries(RANGE_LABELS).map(([key, label]) => {
              const selected = range === key;
              return (
                <button
                  aria-pressed={selected}
                  className={`analytics-tab ${selected ? 'analytics-tab-active' : ''}`}
                  key={key}
                  onClick={() => setRange(key as Range)}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="analytics-grid">
          <article className="analytics-card">
            <h2 className="analytics-card-title">Stored Bytes</h2>
            <div className="analytics-chart-placeholder" />
          </article>
          <article className="analytics-card">
            <h2 className="analytics-card-title">Objects</h2>
            <div className="analytics-chart-placeholder" />
          </article>
          <article className="analytics-card">
            <h2 className="analytics-card-title">Buckets</h2>
            <div className="analytics-chart-placeholder" />
          </article>
        </div>

        <section className="latest-values">
          <h2 className="analytics-card-title">Latest values</h2>
          <div className="latest-values-grid">
            <div>
              <p className="latest-label">Buckets</p>
              <p className="latest-value">{values.buckets}</p>
            </div>
            <div>
              <p className="latest-label">Objects</p>
              <p className="latest-value">{values.objects}</p>
            </div>
            <div>
              <p className="latest-label">Bytes</p>
              <p className="latest-value">{values.bytes}</p>
            </div>
            <div>
              <p className="latest-label">Mean (Bytes)</p>
              <p className="latest-value">{values.meanBytes}</p>
            </div>
          </div>
        </section>
      </section>
    </ConsoleLayout>
  );
}
