#!/usr/bin/env bash
# Create/update Secret Manager secrets from admin/.env.prod (gitignored local file).
# Usage: ./infra/seed-secrets-from-env.sh [path-to-env-file]
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-kp3p-prod}"
ENV_FILE="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/admin/.env.prod}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: Env file not found: $ENV_FILE"
  echo "Copy admin/.env.example to admin/.env.prod and fill in production values."
  exit 1
fi

upsert_secret() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" || "$value" == your_* || "$value" == postgresql://USER:* ]]; then
    echo "  skip $name (empty or placeholder in $ENV_FILE)"
    return 0
  fi
  if gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- --project="$PROJECT_ID" >/dev/null
    echo "  updated $name"
  else
    printf '%s' "$value" | gcloud secrets create "$name" --data-file=- --replication-policy=automatic --project="$PROJECT_ID" >/dev/null
    echo "  created $name"
  fi
}

read_env_var() {
  local key="$1"
  local line value
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -1 || true)"
  [[ -z "$line" ]] && return 0
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"
  printf '%s' "$value"
}

echo "==> Seeding secrets in $PROJECT_ID from $ENV_FILE"

SECRET_KEYS=(
  SUPABASE_URL
  SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  ANTHROPIC_API_KEY
  GEMINI_API_KEY
  POSTGRES_PRISMA_URL
  POSTGRES_URL_NON_POOLING
  LLM_PROVIDER
  GDRIVE_CLIENT_ID
  GDRIVE_CLIENT_SECRET
  GDRIVE_REFRESH_TOKEN
  GDRIVE_FOLDER_ID
)

for key in "${SECRET_KEYS[@]}"; do
  upsert_secret "$key" "$(read_env_var "$key")"
done

echo "==> Done."
