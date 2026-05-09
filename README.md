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
| [`admin/`](admin/) | Admin app — authentication, patients, assessments, care sheet generation (Gemini), optional Google Drive uploads. Default dev URL: [http://localhost:3000](http://localhost:3000). |
| [`Patient-intake-form/`](Patient-intake-form/) | Patient-facing intake flow. Default dev URL: [http://localhost:3001](http://localhost:3001). |

## Prerequisites

- **Node.js** (LTS recommended) and **npm**
- **PostgreSQL** database for the admin app (see Prisma `datasource` in [`admin/prisma/schema.prisma`](admin/prisma/schema.prisma))

## Quick start

### 1. Admin (`admin/`)

```bash
cd admin
cp .env.example .env
# Edit .env: set POSTGRES_PRISMA_URL and other variables (see below).

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

- **Admin:** [`admin/.env.example`](admin/.env.example) — database URL (`POSTGRES_PRISMA_URL`), `GEMINI_API_KEY` for care sheet generation, optional Google Drive OAuth fields, script-only keys for OpenRouter tests.
- **Intake:** [`Patient-intake-form/.env.example`](Patient-intake-form/.env.example) — `NEXT_PUBLIC_API_URL` (base URL of the admin app).

Never commit real `.env` or `.env.local` files; only the `*.example` templates belong in Git.

## Scripts (admin)

From `admin/`:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build (`prisma generate` + `next build`) |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

See [`admin/package.json`](admin/package.json) for additional script entries (e.g. care sheet / OpenRouter test utilities).

## Tech stack

- [Next.js](https://nextjs.org/) (App Router), React, TypeScript (intake) / JS config (admin)
- [Prisma](https://www.prisma.io/) + PostgreSQL (admin)
- Optional: Google Gemini, Google Drive API (admin)

## Contributing

1. Create a branch for your change.
2. Keep secrets out of commits; use `.env.example` for new configuration knobs.
3. Run lint/build in the app(s) you touch before opening a pull request.

## License

Specify your license here (e.g. MIT, proprietary). Until a `LICENSE` file is added, all rights are reserved unless stated otherwise.
