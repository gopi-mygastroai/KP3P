# KP3P

Monorepo for the **KP3P** system: an **admin** dashboard (Next.js, Supabase Auth/DB, Prisma migrations) and a **patient intake** web app (Next.js) that talks to the admin APIs.

## Clone

```bash
git clone https://github.com/gopi-mygastroai/KP3P.git
cd KP3P
```

## Repository layout

| Directory | Description |
|-----------|-------------|
| [`admin/`](admin/) | Admin app — Supabase Auth, patients, assessments, **KP-3P care sheet generation** (Claude or Gemini via `src/lib/llm`), optional Google Drive uploads. Default dev URL: [http://localhost:3000](http://localhost:3000). See [`admin/README.md`](admin/README.md). |
| [`Patient-intake-form/`](Patient-intake-form/) | Patient-facing intake flow. Default dev URL: [http://localhost:3001](http://localhost:3001). See [`Patient-intake-form/README.md`](Patient-intake-form/README.md). |
| `medical-lit/` | **Local only** (gitignored) — agent notes, prompt exports, and other docs not needed to build or run the apps. |

## Prerequisites

- **Node.js** (LTS recommended) and **npm**
- **Supabase** project (PostgreSQL + Auth) for the admin app
- PostgreSQL connection strings for running Prisma migrations only

## Quick start

### 1. Admin (`admin/`)

```bash
cd admin
cp .env.example .env
# Edit .env: SUPABASE_*, POSTGRES_* (migrations only), LLM keys, etc.

npm ci
npx prisma migrate deploy   # or `prisma migrate dev` in development
# Run admin/supabase/01_auth_identity_and_rls.sql in the Supabase SQL editor (once per env)
npm run create:admin-user -- admin@mygastro.ai "<your-password>"
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 2. Patient intake (`Patient-intake-form/`)

```bash
cd Patient-intake-form
cp .env.example .env.local
# NEXT_PUBLIC_API_URL → running admin app (default: http://localhost:3000)

npm ci
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

Run the **admin** app first so intake API calls (`/api/patients`, `/api/drive/upload`, etc.) resolve.

## Environment variables

Details and comments live in each app’s template files:

- **Admin:** [`admin/.env.example`](admin/.env.example) — **Supabase** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), Postgres URLs for **migrations only**, intake URL (`NEXT_PUBLIC_INTAKE_APP_URL`), **LLM provider** keys, optional Google Drive OAuth.
- **Intake:** [`Patient-intake-form/.env.example`](Patient-intake-form/.env.example) — `NEXT_PUBLIC_API_URL`.

Prisma Client runtime tuning vars (`PRISMA_LOG_QUERIES`, `PRISMA_CONNECTION_LIMIT`, etc.) are commented out in `.env.example` — the admin app uses Supabase JS at runtime.

Never commit real `.env` or `.env.local` files; only the `*.example` templates belong in Git.

### LLM provider (care sheet generation)

Configure in `admin/.env` or `admin/.env.local`:

```env
# gemini (default) | claude
LLM_PROVIDER=gemini

ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

| Provider | Default model | Implementation |
|----------|---------------|----------------|
| Claude | `claude-sonnet-4-6` | [`admin/src/lib/llm/claudeProvider.ts`](admin/src/lib/llm/claudeProvider.ts) |
| Gemini | `gemini-2.5-flash` | [`admin/src/lib/llm/geminiProvider.ts`](admin/src/lib/llm/geminiProvider.ts) |

Selection and lazy env validation: [`admin/src/lib/llm/index.ts`](admin/src/lib/llm/index.ts). The route [`admin/src/app/api/generate-caresheet/route.ts`](admin/src/app/api/generate-caresheet/route.ts) streams HTML as **`text/plain`** chunks via `generateCarePlan()` — runs on Cloud Run with 60-minute timeout, no Vercel serverless limit.

After changing `LLM_PROVIDER` or keys, **restart** `npm run dev`.

## Smoke test (admin after Supabase absorb)

| Step | Expected |
|------|----------|
| Open `/` | Login page loads |
| Login with `admin@mygastro.ai` | Redirects to `/admin` |
| Patient list | Loads (may be empty) |
| Create / edit patient | Saves without 401/500 |
| Assessment save | Persists |
| Intake submit → admin | New patient appears |
| Generate care sheet (if LLM key set) | Streams output |

## Scripts (admin)

From `admin/`:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build (`next build`) |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run create:admin-user` | Create/update Supabase Auth admin user |
| `npm run test:llm` | Smoke test active LLM provider |
| `npm run seed:rulebook-text` | Extract IBD rulebook PDF to cached `.txt` |
| `npm run count:llm-tokens` | Estimate care-sheet prompt size |

See [`admin/package.json`](admin/package.json) for additional script entries (OpenRouter / legacy test utilities).

## Deployment

### Admin app — Google Cloud Run

- Hosted on Google Cloud Run (project: `kp3p-prod`, region: `asia-south1`)
- Production URL: custom domain [https://www.gastroai.in](https://www.gastroai.in) (via Cloudflare proxy)
- Docker image: `asia-south1-docker.pkg.dev/kp3p-prod/kp3p-repo/kp3p-admin`
- Auto-deploys on push to `main` when files under `admin/` change (config: [`admin/cloudbuild.yaml`](admin/cloudbuild.yaml))
- One-time setup and migration from `kp3p-admin-prod`: [`infra/setup-kp3p-prod.sh`](infra/setup-kp3p-prod.sh)
- Pre-flight checks: [`infra/verify-kp3p-prod.sh`](infra/verify-kp3p-prod.sh)
- Secrets: include `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, plus LLM keys. `POSTGRES_*` needed for migration jobs only.
- Container timeout: 60 minutes (solves LLM generation timeout)

To manually deploy:

```bash
cd admin
gcloud builds submit --config=cloudbuild.yaml .. \
  --substitutions=_PROJECT_ID=kp3p-prod,_INTAKE_PUBLIC_URL=https://intake.gastroai.in
```

### Patient intake app — Google Cloud Run

- Hosted on Google Cloud Run (project: `kp3p-prod`, region: `asia-south1`)
- Suggested custom domain: `https://intake.gastroai.in` (configure in Cloudflare)
- Docker image: `asia-south1-docker.pkg.dev/kp3p-prod/kp3p-repo/kp3p-intake`
- Auto-deploys on push to `main` when files under `Patient-intake-form/` change (config: [`Patient-intake-form/cloudbuild.yaml`](Patient-intake-form/cloudbuild.yaml))

| Build-time variable | Value |
|---------------------|-------|
| `NEXT_PUBLIC_API_URL` | `https://www.gastroai.in` (admin API base URL) |

## Infrastructure

- **Google Cloud Project:** `kp3p-prod` (migrated from `kp3p-admin-prod`)
- **Region:** `asia-south1` (Mumbai)
- **Services used:** Cloud Run, Artifact Registry, Cloud Build, Secret Manager
- **Domain:** `gastroai.in` managed via Cloudflare (proxied) → Cloud Run
- **SSL:** Cloudflare (Full mode)
- **CI/CD:** Cloud Build triggers on push to `main` → builds Docker image → deploys to Cloud Run

## Tech stack

- [Next.js](https://nextjs.org/) (App Router), React, TypeScript
- [Supabase](https://supabase.com/) Auth + JS client (admin runtime); [Prisma](https://www.prisma.io/) for schema migrations only
- **LLM (care sheets):** Anthropic Claude and/or Google Gemini via [`admin/src/lib/llm/`](admin/src/lib/llm/)
- IBD guidelines: `admin/medical-doc/IBD_Clinical_Rulebook_Final2.pdf`
- Optional: Google Drive API (admin)

## Contributing

1. Create a branch for your change.
2. Keep secrets out of commits; use `.env.example` for new configuration knobs.
3. Run lint/build in the app(s) you touch before opening a pull request.
4. Only **`README.md`** files are tracked for Markdown; put non-essential docs in `medical-lit/` locally.

## License

Specify your license here (e.g. MIT, proprietary). Until a `LICENSE` file is added, all rights are reserved unless stated otherwise.
