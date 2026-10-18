# Deploying to AWS (free-trial / credits friendly)

## Option 0: CloudFormation template (recommended, no manual server setup)

The template `infra/aws/nn-playground.yaml` creates a security group and one `t3.small` instance. On boot the instance installs Docker, clones this repository, and runs `docker compose up -d --build`. The stack reports `CREATE_COMPLETE` only after `/api/health` answers, so a failed build shows up as a failed stack.

**Before you start**

* An AWS account with permission to use CloudFormation, EC2 and SSM.
* A default VPC in the region (new accounts have one).
* An EC2 key pair in that region (only needed for SSH).
* The repository must be publicly cloneable, or change `RepoUrl` to one you can reach.

**Launch from the AWS console**

1. Open **CloudFormation → Create stack → With new resources (standard)**.
2. Choose **Upload a template file** and select `infra/aws/nn-playground.yaml`, or paste its URL.
3. Fill in the parameters. Set `AllowedSshCidr` and `AllowedAppCidr` to your own IP as `x.x.x.x/32` if you want the app private.
4. Accept the defaults for the rest and click **Submit**. The template creates no IAM resources, so no capability acknowledgement is needed.
5. Wait about 10–15 minutes for `CREATE_COMPLETE`. Open the **Outputs** tab and click `AppUrl`.

**Launch from VS Code (AWS Toolkit)**

Open the template in VS Code. With the AWS Toolkit connected, right-click the file and choose the CloudFormation deploy option, then enter the parameters. The Toolkit uses the same template, so the result is identical.

**Remove everything**

CloudFormation → select the stack → **Delete**. This terminates the instance and removes the security group.

**Updating the app** is a `git pull` plus `docker compose up -d --build` on the server (see the VS Code guide). Updating the stack itself is not needed for code changes.

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
