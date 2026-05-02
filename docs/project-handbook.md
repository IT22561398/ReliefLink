# ReliefLink Project Handbook

## 1. Overview

ReliefLink is a TypeScript monorepo for disaster relief coordination. It includes a web frontend, an API gateway, multiple backend services, and shared packages. The platform supports request creation, volunteer coordination, resource management, and notification workflows.

Primary goals:

- Collect and track relief requests.
- Coordinate volunteers and assignments.
- Notify users about request and assignment changes.
- Provide a scalable service-oriented architecture for cloud deployment.

## 2. Monorepo Layout

- `apps/web`: Next.js frontend.
- `services/api-gateway`: public API entrypoint and proxy.
- `services/auth-service`: authentication, user accounts, volunteer approval.
- `services/request-service`: relief request lifecycle.
- `services/volunteer-service`: volunteer profiles, resources, assignments.
- `services/notification-service`: notifications and status-event history.
- `services/config-service`: runtime configuration endpoints.
- `packages/*`: shared libraries (types, validators, logger, config, middleware, queue, utils, database helpers).
- `k8s/base`: Kubernetes manifests.
- `docs`: project and operational documentation.

## 3. High-Level Architecture

Request flow:

1. Browser accesses web app on port 3000 in local dev.
2. Web app sends API requests through API Gateway.
3. API Gateway routes domain paths to backend services.
4. Services use PostgreSQL (service-specific database/schema).
5. Notification and async work uses Redis/BullMQ where applicable.

Service route mapping (via gateway):

- `/api/v1/auth/*` and `/api/v1/users/*` -> auth-service.
- `/api/v1/requests/*` -> request-service.
- `/api/v1/volunteers/*`, `/api/v1/resources/*`, `/api/v1/assignments/*` -> volunteer-service.
- `/api/v1/notifications/*`, `/api/v1/status-events/*` -> notification-service.
- `/api/v1/config/*` -> config-service.

## 4. Core Tech Stack

- Monorepo and task orchestration: pnpm workspaces, Turborepo.
- Language: TypeScript.
- Frontend: Next.js, React, Tailwind CSS, Zustand.
- Backend: Node.js, Express.
- Validation: Zod.
- Database: PostgreSQL with Prisma.
- Queue and cache: Redis and BullMQ.
- Containers: Docker.
- Deployment: Kubernetes manifests in `k8s/base`.

## 5. Local Development

## Prerequisites

- Node.js 20+.
- npm (for `npx` usage).
- pnpm 10+ (or use `npx pnpm@10.32.1 ...`).
- Docker Desktop (for PostgreSQL and Redis if running infra locally).

## Setup

From repository root:

```bash
npx --yes pnpm@10.32.1 install
```

Generate Prisma clients for service packages that require generated client imports:

```bash
npx --yes pnpm@10.32.1 --filter @relieflink/auth-service db:generate
npx --yes pnpm@10.32.1 --filter @relieflink/request-service db:generate
npx --yes pnpm@10.32.1 --filter @relieflink/volunteer-service db:generate
npx --yes pnpm@10.32.1 --filter @relieflink/notification-service db:generate
```

Start infrastructure when needed:

```bash
docker compose up -d
```

## Run the platform

Standard command:

```bash
npx --yes pnpm@10.32.1 dev
```

If Turbo reports invalid task configuration due to persistent-task concurrency, run:

```bash
./node_modules/.bin/turbo run dev --concurrency 17
```

On Windows PowerShell:

```powershell
.\node_modules\.bin\turbo.cmd run dev --concurrency 17
```

## 6. Useful Scripts

Root scripts (`package.json`):

- `dev`: run all workspace dev tasks.
- `dev:web`: run only web app.
- `dev:services`: run only services.
- `build`: build all packages/apps/services.
- `typecheck`: workspace type checks.
- `test`, `test:unit`, `test:integration`: test suites.
- `db:generate`, `db:migrate`, `db:push`: Prisma database tasks through Turbo.

## 7. Service Ports (Local)

- web: 3000
- auth-service: 3001
- notification-service: 3002
- volunteer-service: 3003
- request-service: 3004
- api-gateway: 3005
- config-service: 3006

## 8. Health Checks

Common health endpoints:

- `http://localhost:3005/health` (API Gateway)
- `http://localhost:3006/health` (Config Service)
- service-specific `/health` endpoints for other services when running

Simple PowerShell checks:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:3005/health
Invoke-WebRequest -UseBasicParsing http://localhost:3000
```

## 9. Database Model Strategy

Each core service uses its own database and schema. This isolates domains and reduces coupling:

- Auth -> `auth_service_db` / `auth_service`
- Request -> `request_service_db` / `request_service`
- Volunteer -> `volunteer_service_db` / `volunteer_service`
- Notification -> `notification_service_db` / `notification_service`

Use these docs for inspection:

- `docs/db.md` for quick commands.
- `docs/postgres-pod-psql.md` for detailed Kubernetes and SQL guidance.

## 10. Deployment Artifacts

- Docker Compose files: local and production compose definitions.
- Dockerfiles: one per app/service.
- Kubernetes manifests: `k8s/base` with namespace, deployments, services, ingress, storage, and dependencies.

## 11. Known Development Pitfalls

- Some VS Code tasks currently call `zsh`, which fails on machines without zsh (common on Windows PowerShell-only setups).
- Prisma-generated clients must exist before starting service processes that import `generated/client/index.js`.
- Turbo persistent task count can exceed default concurrency and requires explicit `--concurrency`.

## 12. Recommended Improvements

- Add Windows-safe npm scripts and VS Code tasks (PowerShell-compatible).
- Encode Turbo concurrency in `turbo.json` or root scripts to avoid manual flags.
- Add a one-command setup script for install, Prisma generation, migrations, and startup checks.
- Add automated health probe script for all local service ports.

## 13. Quick Start Summary

1. Install dependencies.
2. Generate Prisma clients for all Prisma-based services.
3. Start local infrastructure (if not already running).
4. Start dev graph with adequate Turbo concurrency.
5. Verify web and gateway health endpoints.
