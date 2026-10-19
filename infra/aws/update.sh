#!/usr/bin/env bash
# Update an already-deployed AI Lab server to the latest commit of its branch.
# Run ON the server (SSH in first):  bash /opt/nn-playground/infra/aws/update.sh
# The CloudFormation template clones the repo once at first boot, so the running app
# does NOT change when new code is pushed until you run this.
set -euo pipefail
cd /opt/nn-playground
echo "Current commit: $(git rev-parse --short HEAD)"
git fetch --depth 1 origin "$(git rev-parse --abbrev-ref HEAD)"
git reset --hard FETCH_HEAD
echo "Updated to:     $(git rev-parse --short HEAD)"
docker compose up -d --build
for i in $(seq 1 60); do
  if curl -fs http://localhost:8080/api/health >/dev/null; then echo "Healthy."; exit 0; fi
  sleep 3
done
echo "Backend did not become healthy; see: docker compose logs --tail=100" >&2
exit 1
