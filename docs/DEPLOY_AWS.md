# Deploying to AWS (free-trial / credits friendly)

This is a plan; it has **not** been executed from this repository's authoring environment.

## Option A: one EC2 instance with Docker Compose (simplest, cheapest)

1. Launch a `t3.small` (or `t3.micro` if within free tier) Amazon Linux 2023 instance. Security group: allow 22 (your IP only), 80/443.
2. Install Docker and the compose plugin (`sudo dnf install -y docker git && sudo systemctl enable --now docker`, then install the compose plugin).
3. `git clone <repo> && cd neural-network-playground && cp .env.example .env`, set `CORS_ORIGINS` to your public URL.
4. `docker compose up -d --build`. The app is on port 8080; map to 80 by editing `ports` in `docker-compose.yml`, or put an Application Load Balancer / Caddy in front for HTTPS.
5. Verify `curl http://<host>:8080/api/health`.

The backend must stay a **single process** because sessions are in memory.

## Option B: managed containers

* Push `backend` and `frontend` images to ECR; run on **ECS Fargate** (one task each, desired count 1 for the backend) behind an ALB: `/api/*` → backend, everything else → frontend. App Runner works for the backend alone.
* Alternative: build the SPA (`npm run build`) → S3 + CloudFront; add a CloudFront behaviour `/api/*` → the backend origin so the browser stays same-origin (no CORS needed).

## Hardening checklist before going public

* HTTPS (ACM certificate), restrict CORS, add rate limiting (e.g. AWS WAF) because training uses CPU.
* Set a billing alarm / budget on the credit account.
* For horizontal scaling, move sessions to Redis or use sticky sessions.
