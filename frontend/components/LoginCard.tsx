import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

type Feedback = {
  message: string;
  type: 'error' | 'success';
};

export default function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      let payload: { detail?: string; message?: string; user?: { email?: string; id?: number } } = {};
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        payload = await response.json();
      }

      if (!response.ok) {
        setFeedback({
          type: 'error',
          message: payload.detail || `Sign in failed (HTTP ${response.status}).`
        });
      } else {
        if (typeof window !== 'undefined' && payload.user) {
          window.localStorage.setItem('mpconsole_user', JSON.stringify(payload.user));
        }
        setFeedback({
          type: 'success',
          message: payload.message || 'Sign in successful.'
        });
        await router.push('/dashboard');
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: `Unable to reach backend at ${API_BASE_URL}.`
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page" data-node-id="206:6005">
      <section className="auth-center" data-node-id="206:6008">
        <div className="auth-card" data-node-id="206:6010">
          <header className="auth-header" data-node-id="206:6015">
            <h1 className="auth-title" data-node-id="206:6017">
              Sign in
            </h1>
            <p className="auth-subtitle" data-node-id="206:6025">
              Access your cloud console
            </p>
          </header>

          <form className="auth-form" data-node-id="206:6032" onSubmit={handleSubmit}>
            <div className="field-group" data-node-id="206:6033">
              <label className="field-label" data-node-id="206:6035" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className="field-input"
                data-node-id="206:6037"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="field-group" data-node-id="206:6039">
              <label className="field-label" data-node-id="206:6040" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                className="field-input"
                data-node-id="206:6041"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button className="primary-button" data-node-id="206:6043" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-note" data-node-id="206:6046">
            Don&apos;t have an account?{' '}
            <Link className="auth-link" href="/signup">
              Sign up
            </Link>
          </p>

          {feedback && (
            <p
              className={`auth-feedback ${
                feedback.type === 'error' ? 'auth-feedback-error' : 'auth-feedback-success'
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
