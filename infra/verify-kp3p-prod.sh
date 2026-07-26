#!/usr/bin/env bash
# Pre-migration checklist for kp3p-prod. Run: ./infra/verify-kp3p-prod.sh
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-kp3p-prod}"
OLD_PROJECT_ID="${OLD_PROJECT_ID:-kp3p-admin-prod}"
REGION="${REGION:-asia-south1}"
ARTIFACT_REPO="${ARTIFACT_REPO:-kp3p-repo}"

pass=0
fail=0
warn=0

ok()   { echo "  [OK]   $*"; pass=$((pass + 1)); }
bad()  { echo "  [FAIL] $*"; fail=$((fail + 1)); }
note() { echo "  [WARN] $*"; warn=$((warn + 1)); }

echo "=== KP3P GCP migration readiness ==="
echo "Target project: $PROJECT_ID | Region: $REGION"
echo ""

echo "1. gcloud authentication"
if gcloud auth print-access-token &>/dev/null; then
  ok "gcloud credentials valid ($(gcloud config get-value account 2>/dev/null))"
else
  bad "Run: gcloud auth login"
fi

echo "2. Target project exists"
if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
  ok "Project $PROJECT_ID accessible"
else
  bad "Cannot access project $PROJECT_ID — check ID and IAM"
fi

echo "3. Required repo files"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for f in \
  admin/Dockerfile \
  admin/cloudbuild.yaml \
  Patient-intake-form/Dockerfile \
  Patient-intake-form/cloudbuild.yaml; do
  if [[ -f "$REPO_ROOT/$f" ]]; then
    ok "$f"
  else
    bad "Missing $f"
  fi
done

echo "4. APIs (target project)"
REQUIRED_APIS=(run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com)
for api in "${REQUIRED_APIS[@]}"; do
  if gcloud services list --project="$PROJECT_ID" --enabled --filter="config.name:$api" --format="value(config.name)" 2>/dev/null | grep -q "$api"; then
    ok "$api enabled"
  else
    note "$api not enabled yet (setup script will enable)"
  fi
done

echo "5. Artifact Registry"
if gcloud artifacts repositories describe "$ARTIFACT_REPO" --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  ok "Repository $ARTIFACT_REPO exists"
else
  note "Repository $ARTIFACT_REPO not created yet"
fi

echo "6. Secrets (target project)"
for s in SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY GEMINI_API_KEY LLM_PROVIDER; do
  if gcloud secrets describe "$s" --project="$PROJECT_ID" &>/dev/null; then
    ok "Secret $s"
  else
    note "Secret $s missing (copy from $OLD_PROJECT_ID or create manually)"
  fi
done

echo "7. Cloud Run services"
for svc in kp3p-admin kp3p-intake; do
  if gcloud run services describe "$svc" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    url="$(gcloud run services describe "$svc" --region="$REGION" --project="$PROJECT_ID" --format='value(status.url)')"
    ok "$svc deployed at $url"
  else
    note "$svc not deployed yet"
  fi
done

echo "8. Cloud Build triggers"
for trg in deploy-kp3p-admin deploy-kp3p-intake; do
  if gcloud builds triggers describe "$trg" --project="$PROJECT_ID" &>/dev/null; then
    ok "Trigger $trg"
  else
    note "Trigger $trg not created yet"
  fi
done

echo "9. GitHub connection"
if gcloud builds triggers list --project="$PROJECT_ID" --format="value(name)" 2>/dev/null | grep -q deploy-kp3p; then
  ok "GitHub triggers present"
else
  note "Connect https://github.com/gopi-mygastroai/KP3P in Cloud Build -> Repositories (2nd gen) or classic GitHub app"
fi

echo ""
echo "Summary: $pass passed, $warn warnings, $fail failures"
if [[ $fail -gt 0 ]]; then
  exit 1
fi
