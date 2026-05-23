# KP3P Admin

Next.js admin dashboard for patient records, assessments, **KP-3P care sheet generation** (Claude or Gemini), and optional Google Drive uploads. Uses Prisma and PostgreSQL.

Monorepo overview: [`../README.md`](../README.md).

## Prerequisites

- Node.js (LTS) and npm
- PostgreSQL (see [`prisma/schema.prisma`](prisma/schema.prisma))

## Setup

```bash
cd admin
cp .env.example .env
# Set POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING, and LLM keys (see below).

npm ci
npx prisma migrate deploy   # or `prisma migrate dev` locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.example`](.env.example). Required for normal operation:

| Variable | Purpose |
|----------|---------|
| `POSTGRES_PRISMA_URL` | Pooled Postgres URL for the app |
| `POSTGRES_URL_NON_POOLING` | Direct URL for `prisma migrate` |
| `LLM_PROVIDER` | `gemini` (default) or `claude` |
| `ANTHROPIC_API_KEY` | Required when `LLM_PROVIDER=claude` |
| `GEMINI_API_KEY` | Required when `LLM_PROVIDER=gemini` |

Optional: `CLAUDE_MODEL`, `GEMINI_MODEL`, Google Drive OAuth fields (`GDRIVE_*`).

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
| `npm run build` | `prisma generate` + `next build` |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run test:llm` | Smoke test active LLM provider |
| `npm run seed:rulebook-text` | Extract rulebook PDF → `.txt` cache |
| `npm run count:llm-tokens` | Estimate prompt token size for a sample patient |

Legacy/script-only: `test:openrouter`, `test:generate-care-sheet`, `seed:care-sheet-prompt`.

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
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `POSTGRES_PRISMA_URL` | Pooled Postgres connection URL |
| `POSTGRES_URL_NON_POOLING` | Direct Postgres URL for migrations |
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
  -e POSTGRES_PRISMA_URL="postgresql://test" \
  -e LLM_PROVIDER="gemini" \
  -e GEMINI_API_KEY="your_gemini_api_key_here" \
  kp3p-admin
```

## Project layout (high level)

| Path | Role |
|------|------|
| `src/app/admin/` | Admin UI (patients, assessments) |
| `src/app/api/generate-caresheet/` | Streaming care sheet API |
| `src/lib/llm/` | LLM provider abstraction |
| `src/lib/load-ibd-rulebook.ts` | PDF / cached text for guidelines |
| `src/lib/kp3p-prompt.ts` | Patient prompt builder |
| `medical-doc/` | IBD clinical rulebook PDF |
| `prisma/` | Schema and migrations |

## Local documentation

Agent notes, prompt exports, and extended care-sheet notes live under **`../medical-lit/admin/`** (gitignored; not required to run the app).
