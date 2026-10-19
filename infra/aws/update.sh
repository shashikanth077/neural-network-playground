#!/usr/bin/env bash
# Update an already-deployed AI Lab server to the latest commit of its branch.
# Run on the server (SSH or SSM): bash /opt/neural-network-playground/infra/aws/update.sh
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/neural-network-playground}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-master}"
cd "$APP_DIR"
git config --global --add safe.directory "$APP_DIR" || true
echo "Current commit: $(git rev-parse --short HEAD)"
git fetch --depth 1 origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git reset --hard FETCH_HEAD
echo "Updated to:     $(git rev-parse --short HEAD)"
docker compose up -d --build --remove-orphans
for i in $(seq 1 60); do
  if curl -fs http://localhost:8080/api/health >/dev/null; then
    echo "Healthy."
    exit 0
  fi
  sleep 3
done
echo "Backend did not become healthy; see: docker compose logs --tail=100" >&2
exit 1
