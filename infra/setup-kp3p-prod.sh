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

echo "==> Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
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

echo "==> Granting IAM to Cloud Build service account..."
for role in roles/run.admin roles/artifactregistry.writer roles/iam.serviceAccountUser roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="$role" \
    --quiet >/dev/null
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
  GDRIVE_CLIENT_ID
  GDRIVE_CLIENT_SECRET
  GDRIVE_REFRESH_TOKEN
  GDRIVE_FOLDER_ID
)
for s in "${ADMIN_SECRETS[@]}"; do
  copy_secret_from_old "$s" || true
done

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
ADMIN_SECRET_BINDINGS="SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,POSTGRES_PRISMA_URL=POSTGRES_PRISMA_URL:latest,POSTGRES_URL_NON_POOLING=POSTGRES_URL_NON_POOLING:latest,LLM_PROVIDER=LLM_PROVIDER:latest"
for opt in GDRIVE_CLIENT_ID GDRIVE_CLIENT_SECRET GDRIVE_REFRESH_TOKEN GDRIVE_FOLDER_ID; do
  if gcloud secrets describe "$opt" --project="$PROJECT_ID" &>/dev/null; then
    ADMIN_SECRET_BINDINGS+=",${opt}=${opt}:latest"
  fi
done

gcloud run services update "$ADMIN_SERVICE" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --set-secrets="$ADMIN_SECRET_BINDINGS" \
  --timeout=3600 \
  --memory=2Gi \
  --cpu=2 \
  --quiet

gcloud run services update "$ADMIN_SERVICE" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --allow-unauthenticated \
  --quiet

gcloud run services update "$INTAKE_SERVICE" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --allow-unauthenticated \
  --quiet

ADMIN_URL="$(gcloud run services describe "$ADMIN_SERVICE" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
INTAKE_URL="$(gcloud run services describe "$INTAKE_SERVICE" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
echo "    Admin URL:  $ADMIN_URL"
echo "    Intake URL: $INTAKE_URL"

echo "==> Creating Cloud Build triggers (requires GitHub repo connected in Cloud Console)..."
create_trigger() {
  local name="$1"
  local config="$2"
  local included="$3"
  local subs="$4"

  if gcloud builds triggers describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    echo "    trigger $name already exists — updating"
    gcloud builds triggers update github "$name" \
      --repo-name="$GITHUB_REPO" \
      --repo-owner="$GITHUB_OWNER" \
      --branch-pattern="$BRANCH" \
      --build-config="$config" \
      --included-files="$included" \
      --substitutions="$subs" \
      --project="$PROJECT_ID"
  else
    gcloud builds triggers create github \
      --name="$name" \
      --repo-name="$GITHUB_REPO" \
      --repo-owner="$GITHUB_OWNER" \
      --branch-pattern="$BRANCH" \
      --build-config="$config" \
      --included-files="$included" \
      --substitutions="$subs" \
      --project="$PROJECT_ID"
  fi
}

create_trigger "deploy-kp3p-admin" "admin/cloudbuild.yaml" "admin/**" \
  "_PROJECT_ID=${PROJECT_ID},_REGION=${REGION},_ARTIFACT_REPO=${ARTIFACT_REPO},_SERVICE=${ADMIN_SERVICE},_INTAKE_PUBLIC_URL=${INTAKE_PUBLIC_URL}"

create_trigger "deploy-kp3p-intake" "Patient-intake-form/cloudbuild.yaml" "Patient-intake-form/**" \
  "_PROJECT_ID=${PROJECT_ID},_REGION=${REGION},_ARTIFACT_REPO=${ARTIFACT_REPO},_SERVICE=${INTAKE_SERVICE},_ADMIN_PUBLIC_URL=${ADMIN_PUBLIC_URL}"

echo ""
echo "==> Setup complete."
echo "Next steps:"
echo "  1. Point Cloudflare DNS: www.gastroai.in -> $ADMIN_URL (if not already)"
echo "  2. Add intake subdomain (e.g. intake.gastroai.in) -> $INTAKE_URL"
echo "  3. If GitHub trigger creation failed, connect repo: Cloud Console -> Cloud Build -> Repositories"
echo "  4. Disable/delete old triggers in project $OLD_PROJECT_ID when cutover is verified"
echo "  5. Run DB migrations if needed: gcloud run jobs execute migrate-db --region=$REGION --project=$PROJECT_ID --wait"
