# KP3P

Monorepo for the **KP3P** system: an **admin** dashboard (Next.js, Prisma, PostgreSQL) and a **patient intake** web app (Next.js) that talks to the admin APIs.

## Clone

```bash
git clone https://github.com/gopi-mygastroai/KP3P.git
cd KP3P
```

## Repository layout

| Directory | Description |
|-----------|-------------|
| [`admin/`](admin/) | Admin app — authentication, patients, assessments, **KP-3P care sheet generation** (Claude or Gemini via `src/lib/llm`), optional Google Drive uploads. Default dev URL: [http://localhost:3000](http://localhost:3000). |
| [`Patient-intake-form/`](Patient-intake-form/) | Patient-facing intake flow. Default dev URL: [http://localhost:3001](http://localhost:3001). |

## Prerequisites

- **Node.js** (LTS recommended) and **npm**
- **PostgreSQL** database for the admin app (see Prisma `datasource` in [`admin/prisma/schema.prisma`](admin/prisma/schema.prisma))

## Quick start

### 1. Admin (`admin/`)

```bash
cd admin
cp .env.example .env
# Edit .env: set POSTGRES_PRISMA_URL, LLM keys, and other variables (see below).

npm ci
npx prisma migrate deploy   # or `prisma migrate dev` in development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 2. Patient intake (`Patient-intake-form/`)

```bash
cd Patient-intake-form
cp .env.example .env.local
# Ensure NEXT_PUBLIC_API_URL points at the running admin app (default: http://localhost:3000).

npm ci
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

Run the **admin** app first so intake API calls (`/api/patients`, `/api/drive/upload`, etc.) resolve.

## Environment variables

Details and comments live in each app’s template files:

- **Admin:** [`admin/.env.example`](admin/.env.example) — database URL (`POSTGRES_PRISMA_URL`), **LLM provider** (`LLM_PROVIDER`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`), optional Google Drive OAuth fields, script-only keys for OpenRouter tests.
- **Intake:** [`Patient-intake-form/.env.example`](Patient-intake-form/.env.example) — `NEXT_PUBLIC_API_URL` (base URL of the admin app).

Never commit real `.env` or `.env.local` files; only the `*.example` templates belong in Git.

### LLM provider (care sheet generation)

Configure in `admin/.env` or `admin/.env.local`:

```env
# claude (default) | gemini
LLM_PROVIDER=claude

# Required when LLM_PROVIDER=claude
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Required when LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

| Provider | Default model | Implementation |
|----------|---------------|----------------|
| Claude | `claude-sonnet-4-6` | [`admin/src/lib/llm/claudeProvider.ts`](admin/src/lib/llm/claudeProvider.ts) |
| Gemini | `gemini-2.5-flash` | [`admin/src/lib/llm/geminiProvider.ts`](admin/src/lib/llm/geminiProvider.ts) |

Selection and startup validation live in [`admin/src/lib/llm/index.ts`](admin/src/lib/llm/index.ts). The API route [`admin/src/app/api/generate-caresheet/route.ts`](admin/src/app/api/generate-caresheet/route.ts) calls `llmProvider.generateCarePlan()` — it does not import SDKs directly.

After changing `LLM_PROVIDER` or keys, **restart** `npm run dev` so Next.js reloads environment variables.

See also [`admin/KP-3P care sheet.md`](admin/KP-3P%20care%20sheet.md) for the end-to-end click flow.

## Scripts (admin)

From `admin/`:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run test:llm` | Smoke test active LLM provider (`scripts/testLLM.ts`) |

See [`admin/package.json`](admin/package.json) for additional script entries (e.g. OpenRouter / legacy care-sheet test utilities).

## Tech stack

- [Next.js](https://nextjs.org/) (App Router), React, TypeScript (intake) / JS config (admin)
- [Prisma](https://www.prisma.io/) + PostgreSQL (admin)
- **LLM (care sheets):** Anthropic Claude and/or Google Gemini via [`admin/src/lib/llm/`](admin/src/lib/llm/)
- Optional: Google Drive API (admin)

## Contributing

1. Create a branch for your change.
2. Keep secrets out of commits; use `.env.example` for new configuration knobs.
3. Run lint/build in the app(s) you touch before opening a pull request.

## License

Specify your license here (e.g. MIT, proprietary). Until a `LICENSE` file is added, all rights are reserved unless stated otherwise.
