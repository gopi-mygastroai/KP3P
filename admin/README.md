# KP3P Admin

Next.js admin dashboard for patient records, assessments, **KP-3P care sheet generation** (Claude or Gemini), and optional Google Drive uploads. Uses **Supabase** (PostgreSQL, Auth, RLS) for data and authentication. Prisma is retained only for schema migrations (`prisma/schema.prisma`).

Monorepo overview: [`../README.md`](../README.md).

## Prerequisites

- Node.js (LTS) and npm
- Supabase project (PostgreSQL + Auth)
- PostgreSQL connection strings for running migrations (see [`prisma/schema.prisma`](prisma/schema.prisma))

## Setup

```bash
cd admin
cp .env.example .env
# Set SUPABASE_*, POSTGRES_* (for migrations), and LLM keys (see below).

npm ci
npx prisma migrate deploy   # or `prisma migrate dev` locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.example`](.env.example). Required for normal operation:

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side repository tasks) |
| `SUPABASE_ANON_KEY` | Anon key (auth/session + RLS-scoped queries) |
| `POSTGRES_PRISMA_URL` | Pooled Postgres URL — for `prisma migrate` only |
| `POSTGRES_URL_NON_POOLING` | Direct URL — for `prisma migrate` only |
| `NEXT_PUBLIC_INTAKE_APP_URL` | Patient intake app URL (default `http://localhost:3001`) |
| `LLM_PROVIDER` | `gemini` (default) or `claude` |
| `ANTHROPIC_API_KEY` | Required when `LLM_PROVIDER=claude` |
| `GEMINI_API_KEY` | Required when `LLM_PROVIDER=gemini` |

Optional: `CLAUDE_MODEL`, `GEMINI_MODEL`, Google Drive OAuth fields (`GDRIVE_*`).

Prisma Client runtime tuning (`PRISMA_LOG_QUERIES`, `PRISMA_CONNECTION_LIMIT`, `PRISMA_POOL_TIMEOUT`, `PRISMA_PG_BOUNCER`) is unused and commented out in `.env.example`.

After changing env vars, restart `npm run dev`.

## Care sheet generation

- **UI:** Patient assessment → **Download KP-3P Care Sheet** (`src/components/CaresheetButton.tsx`).
- **API:** `POST /api/generate-caresheet` — streams HTML as **`text/plain`** (not JSON). No timeout limit on Cloud Run (configured for 60 minutes).
- **LLM:** [`src/lib/llm/`](src/lib/llm/) — `claudeProvider.ts` / `geminiProvider.ts`, selected in [`index.ts`](src/lib/llm/index.ts).
- **Guidelines:** `medical-doc/IBD_Clinical_Rulebook_Final2.pdf` (text cached to `IBD_Clinical_Rulebook_Final2.txt` on first use; `.txt` is gitignored).

