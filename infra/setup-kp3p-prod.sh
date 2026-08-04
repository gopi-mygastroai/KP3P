#!/usr/bin/env bash
# One-time GCP setup: kp3p-prod project — Artifact Registry, secrets, Cloud Run, CI/CD triggers.
# Run from repo root after: gcloud auth login && gcloud config set project kp3p-prod
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-kp3p-prod}"
OLD_PROJECT_ID="${OLD_PROJECT_ID:-kp3p-admin-prod}"
REGION="${REGION:-asia-south1}"
ARTIFACT_REPO="${ARTIFACT_REPO:-kp3p-repo}"
ADMIN_SERVICE="${ADMIN_SERVICE:-kp3p-admin}"
INTAKE_SERVICE="${INTAKE_SERVICE:-kp3p-intake}"
GITHUB_OWNER="${GITHUB_OWNER:-gopi-mygastroai}"
GITHUB_REPO="${GITHUB_REPO:-KP3P}"
BRANCH="${BRANCH:-^main$}"

# Public URLs baked into Next.js at Docker build time (override if using different domains).
ADMIN_PUBLIC_URL="${ADMIN_PUBLIC_URL:-https://www.gastroai.in}"
INTAKE_PUBLIC_URL="${INTAKE_PUBLIC_URL:-https://intake.gastroai.in}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Project: $PROJECT_ID | Region: $REGION"
gcloud config set project "$PROJECT_ID"

if gcloud auth application-default print-access-token &>/dev/null; then
  echo "==> Aligning Application Default Credentials quota project..."
  if ! gcloud auth application-default set-quota-project "$PROJECT_ID" --quiet 2>/dev/null; then
    echo "    ADC quota project not updated. If you see invalid_grant, run:"
    echo "      gcloud auth application-default login"
    echo "      gcloud auth application-default set-quota-project $PROJECT_ID"
  fi
else
  echo "==> Application Default Credentials missing or expired."
  echo "    Run: gcloud auth application-default login"
  echo "    Then: gcloud auth application-default set-quota-project $PROJECT_ID"
fi

echo "==> Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  iam.googleapis.com \
  --project="$PROJECT_ID"

echo "==> Creating Artifact Registry repository (if missing)..."
if ! gcloud artifacts repositories describe "$ARTIFACT_REPO" \
  --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  gcloud artifacts repositories create "$ARTIFACT_REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="KP3P Docker images" \
    --project="$PROJECT_ID"
fi

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "==> Granting IAM to Cloud Build and default compute service accounts..."
for sa in "${CLOUD_BUILD_SA}" "${COMPUTE_SA}"; do
  for role in roles/storage.admin roles/artifactregistry.writer roles/run.admin roles/iam.serviceAccountUser roles/secretmanager.secretAccessor roles/logging.logWriter; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
      --member="serviceAccount:${sa}" \
      --role="$role" \
      --quiet >/dev/null
  done
done

copy_secret_from_old() {
  local name="$1"
  if ! gcloud secrets describe "$name" --project="$OLD_PROJECT_ID" &>/dev/null; then
    echo "    skip $name (not in $OLD_PROJECT_ID)"
    return 0
  fi
  if ! gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    gcloud secrets create "$name" \
      --replication-policy=automatic \
      --project="$PROJECT_ID"
  fi
  gcloud secrets versions access latest --secret="$name" --project="$OLD_PROJECT_ID" \
    | gcloud secrets versions add "$name" --data-file=- --project="$PROJECT_ID" >/dev/null
  echo "    copied $name"
}

