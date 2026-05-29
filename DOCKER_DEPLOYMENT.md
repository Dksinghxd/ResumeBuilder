# Full-Stack Docker Deployment (Frontend + Backend + MongoDB + Nginx)

## Prereqs
- Docker Desktop (Compose v2)
- Port `80` available on your machine

## Quick start (Windows cmd.exe)
```bat
cd /d D:\ResumeBuilderDevOps

docker compose up -d --build

docker compose ps
```

Open:
- App: `http://localhost/`
- Edge health: `http://localhost/healthz`

## Stop / reset
```bat
cd /d D:\ResumeBuilderDevOps

docker compose down
```

Delete MongoDB data volume (destructive):
```bat
docker compose down -v
```

## Logs
```bat
cd /d D:\ResumeBuilderDevOps

docker compose logs -f nginx
```

## Configuration
The stack is defined in `docker-compose.yml`:
- Nginx reverse-proxies `/api/*` to the backend and everything else to the frontend.
- The frontend is built with `NEXT_PUBLIC_API_URL=/api/v1` baked into the image (same-origin API calls).
- MongoDB uses a persistent named volume (`mongo_data`).

Recommended overrides for anything beyond local dev:
- Set `MONGO_ROOT_USERNAME` and `MONGO_ROOT_PASSWORD`
- Set `JWT_SECRET` and `JWT_REFRESH_SECRET`

Example (cmd.exe):
```bat
set MONGO_ROOT_USERNAME=root
set MONGO_ROOT_PASSWORD=change-me
set JWT_SECRET=change-me-very-long
set JWT_REFRESH_SECRET=change-me-very-long

cd /d D:\ResumeBuilderDevOps

docker compose up -d --build
```

## What’s “enterprise-grade” here
- Multi-stage builds for smaller images (`Backend/Dockerfile`, `FrontEnd/Dockerfile`)
- Next.js `output: 'standalone'` for minimal runtime footprint
- Non-root app containers (`USER node`)
- Internal-only app network; only Nginx is published to the host
- Health checks for Mongo, backend, frontend, and Nginx

## Production notes (not included)
- TLS termination (e.g., certbot/ACME) and strict security headers
- Secret management (Docker secrets / Vault / cloud secret manager)
- Centralized logging/metrics/tracing (ELK/Datadog/OTel)
- Horizontal scaling + sticky sessions strategy (if required)
