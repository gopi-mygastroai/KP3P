# KP3P Patient intake

Patient-facing Next.js app for the KP3P intake flow. Submits data to the **admin** app APIs; does not host its own database or LLM logic.

Monorepo overview: [`../README.md`](../README.md). Admin setup: [`../admin/README.md`](../admin/README.md).

## Prerequisites

- Node.js (LTS) and npm
- **Admin app running** at the URL you configure (default [http://localhost:3000](http://localhost:3000))

## Setup

```bash
cd Patient-intake-form
cp .env.example .env.local
# NEXT_PUBLIC_API_URL must point at the admin app.

npm ci
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) (dev server uses port **3001**).

## Environment variables

See [`.env.example`](.env.example).

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the admin app (e.g. `http://localhost:3000`) |

Intake calls admin endpoints such as `POST ${NEXT_PUBLIC_API_URL}/api/patients` and drive upload routes when configured on the admin side.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Production server |

## Deploy on Google Cloud Run

Deploy as a Cloud Run service in project **`kp3p-prod`** (region `asia-south1`). Auto-deploy trigger: `deploy-kp3p-intake` (config: [`cloudbuild.yaml`](cloudbuild.yaml)).

| Build-time variable | Production value |
|---------------------|------------------|
| `NEXT_PUBLIC_API_URL` | `https://www.gastroai.in` |

Served publicly at `https://intake.gastroai.in` via a Cloudflare Worker that rewrites the request
host to this service's `run.app` URL; see [Domain and DNS](../README.md#domain-and-dns).

One-time setup (both apps): from repo root run [`../infra/setup-kp3p-prod.sh`](../infra/setup-kp3p-prod.sh).

Manual deploy from repo root:

```bash
gcloud builds submit --config=Patient-intake-form/cloudbuild.yaml \
  --substitutions=_PROJECT_ID=kp3p-prod,_ADMIN_PUBLIC_URL=https://www.gastroai.in
```

## Project layout (high level)

| Path | Role |
|------|------|
| `src/app/` | Intake pages and routes |
| `src/app/form/` | Main intake form (posts to admin API) |

## Local documentation

Agent notes and scratch files for this app are under **`../medical-lit/Patient-intake-form/`** (gitignored; not required to run the app).