echo "==> Copying secrets from $OLD_PROJECT_ID (skip if old project inaccessible)..."
ADMIN_SECRETS=(
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
for s in "${ADMIN_SECRETS[@]}"; do
  copy_secret_from_old "$s" || true
done

ENV_PROD="${REPO_ROOT}/admin/.env.prod"
if [[ -f "$ENV_PROD" ]]; then
  echo "==> Seeding missing secrets from admin/.env.prod..."
  PROJECT_ID="$PROJECT_ID" "$REPO_ROOT/infra/seed-secrets-from-env.sh" "$ENV_PROD"
elif ! gcloud secrets describe SUPABASE_URL --project="$PROJECT_ID" &>/dev/null; then
  echo "WARNING: SUPABASE_URL not in Secret Manager and admin/.env.prod not found."
  echo "         Create admin/.env.prod or add secrets manually before Cloud Run will work."
fi

echo "==> Ensuring LLM_PROVIDER secret exists..."
if ! gcloud secrets describe LLM_PROVIDER --project="$PROJECT_ID" &>/dev/null; then
  printf '%s' 'gemini' | gcloud secrets create LLM_PROVIDER \
    --data-file=- \
    --replication-policy=automatic \
    --project="$PROJECT_ID"
  echo "    created LLM_PROVIDER=gemini"
fi

ADMIN_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${ADMIN_SERVICE}:bootstrap"
INTAKE_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/${INTAKE_SERVICE}:bootstrap"

echo "==> Bootstrap build + deploy admin ($ADMIN_SERVICE)..."
gcloud builds submit \
  --config=admin/cloudbuild.yaml \
  --substitutions="_PROJECT_ID=${PROJECT_ID},_REGION=${REGION},_ARTIFACT_REPO=${ARTIFACT_REPO},_SERVICE=${ADMIN_SERVICE},_INTAKE_PUBLIC_URL=${INTAKE_PUBLIC_URL},COMMIT_SHA=bootstrap" \
  --project="$PROJECT_ID"

echo "==> Bootstrap build + deploy intake ($INTAKE_SERVICE)..."
gcloud builds submit \
  --config=Patient-intake-form/cloudbuild.yaml \
  --substitutions="_PROJECT_ID=${PROJECT_ID},_REGION=${REGION},_ARTIFACT_REPO=${ARTIFACT_REPO},_SERVICE=${INTAKE_SERVICE},_ADMIN_PUBLIC_URL=${ADMIN_PUBLIC_URL},COMMIT_SHA=bootstrap" \
  --project="$PROJECT_ID"

echo "==> Configuring Cloud Run services (secrets, timeout, public access)..."
ADMIN_SECRET_BINDINGS=""
bind_secret_if_exists() {
  local name="$1"
  if gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    if [[ -n "$ADMIN_SECRET_BINDINGS" ]]; then
      ADMIN_SECRET_BINDINGS+=","
    fi
    ADMIN_SECRET_BINDINGS+="${name}=${name}:latest"
  else
    echo "    skip secret binding $name (not in Secret Manager)"
  fi
}

for s in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY ANTHROPIC_API_KEY GEMINI_API_KEY POSTGRES_PRISMA_URL POSTGRES_URL_NON_POOLING LLM_PROVIDER GDRIVE_CLIENT_ID GDRIVE_CLIENT_SECRET GDRIVE_REFRESH_TOKEN GDRIVE_FOLDER_ID; do
  bind_secret_if_exists "$s"
done

if [[ -z "$ADMIN_SECRET_BINDINGS" ]]; then
  echo "ERROR: No secrets available to bind to $ADMIN_SERVICE. Add secrets and re-run."
  exit 1
fi

gcloud run services update "$ADMIN_SERVICE" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --set-secrets="$ADMIN_SECRET_BINDINGS" \
  --timeout=3600 \
  --memory=2Gi \
  --cpu=2 \
  --quiet

allow_public_invoker() {
  local service="$1"
  gcloud run services add-iam-policy-binding "$service" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --quiet >/dev/null 2>&1 || true
}

allow_public_invoker "$ADMIN_SERVICE"
allow_public_invoker "$INTAKE_SERVICE"

ADMIN_URL="$(gcloud run services describe "$ADMIN_SERVICE" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
INTAKE_URL="$(gcloud run services describe "$INTAKE_SERVICE" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
echo "    Admin URL:  $ADMIN_URL"
echo "    Intake URL: $INTAKE_URL"

echo "==> Creating Cloud Build triggers (requires GitHub repo connected)..."
if ! gcloud builds triggers create github --help &>/dev/null; then
  echo "    WARNING: gcloud builds triggers unavailable"
elif gcloud builds triggers list --project="$PROJECT_ID" --format="value(name)" 2>/dev/null | grep -q deploy-kp3p-admin; then
  echo "    triggers already exist"
else
  echo "    GitHub not connected yet — run: ./infra/connect-github-triggers.sh"
fi

echo ""
echo "==> Setup complete."
echo "Next steps:"
echo "  1. Update the Cloudflare Worker host map (NOT DNS -- see README 'Domain and DNS'):"
echo "       www.gastroai.in / gastroai.in -> ${ADMIN_URL#https://}"
echo "       intake.gastroai.in            -> ${INTAKE_URL#https://}"
echo "     Cloud Run domain mapping is unavailable in $REGION, so the Worker does the host rewrite."
echo "  3. Connect GitHub for auto-deploy: ./infra/connect-github-triggers.sh"
echo "  4. Disable/delete old triggers in project $OLD_PROJECT_ID when cutover is verified"
echo "  5. Run DB migrations if needed: gcloud run jobs execute migrate-db --region=$REGION --project=$PROJECT_ID --wait"
