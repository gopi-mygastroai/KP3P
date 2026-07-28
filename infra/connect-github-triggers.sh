#!/usr/bin/env bash
# Connect GitHub repo to Cloud Build (2nd gen) and create auto-deploy triggers.
# Prerequisite: gcloud auth login && gcloud config set project kp3p-prod
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PROJECT_ID="${PROJECT_ID:-kp3p-prod}"
REGION="${REGION:-asia-south1}"
CONNECTION_NAME="${CONNECTION_NAME:-github-kp3p}"
GITHUB_OWNER="${GITHUB_OWNER:-gopi-mygastroai}"
GITHUB_REPO="${GITHUB_REPO:-KP3P}"

connection_stage() {
  gcloud builds connections describe "$CONNECTION_NAME" \
    --region="$REGION" --project="$PROJECT_ID" \
    --format="value(installationState.stage)" 2>/dev/null || echo "MISSING"
}

connection_action_uri() {
  gcloud builds connections describe "$CONNECTION_NAME" \
    --region="$REGION" --project="$PROJECT_ID" \
    --format="value(installationState.actionUri)" 2>/dev/null || true
}

ensure_connection_ready() {
  local stage action_uri
  stage="$(connection_stage)"
  if [[ "$stage" == "COMPLETE" ]]; then
    return 0
  fi

  action_uri="$(connection_action_uri)"
  local console_url="https://console.cloud.google.com/cloud-build/repositories;region=${REGION}?project=${PROJECT_ID}"

  if [[ "$stage" == "PENDING_USER_OAUTH" ]]; then
    echo ""
    echo "==> GitHub OAuth required."
    echo "    1. Open: ${action_uri:-$console_url}"
    echo "    2. Sign in with GitHub and authorize Cloud Build"
    echo "    3. Re-run: ./infra/connect-github-triggers.sh"
    exit 0
  fi

  if [[ "$stage" == "PENDING_INSTALL_APP" ]]; then
    echo ""
    echo "==> Install the Cloud Build GitHub App (one-time step)."
    echo "    1. Open: ${action_uri:-$console_url}"
    echo "    2. Install the Google Cloud Build app on GitHub"
    echo "    3. Grant access to repository: ${GITHUB_OWNER}/${GITHUB_REPO}"
    echo "    4. Re-run: ./infra/connect-github-triggers.sh"
    exit 0
  fi

  echo "ERROR: Connection $CONNECTION_NAME is in unexpected state: $stage"
  echo "       Check status: gcloud builds connections describe $CONNECTION_NAME --region=$REGION --project=$PROJECT_ID"
  exit 1
}

echo "==> Step 0: Enable APIs and grant Cloud Build service agent permissions"
gcloud services enable \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  --project="$PROJECT_ID"

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
CLOUD_BUILD_P4SA="service-${PROJECT_NUMBER}@gcp-sa-cloudbuild.iam.gserviceaccount.com"
CLOUD_BUILD_SA="projects/${PROJECT_ID}/serviceAccounts/${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "    Granting Secret Manager access to $CLOUD_BUILD_P4SA"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CLOUD_BUILD_P4SA}" \
  --role="roles/secretmanager.admin" \
  --quiet >/dev/null

echo "==> Step 1: Create GitHub connection"
if [[ "$(connection_stage)" == "MISSING" ]]; then
  gcloud builds connections create github "$CONNECTION_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID"
fi

ensure_connection_ready
echo "    connection $CONNECTION_NAME is ready"

echo "==> Step 2: Link repository"
if ! gcloud builds repositories describe "$GITHUB_REPO" \
  --connection="$CONNECTION_NAME" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  gcloud builds repositories create "$GITHUB_REPO" \
    --remote-uri="https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}.git" \
    --connection="$CONNECTION_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID"
  echo "    linked ${GITHUB_OWNER}/${GITHUB_REPO}"
else
  echo "    repository already linked"
fi

create_trigger() {
  local name="$1"
  local build_config="$2"
  local included_files="$3"

  if gcloud builds triggers describe "$name" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    echo "    trigger $name already exists"
    return 0
  fi

  gcloud builds triggers create github \
    --name="$name" \
    --repository="projects/${PROJECT_ID}/locations/${REGION}/connections/${CONNECTION_NAME}/repositories/${GITHUB_REPO}" \
    --branch-pattern='^main$' \
    --build-config="$build_config" \
    --included-files="$included_files" \
    --service-account="$CLOUD_BUILD_SA" \
    --region="$REGION" \
    --project="$PROJECT_ID"
  echo "    created $name"
}

echo "==> Step 3: Create deploy triggers"
create_trigger "deploy-kp3p-admin" "admin/cloudbuild.yaml" "admin/**"
create_trigger "deploy-kp3p-intake" "Patient-intake-form/cloudbuild.yaml" "Patient-intake-form/**"

echo ""
echo "==> GitHub auto-deploy triggers ready."
echo "    Push to main will deploy admin/** and Patient-intake-form/** changes separately."