| Provider | Default model |
|----------|---------------|
| Claude | `claude-sonnet-4-6` |
| Gemini | `gemini-2.5-flash` |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (`next dev --webpack`) |
| `npm run build` | `next build` |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run test:llm` | Smoke test active LLM provider |
| `npm run seed:rulebook-text` | Extract rulebook PDF → `.txt` cache |
| `npm run count:llm-tokens` | Estimate prompt token size for a sample patient |
| `npm run create:admin-user` | Create/update Supabase Auth admin user |

Legacy/script-only: `test:openrouter`, `test:generate-care-sheet`, `seed:care-sheet-prompt`.

## Supabase Auth + RLS

The app uses Supabase Auth for login and Supabase JS for all runtime data access. Row-level security policies enforce admin vs owner access at the database level.

1. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
2. Run `npx prisma migrate deploy` to create tables.
3. Run `supabase/01_auth_identity_and_rls.sql` in Supabase SQL editor.
4. Create the admin auth user (once per environment):

```bash
node scripts/create-admin-user.mjs admin@mygastro.ai "<your-password>"
```

## Deploy on Vercel

### 1. Push code

Commit and push to `main`. Vercel redeploys automatically if the project is linked to GitHub.

Ensure **Root Directory** in Vercel project settings is `admin` (monorepo layout).

### 2. Set environment variables

In Vercel → Project → Settings → Environment Variables, set these for **Production**:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API (server-only) |
| `LLM_PROVIDER` | `gemini` or `claude` |
| `GEMINI_API_KEY` | Required when `LLM_PROVIDER=gemini` |
| `ANTHROPIC_API_KEY` | Required when `LLM_PROVIDER=claude` |

Optional: `CLAUDE_MODEL`, `GEMINI_MODEL`, `GDRIVE_*`.

`POSTGRES_*` URLs are **not** required at runtime or build time (only for running migrations locally).

After changing env vars, trigger a **Redeploy**.

### 3. One-time Supabase setup (production DB)

If not already done on the same Supabase project Vercel uses:

1. Run `npx prisma migrate deploy` against that database (from `admin/` with production URLs).
2. Run `supabase/01_auth_identity_and_rls.sql` in Supabase SQL editor.
3. Create admin user: `node scripts/create-admin-user.mjs admin@mygastro.ai "<password>"`.

### 4. Production smoke test

After deploy succeeds:

| Step | Expected |
|------|----------|
| Open `/` | Login page loads |
| Login with `admin@mygastro.ai` | Redirects to `/admin` |
| Patient list | Loads (may be empty) |
| Create patient (`/admin/patient/new`) | Saves and redirects |
| Open assessment → Disease Characteristics → Save | Saves without 401/500 |
| Generate care sheet (if LLM key set) | Streams output |

If login returns 401, confirm the admin user exists in Supabase Auth (Authentication → Users).

If save returns 500 with `updatedAt` or RLS errors, confirm migrations and RLS SQL ran on production DB.

## Deploy on Google Cloud Run

### Prerequisites

- Google Cloud CLI installed and authenticated (`gcloud auth login`)
- Docker Desktop installed and running
- Google Cloud project: `kp3p-admin-prod`

### First time setup (already done — for reference)

```bash
gcloud config set project kp3p-admin-prod
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
gcloud artifacts repositories create kp3p-repo --repository-format=docker --location=asia-south1
```

### Secrets (stored in Google Secret Manager)

| Secret name | Purpose |
|-------------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `POSTGRES_PRISMA_URL` | Pooled Postgres URL (migrations only) |
| `POSTGRES_URL_NON_POOLING` | Direct Postgres URL (migrations only) |
| `LLM_PROVIDER` | `claude` or `gemini` |

### Manual deploy

```bash
cd admin
gcloud builds submit --tag asia-south1-docker.pkg.dev/kp3p-admin-prod/kp3p-repo/kp3p-admin:latest .
gcloud run deploy kp3p-admin \
  --image asia-south1-docker.pkg.dev/kp3p-admin-prod/kp3p-repo/kp3p-admin:latest \
  --region asia-south1 \
  --project kp3p-admin-prod
```

### Auto deploy

Every push to the `main` branch triggers Cloud Build automatically via [`cloudbuild.yaml`](cloudbuild.yaml).

Monitor builds at: [Cloud Build console](https://console.cloud.google.com/cloud-build/builds?project=kp3p-admin-prod)

### Run DB migrations (run after first deploy or schema changes)

```bash
gcloud run jobs execute migrate-db --region asia-south1 --wait
```

### Production URLs

- Cloud Run: [https://kp3p-admin-452734733972.asia-south1.run.app](https://kp3p-admin-452734733972.asia-south1.run.app)
- Custom domain: [https://www.gastroai.in](https://www.gastroai.in)

## Docker

- **Dockerfile location:** `admin/Dockerfile`
- **Multi-stage build:** deps → builder → runner
- **Build context:** must be run from the `admin/` directory
- **Port:** 8080 (Cloud Run requirement)

Test locally:

```bash
docker build -t kp3p-admin .
docker run -p 8080:8080 \
  -e SUPABASE_URL="https://<project-ref>.supabase.co" \
  -e SUPABASE_ANON_KEY="your_anon_key" \
  -e SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" \
  -e LLM_PROVIDER="gemini" \
  -e GEMINI_API_KEY="your_gemini_api_key_here" \
  kp3p-admin
```

## Project layout (high level)

| Path | Role |
|------|------|
| `src/app/admin/` | Admin UI (patients, assessments) |
| `src/app/api/generate-caresheet/` | Streaming care sheet API |
| `src/lib/supabase/` | Supabase admin + auth session clients |
| `src/lib/patient-repository.ts` | Runtime patient CRUD via Supabase |
| `src/lib/llm/` | LLM provider abstraction |
| `src/lib/load-ibd-rulebook.ts` | PDF / cached text for guidelines |
| `src/lib/kp3p-prompt.ts` | Patient prompt builder |
| `supabase/` | Auth identity + RLS SQL (run once per env) |
| `medical-doc/` | IBD clinical rulebook PDF |
| `prisma/` | Schema and migrations (migrate only) |

## Local documentation

Agent notes, prompt exports, and extended care-sheet notes live under **`../medical-lit/admin/`** (gitignored; not required to run the app).
