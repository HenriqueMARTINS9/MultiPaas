import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

type Feedback = {
  message: string;
  type: 'error' | 'success';
};

export default function SignUpCard() {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/signup/`, {
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
          message: payload.detail || `Sign up failed (HTTP ${response.status}).`
        });
      } else {
        if (typeof window !== 'undefined' && payload.user) {
          window.localStorage.setItem('mpconsole_user', JSON.stringify(payload.user));
        }
        setFeedback({
          type: 'success',
          message: payload.message || 'Account created successfully.'
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
    <main className="auth-page" data-node-id="206:7868">
      <section className="auth-center" data-node-id="206:7869">
        <div className="auth-card" data-node-id="206:7870">
          <header className="auth-header" data-node-id="206:7871">
            <h1 className="auth-title" data-node-id="206:7873">
              Create account
            </h1>
            <p className="auth-subtitle" data-node-id="206:7876">
              Start using your cloud console
            </p>
          </header>

          <form className="auth-form" data-node-id="206:7878" onSubmit={handleSubmit}>
            <div className="field-group" data-node-id="206:7879">
              <label className="field-label" data-node-id="206:7880" htmlFor="signup-email">
                Email
              </label>
              <input
                id="signup-email"
                className="field-input"
                data-node-id="206:7881"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="field-group" data-node-id="206:7883">
              <label className="field-label" data-node-id="206:7884" htmlFor="signup-password">
                Password
              </label>
              <input
                id="signup-password"
                className="field-input"
                data-node-id="206:7885"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button className="primary-button" data-node-id="206:7887" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <p className="auth-note" data-node-id="206:7889">
            Already have an account?{' '}
            <Link className="auth-link" href="/login">
              Sign in
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
