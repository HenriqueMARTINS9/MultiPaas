# MultiPaas Auth Scaffold

Generated from Figma file `6UWfi9AovvqAp5Pbtz1RNs`:

- Auth:
  - `206:6005` (login)
  - `206:7868` (signup)
- Console:
  - `206:9948` (dashboard)
  - `206:13991` (analytics)
  - `206:18049` (account)
  - `206:22131` (billing)

## Stack

- Frontend: Next.js `16.1.6` + React `19.2.4` + TypeScript `5.9.3`
- Backend: Django (`4.2.x`) + Django REST Framework + PostgreSQL + Stancer payments

## Frontend setup

Requires `Node.js >= 20.9.0` (Next.js `16.1.6` engine requirement).

```bash
cd frontend
npm install
npm run dev
```

Optional env var:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Main routes:

- `/` and `/signup` -> Sign up
- `/login` -> Sign in
- `/dashboard` -> Dashboard
- `/analytics` -> Analytics
- `/account` -> Account settings
- `/billing` -> Billing
- `/services` -> Billing alias

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

### PostgreSQL (recommended)

Example local PostgreSQL connection:

- `DJANGO_DB_ENGINE=django.db.backends.postgresql`
- `DJANGO_DB_NAME=multipaas`
- `DJANGO_DB_USER=multipaas`
- `DJANGO_DB_PASSWORD=multipaas`
- `DJANGO_DB_HOST=127.0.0.1`
- `DJANGO_DB_PORT=5432`

If you need local fallback:

- `DJANGO_DB_ENGINE=sqlite`

You can copy defaults from:

- `backend/.env.example`

Optional env vars:

- `DJANGO_DEBUG=1`
- `DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost`
- `DJANGO_CORS_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://localhost:3000`
- `DJANGO_CORS_ALLOW_ALL_ORIGINS=1` (useful in local/dev when frontend origin changes)
- `STANCER_API_BASE_URL=https://api.stancer.com`
- `STANCER_PRIVATE_KEY=<your_stancer_private_key>`
- `STANCER_PUBLIC_KEY=<your_stancer_public_key>`
- `STANCER_RETURN_URL=http://127.0.0.1:3000/billing`

## API contract

- `POST /api/auth/login/`
- Body:
  - `{"email":"user@example.com","password":"secret"}`
- Success `200`:
  - `{"message":"Sign in successful.","user":{"id":1,"email":"user@example.com"}}`
- Error `400/401`:
  - `{"detail":"..."}`

- `POST /api/auth/signup/`
- Body:
  - `{"email":"user@example.com","password":"secret"}`
- Success `201`:
  - `{"message":"Account created successfully.","user":{"id":2,"email":"user@example.com"}}`
- Error `400/409`:
  - `{"detail":"..."}`

- `GET /api/auth/profile/?email=user@example.com`
- Success `200`:
  - `{"user":{"id":2,"email":"user@example.com","first_name":"...","last_name":"...","account_type":"personal|company","profile_photo":"..."}}`

- `POST /api/auth/profile/`
- Body:
  - `{"email":"user@example.com","first_name":"...","last_name":"...","account_type":"personal|company","profile_photo":"..."}`
- Success `200`:
  - `{"message":"Profile updated.","user":{...}}`

- `POST /api/auth/change-password/`
- Body:
  - `{"email":"user@example.com","current_password":"...","new_password":"...","confirm_password":"..."}`
- Success `200`:
  - `{"message":"Password changed successfully."}`

- `GET /api/billing/summary/?email=user@example.com`
- Success `200`:
  - Billing profile, stats, and invoice list

- `POST /api/billing/subscription/`
- Body:
  - `{"email":"user@example.com","plan":"pro"}`

- `POST /api/billing/payment-method/`
- Body:
  - `{"email":"user@example.com","brand":"VISA","last4":"2481","expiry":"08/28"}`

- `POST /api/billing/checkout/`
- Body:
  - `{"email":"user@example.com","plan":"pro","amount_cents":7900,"currency":"eur","description":"Upgrade to Pro"}`
- Success `201`:
  - `{"checkout_url":"https://payment.stancer.com/...","payment_intent_id":"pi_...","invoice_id":"INV-..."}`

- `POST /api/billing/payment-intents/refresh/`
- Body:
  - `{"payment_intent_id":"pi_..."}`

## Deploy (online test)

Recommended for a quick first online version:

- Frontend on Vercel (Next.js)
- Backend on Vercel (Django serverless function)
- PostgreSQL on a managed provider (Neon/Supabase/Render PG/etc.)

### 1) Deploy backend (Vercel project #1)

Create a Vercel project with:

- Root directory: `backend`
- Framework preset: `Other`

This repo already includes Vercel backend files:

- `backend/vercel.json`
- `backend/api/index.py`

Set backend environment variables in Vercel:

- `DJANGO_DEBUG=0`
- `DJANGO_SECRET_KEY=<strong-random-secret>`
- `DJANGO_ALLOWED_HOSTS=.vercel.app`
- `DJANGO_CORS_ALLOW_ALL_ORIGINS=0`
- `DJANGO_CORS_ALLOWED_ORIGINS=https://<your-frontend>.vercel.app`
- `DJANGO_CSRF_TRUSTED_ORIGINS=https://<your-frontend>.vercel.app`
- `DATABASE_URL=<managed-postgres-connection-string>`
  - Alternative: use `POSTGRES_URL` if your provider exposes that name.
- `STANCER_API_BASE_URL=https://api.stancer.com`
- `STANCER_PRIVATE_KEY=<your_stancer_private_key>`
- `STANCER_PUBLIC_KEY=<your_stancer_public_key>`
- `STANCER_RETURN_URL=https://<your-frontend>.vercel.app/billing`

Run migrations against your managed PostgreSQL from local once:

```powershell
cd backend
.\.venv\Scripts\activate
$env:DJANGO_DEBUG='0'
$env:DATABASE_URL='postgres://...'
python manage.py migrate
```

### 2) Deploy frontend (Vercel project #2)

Create a second Vercel project with:

- Root directory: `frontend`
- Framework preset: `Next.js`

Set frontend environment variable:

- `NEXT_PUBLIC_API_BASE_URL=https://<your-backend>.vercel.app`

Redeploy frontend after setting env vars.

### 3) Optional CLI flow

```powershell
npm i -g vercel

cd backend
vercel --prod

cd ..\frontend
vercel --prod
```

## Figma MCP note

Node `206:22131` could not be fetched in this session because the Figma MCP seat limit was reached. The Billing page is implemented and styled to match the existing console pattern, and can be refined further once MCP access is available again.
