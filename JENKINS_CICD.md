# Jenkins CI/CD for ResumeBuilderDevOps

This repo ships a declarative pipeline in `Jenkinsfile`.

## What it does
- Triggers on GitHub webhooks (`githubPush()`).
- Installs deps:
  - `Backend/`: `npm ci`
  - `FrontEnd/`: Corepack + `pnpm@10.17.1` + `pnpm install --frozen-lockfile`
- Runs:
  - Backend tests: `npm test`
  - Frontend lint: `pnpm lint`
- Builds:
  - Frontend: `pnpm build`
  - Backend: `npm run build`
- Security (optional): `npm audit`, `pnpm audit`, Trivy FS + image scans.
- Docker build/tag for backend/frontend; push to registry.
- Deploy (optional) to a remote Docker host via SSH (copies `docker-compose.yml` + `nginx/`, runs `docker compose up -d`).
- Rollback on failure: switches to `*-prev` tags and redeploys.

## Jenkins plugins
Minimum:
- **Pipeline** (workflow)
- **Git**
- **GitHub** (for `githubPush()` + webhook endpoint)
- **Credentials Binding**
- **SSH Agent** (`sshagent`)
- **AnsiColor**

Recommended:
- **Email Extension** (`emailext`)
- **OWASP Dependency-Check** (optional alternative to audits)
- **Warnings Next Generation** (lint/test reporting)

## Jenkins agent requirements
The agent that runs this pipeline must have:
- Docker Engine + permission to run `docker` (either root or in docker group)
- Git
- Node.js **22+** (frontend tooling) and npm
- Corepack available (`corepack enable` must work)
- `curl`

Notes:
- Backend Docker build uses Node 20 Alpine internally, but pipeline still runs `npm test`/`npm run build` on the agent.

## Required Jenkins credentials
Create these in **Manage Jenkins → Credentials**:

1) Docker registry
- ID: `docker-registry`
- Type: Username/Password (or token as password)
- Used for `docker login` to `REGISTRY`

2) SSH deploy keys (one per env)
- IDs:
  - `ssh-deploy-dev`
  - `ssh-deploy-staging`
  - `ssh-deploy-prod`
- Type: SSH Username with private key
- User must be able to SSH to the target host and run Docker.

3) Optional
- `slack-webhook` (Secret text): Slack incoming webhook URL
- `monitoring-webhook` (Secret text): URL to POST deploy events
- `github-token` (Secret text): only needed if you extend the pipeline to call GitHub APIs

## GitHub webhook setup
In your GitHub repo:
- Settings → Webhooks → Add webhook
- Payload URL: `https://<jenkins-host>/github-webhook/`
- Content type: `application/json`
- Events: `Just the push event` (or include PR events if you extend the pipeline)

In Jenkins:
- Create a Pipeline job
- Configure SCM = GitHub repo
- Build Triggers: enable **GitHub hook trigger for GITScm polling**

## Registry/image settings
Edit `Jenkinsfile`:
- `REGISTRY` (default `ghcr.io`)
- `IMAGE_NAMESPACE` (your org/user)

Images pushed:
- `${IMAGE_*}:${BRANCH}-${BUILD_NUMBER}-${SHA}` (immutable)
- `${IMAGE_*}:${dev|staging|prod}` (stable env tag)
- `${IMAGE_*}:${dev|staging|prod}-prev` (rollback tag)

## Deploy workflow
Pipeline deploys via SSH to a remote host running Docker Compose.

Deployment uses `docker-compose.deploy.yml` (image-based) so the server runs the images built and pushed by Jenkins.

Prereqs on deploy host:
- Docker + Docker Compose v2 (`docker compose`)
- A directory at `DEPLOY_PATH` (default `/opt/resume-builder`)

What Jenkins does during deploy:
- Copies `docker-compose.deploy.yml` and `nginx/` to the remote `DEPLOY_PATH`
- Updates (upserts) only non-secret variables in `DEPLOY_PATH/.env` (image names + tags)
- Runs `docker compose -f docker-compose.deploy.yml pull` then `docker compose -f docker-compose.deploy.yml up -d`

Secrets note:
- The pipeline intentionally does not overwrite secrets on the server.
- You should pre-provision these in `DEPLOY_PATH/.env` on each environment host: `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.

### Environment selection
Parameter `DEPLOY_ENV`:
- `auto`:
  - `main/master` → `prod`
  - `develop/staging` → `staging`
  - anything else → `dev`
- `none`: build only (no deploy)

### Prod approval gate
When `RESOLVED_DEPLOY_ENV=prod`, pipeline prompts for approval.

## Rollback behavior
On pipeline failure (after deploy attempt):
- If `*-prev` tags exist, Jenkins updates `.env` to use `${ENV_TAG}-prev` and redeploys.

## Security best practices (practical)
- Use least-privilege deploy accounts on target hosts.
- Store all secrets in Jenkins Credentials; avoid plaintext in `Jenkinsfile`.
- Consider separate Jenkins agents for build vs deploy.
- Pin Trivy version (already pinned) and review scan failures.

## First-time checklist
- [ ] Set `IMAGE_NAMESPACE` in `Jenkinsfile`
- [ ] Create Jenkins credentials IDs listed above
- [ ] Set `DEPLOY_HOST_*` and `DEPLOY_PATH`
- [ ] Confirm deploy host has Docker + Compose v2
- [ ] Add GitHub webhook
- [ ] Run a build with `DEPLOY_ENV=none` first
