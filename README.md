# ReliefLink

ReliefLink is a cloud-native disaster relief coordination platform built with a TypeScript monorepo, microservices, Docker, AWS ECR, Amazon EKS, Kubernetes, PostgreSQL, Redis, and GitHub Actions.

The system helps requesters ask for disaster relief, volunteers offer help, coordinators approve and assign volunteers, and all parties receive updates through notification and status-event workflows.

## Table Of Contents

- [Project Overview](#project-overview)
- [Main Features](#main-features)
- [User Roles](#user-roles)
- [Repository Structure](#repository-structure)
- [Technology Stack](#technology-stack)
- [Service Architecture](#service-architecture)
- [Service Communication](#service-communication)
- [API Gateway Routes](#api-gateway-routes)
- [Database Architecture](#database-architecture)
- [AWS Architecture](#aws-architecture)
- [Kubernetes Architecture](#kubernetes-architecture)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Required GitHub Secrets](#required-github-secrets)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Testing And Verification](#testing-and-verification)
- [Operations Commands](#operations-commands)
- [Troubleshooting](#troubleshooting)
- [Default Demo Login](#default-demo-login)
- [Important Implementation Notes](#important-implementation-notes)
- [Recommended Improvements](#recommended-improvements)

## Project Overview

ReliefLink is designed as a production-style disaster management system. It separates responsibilities into independent services so each domain can scale, deploy, and fail independently.

High-level goals:

- Provide a web interface for disaster relief requests and volunteer coordination.
- Authenticate users and enforce role-based access.
- Track relief requests from creation to assignment and completion.
- Allow volunteers to register, be approved, and accept assignments.
- Track resources and volunteer availability.
- Send notifications and record request status history.
- Deploy reliably to AWS using EKS, ECR, ALB, EBS, and GitHub Actions.

## Main Features

- User registration and login.
- JWT-based authentication.
- Coordinator/admin seeded demo account.
- Role-aware dashboard.
- Relief request creation and listing.
- Volunteer registration and approval workflow.
- Volunteer profile and availability tracking.
- Resource listing and management.
- Assignment creation and self-accept flow.
- Notification records per user.
- Status event timeline per request.
- Central API gateway with service routing and circuit breaker.
- Config service for public/internal service configuration.
- Dockerized builds for every deployable service.
- Kubernetes Deployments, StatefulSets, Services, Ingress, HPA, PVCs, and StorageClass.
- GitHub Actions pipeline to build, push, scan, and deploy images.

## User Roles

| Role | Purpose |
| --- | --- |
| `requester` | Creates relief requests and tracks help progress. |
| `volunteer` | Views available requests, accepts work, updates assignment status. |
| `coordinator` | Reviews requests, approves volunteers, manages resources and assignments. |
| `admin` | Full operational access where implemented. |

Current seeded demo user:

```text
Email: coordinator@relieflink.local
Password: Admin@123
Role: coordinator
```

## Repository Structure

```text
ReliefLink-main/
  apps/
    web/                         Next.js frontend
  services/
    api-gateway/                 Public API gateway and proxy
    auth-service/                Auth, users, volunteer approvals
    config-service/              Public/internal runtime config
    request-service/             Relief request domain
    volunteer-service/           Volunteers, resources, assignments
    notification-service/        Notifications, status events, queue worker
  packages/
    auth-middleware/             Shared JWT/RBAC middleware
    config/                      Shared env/config helpers
    logger/                      Structured logging
    queue/                       Shared queue types/defaults
    types/                       Shared domain types
    utils/                       Shared result/errors/retry helpers
    validators/                  Shared Zod validation schemas
  k8s/
    base/                        Kustomize Kubernetes manifests
  .github/
    workflows/                   CI/CD workflows
```

## Technology Stack

| Area | Technology |
| --- | --- |
| Monorepo | pnpm workspaces, Turborepo |
| Language | TypeScript |
| Frontend | Next.js, React, Tailwind CSS, Zustand, Axios |
| Backend | Node.js, Express |
| Validation | Zod |
| Auth | JWT, bcryptjs |
| Database | PostgreSQL 16 |
| ORM | Prisma with multi-schema support |
| Queue | Redis 7, BullMQ |
| Containers | Docker multi-stage builds |
| Registry | Amazon ECR |
| Orchestration | Amazon EKS, Kubernetes |
| Ingress | AWS Load Balancer Controller, ALB |
| Storage | Amazon EBS CSI Driver, gp3 StorageClass |
| CI/CD | GitHub Actions with AWS OIDC |

## Service Architecture

```text
Browser
  |
  | HTTP :80
  v
AWS Application Load Balancer
  |
  | /        -> web-service:3000
  | /api/*  -> api-gateway:3005
  v
api-gateway
  |-- /api/v1/auth/*              -> auth-service:3001
  |-- /api/v1/users/*             -> auth-service:3001
  |-- /api/v1/requests/*          -> request-service:3004
  |-- /api/v1/volunteers/*        -> volunteer-service:3003
  |-- /api/v1/resources/*         -> volunteer-service:3003
  |-- /api/v1/assignments/*       -> volunteer-service:3003
  |-- /api/v1/notifications/*     -> notification-service:3002
  |-- /api/v1/status-events/*     -> notification-service:3002
  |-- /api/v1/config/*            -> config-service:3006
```

### Frontend: `apps/web`

The frontend is a Next.js application. It is built into a standalone production server and deployed as `web-service`.

Important behavior:

- Browser API calls use relative paths such as `/api/v1/auth/login`.
- The Docker build sets `NEXT_PUBLIC_API_BASE_URL=/` so requests go to the same ALB host.
- The shared API client normalizes paths to avoid accidental `/api/api/...` double-prefixes.

### API Gateway: `services/api-gateway`

Responsibilities:

- Single API entry point for the frontend.
- Routes public `/api/*` calls to internal services.
- Adds request IDs and structured logs.
- Handles CORS.
- Applies rate limiting in production.
- Includes circuit breaker protection per upstream service.
- Exposes health endpoints:

```text
GET /health
GET /health/live
GET /health/ready
GET /health/circuits
```

### Auth Service: `services/auth-service`

Responsibilities:

- Register users.
- Login users.
- Seed coordinator demo user.
- Issue JWT tokens.
- Return current user.
- List and approve/reject pending volunteers.
- Update user roles.

Database:

```text
auth_service_db
schema: auth_service
```

Important migrations:

```text
0001_init
0002_add_user_status
```

### Request Service: `services/request-service`

Responsibilities:

- Create relief requests.
- List requests with role-based filtering.
- Get request by ID.
- Update request details.
- Update request status.

Database:

```text
request_service_db
schema: request_service
```

### Volunteer Service: `services/volunteer-service`

Responsibilities:

- Create volunteer profiles.
- List volunteers.
- Update volunteer availability.
- Create/list resources.
- Create assignments.
- Allow volunteers to self-accept requests.
- Get current volunteer assignment.
- Update assignment status.
- Queue notification jobs through Redis/BullMQ.

Database:

```text
volunteer_service_db
schema: volunteer_service
```

### Notification Service: `services/notification-service`

Responsibilities:

- Store notifications.
- Read notifications per user.
- Store request status events.
- Read status events per request.
- Run BullMQ notification worker.

Database:

```text
notification_service_db
schema: notification_service
```

Queue:

```text
Redis queue name: notification
```

Important migrations:

```text
0001_init
0002_add_notification_metadata
```

### Config Service: `services/config-service`

Responsibilities:

- Expose public frontend/runtime service config.
- Expose internal service URL config for the API gateway.
- Provide health endpoint.

Endpoints:

```text
GET /health
GET /api/v1/config/public
GET /api/v1/config/internal
```

Kubernetes service URL:

```text
http://config-service:3006
```

## Service Communication

### Synchronous HTTP Calls

| Caller | Target | Purpose |
| --- | --- | --- |
| Web | API Gateway | All browser API calls. |
| API Gateway | Auth Service | Auth and user routes. |
| API Gateway | Request Service | Relief request routes. |
| API Gateway | Volunteer Service | Volunteer, resource, assignment routes. |
| API Gateway | Notification Service | Notification and status event routes. |
| API Gateway | Config Service | Config routes and optional service URL refresh. |
| Volunteer Service | Request Service | Verify/update request status during assignment flows. |
| Volunteer Service | Auth Service | Fetch volunteer/user details. |

### Asynchronous Communication

The volunteer service queues notification jobs into Redis. The notification service worker consumes jobs and stores notification records in PostgreSQL.

```text
volunteer-service -> Redis/BullMQ -> notification-service worker -> notification_service_db
```

## API Gateway Routes

| Public Path | Internal Service | Notes |
| --- | --- | --- |
| `/api/v1/auth/register` | auth-service | User registration. |
| `/api/v1/auth/login` | auth-service | Login and JWT issue. |
| `/api/v1/auth/me` | auth-service | Current user. |
| `/api/v1/users/*` | auth-service | User, volunteer approval, role routes. |
| `/api/v1/requests/*` | request-service | Relief requests. |
| `/api/v1/volunteers/*` | volunteer-service | Volunteer profiles. |
| `/api/v1/resources/*` | volunteer-service | Resource records. |
| `/api/v1/assignments/*` | volunteer-service | Assignment flows. |
| `/api/v1/notifications/*` | notification-service | User notifications. |
| `/api/v1/status-events/*` | notification-service | Request status timeline. |
| `/api/v1/config/*` | config-service | Public/internal runtime config. |

## Database Architecture

The Kubernetes deployment uses one PostgreSQL StatefulSet and separate databases per service:

```text
PostgreSQL StatefulSet: postgres
Host: postgres-0.postgres
Port: 5432
User: postgres

Databases:
  auth_service_db
  request_service_db
  volunteer_service_db
  notification_service_db
```

Database creation happens from `k8s/base/postgres.yaml` through the `postgres-init` ConfigMap on first database initialization.

Important note:

- `/docker-entrypoint-initdb.d` scripts run only when the Postgres data directory is empty.
- If the PVC already exists, new database init scripts do not run automatically.
- For existing clusters, manually create missing databases or run SQL patches.

Example:

```bash
kubectl exec -n relieflink postgres-0 -- psql -U postgres -d postgres -c '\l'
```

### Redis

Redis runs as a StatefulSet:

```text
Service: redis
Pod DNS: redis-0.redis
Port: 6379
Storage: gp3 EBS PVC
```

Redis is protected with `REDIS_PASSWORD`.

Important note:

- `POSTGRES_PASSWORD` and `REDIS_PASSWORD` are embedded into connection URLs.
- Use URL-safe passwords with letters and numbers only unless the manifests are changed to use fully URL-encoded connection strings.

Good examples:

```text
ReliefLinkPostgres2026StrongPass
ReliefLinkRedis2026StrongPass
```

Avoid:

```text
@ / : # ? % spaces
```

## AWS Architecture

Production AWS resources used by this project:

```text
AWS Account: 489109585253
Region: ap-south-1

VPC
  |
  +-- Amazon EKS cluster: relieflink-cluster
  |     |
  |     +-- Managed node group
  |     +-- IAM OIDC provider
  |     +-- EBS CSI add-on
  |     +-- Cluster Autoscaler
  |
  +-- AWS Load Balancer Controller
  |     |
  |     +-- Internet-facing ALB
  |
  +-- Amazon ECR repositories
  |
  +-- EBS gp3 volumes for Postgres and Redis
```

### Amazon ECR Repositories

Images are pushed to:

```text
489109585253.dkr.ecr.ap-south-1.amazonaws.com/relieflink-api-gateway
489109585253.dkr.ecr.ap-south-1.amazonaws.com/relieflink-auth-service
489109585253.dkr.ecr.ap-south-1.amazonaws.com/relieflink-request-service
489109585253.dkr.ecr.ap-south-1.amazonaws.com/relieflink-volunteer-service
489109585253.dkr.ecr.ap-south-1.amazonaws.com/relieflink-notification-service
489109585253.dkr.ecr.ap-south-1.amazonaws.com/relieflink-config-service
489109585253.dkr.ecr.ap-south-1.amazonaws.com/relieflink-web
```

Each image is tagged with:

```text
latest
<git-commit-sha>
```

Create missing repositories:

```bash
aws ecr create-repository --repository-name relieflink-api-gateway --region ap-south-1
aws ecr create-repository --repository-name relieflink-auth-service --region ap-south-1
aws ecr create-repository --repository-name relieflink-request-service --region ap-south-1
aws ecr create-repository --repository-name relieflink-volunteer-service --region ap-south-1
aws ecr create-repository --repository-name relieflink-notification-service --region ap-south-1
aws ecr create-repository --repository-name relieflink-config-service --region ap-south-1
aws ecr create-repository --repository-name relieflink-web --region ap-south-1
```

### EKS Cluster

Example cluster creation:

```bash
eksctl create cluster \
  --name relieflink-cluster \
  --region ap-south-1 \
  --version 1.34 \
  --nodegroup-name relieflink-nodegroup \
  --node-type m5.large \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 10 \
  --managed \
  --with-oidc \
  --asg-access \
  --external-dns-access \
  --full-ecr-access
```

Update local kubeconfig:

```bash
aws eks update-kubeconfig --name relieflink-cluster --region ap-south-1
kubectl get nodes
```

### EBS CSI Driver

Required for PVCs:

```bash
eksctl create addon \
  --name aws-ebs-csi-driver \
  --cluster relieflink-cluster \
  --region ap-south-1 \
  --force
```

Check:

```bash
kubectl get pods -n kube-system | grep ebs
```

### AWS Load Balancer Controller

Required because the Kubernetes Ingress uses:

```yaml
ingressClassName: alb
```

Create the IAM policy:

```bash
curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.14.1/docs/install/iam_policy.json

aws iam create-policy \
  --policy-name AWSLoadBalancerControllerIAMPolicy \
  --policy-document file://iam_policy.json
```

Create service account:

```bash
eksctl create iamserviceaccount \
  --cluster=relieflink-cluster \
  --region=ap-south-1 \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --attach-policy-arn=arn:aws:iam::489109585253:policy/AWSLoadBalancerControllerIAMPolicy \
  --override-existing-serviceaccounts \
  --approve
```

Install controller:

```bash
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=relieflink-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=ap-south-1 \
  --set vpcId=$(aws eks describe-cluster --name relieflink-cluster --region ap-south-1 --query "cluster.resourcesVpcConfig.vpcId" --output text)
```

Check:

```bash
kubectl get pods -n kube-system | grep aws-load-balancer
kubectl get ingress -n relieflink
```

### Cluster Autoscaler

Install:

```bash
helm repo add autoscaler https://kubernetes.github.io/autoscaler
helm repo update

helm install cluster-autoscaler autoscaler/cluster-autoscaler \
  -n kube-system \
  --set autoDiscovery.clusterName=relieflink-cluster \
  --set awsRegion=ap-south-1 \
  --set rbac.create=true \
  --set image.tag=v1.34.0
```

Check:

```bash
kubectl get pods -n kube-system | grep autoscaler
kubectl logs -n kube-system -l app.kubernetes.io/name=aws-cluster-autoscaler --tail=100
```

Use an autoscaler image tag compatible with your Kubernetes minor version.

## Kubernetes Architecture

Kustomize base:

```text
k8s/base/
  namespace.yaml
  storageclass.yaml
  secrets-configmap.yaml
  postgres.yaml
  redis.yaml
  config-service.yaml
  api-gateway.yaml
  web-service.yaml
  auth-service.yaml
  request-service.yaml
  volunteer-service.yaml
  notification-service.yaml
  ingress.yaml
  kustomization.yaml
```

### Namespace

```text
relieflink
```

### Workload Types

| Component | Kubernetes Kind |
| --- | --- |
| Web | Deployment, Service, HPA |
| API Gateway | Deployment, Service, HPA |
| Auth Service | Deployment, Service, HPA |
| Request Service | Deployment, Service, HPA |
| Volunteer Service | Deployment, Service, HPA |
| Notification Service | Deployment, Service, HPA |
| Config Service | Deployment, Service, HPA |
| PostgreSQL | StatefulSet, Headless Service, PVC |
| Redis | StatefulSet, Headless Service, PVC |
| Public Routing | Ingress with ALB annotations |
| Storage | gp3 StorageClass |

### Ingress

Ingress rules:

```text
/api -> api-gateway:3005
/    -> web-service:3000
```

Get public URL:

```bash
kubectl get ingress -n relieflink
```

Example:

```text
http://k8s-reliefli-reliefli-78380780cb-1145401821.ap-south-1.elb.amazonaws.com
```

### Storage

The project uses `gp3`:

```yaml
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
parameters:
  type: gp3
  encrypted: "true"
```

Check storage:

```bash
kubectl get storageclass
kubectl get pvc -n relieflink
```

Expected PVCs:

```text
postgres-storage-postgres-0
redis-storage-redis-0
```

### Secrets And ConfigMap

Secrets are created by GitHub Actions:

```text
relieflink-secrets
```

ConfigMap:

```text
relieflink-config
```

Do not store real secrets in `k8s/base/secrets-configmap.yaml`.

## GitHub Actions CI/CD

There are two workflows:

```text
.github/workflows/build-test.yml
.github/workflows/deploy.yml
```

### Build Workflow

Name:

```text
Build & Deploy Services
```

Triggers:

- Push to `main`.
- Manual workflow dispatch.
- Changes under services, web, packages, k8s, workflows, and tsconfig.

What it does:

1. Checks out source.
2. Assumes AWS role through GitHub OIDC.
3. Logs into ECR.
4. Builds Docker images for:

```text
api-gateway
auth-service
request-service
volunteer-service
notification-service
config-service
web
```

5. Pushes images to ECR with:

```text
latest
<github.sha>
```

6. Runs Trivy image scan and uploads SARIF results to GitHub Security.

### Deploy Workflow

Name:

```text
Deploy to AWS EKS
```

Triggers:

- Automatically after the build workflow completes successfully on `main`.
- Manual workflow dispatch.

What it does:

1. Checks out the exact commit that produced the image tag.
2. Assumes AWS role through GitHub OIDC.
3. Logs into ECR.
4. Verifies EKS cluster exists.
5. Updates kubeconfig.
6. Verifies Kubernetes auth.
7. Creates namespace.
8. Creates/updates Kubernetes secrets.
9. Rewrites image references in manifests to use the current ECR commit tag.
10. Applies Kustomize manifests.
11. Waits for all deployments to roll out.
12. Prints pods and services.
13. On failure, prints pod status, events, deployment descriptions, and logs.

## Required GitHub Secrets

Set these under:

```text
GitHub repository -> Settings -> Secrets and variables -> Actions
```

Required:

```text
AWS_REGION=ap-south-1
AWS_ECR_REPOSITORY_PREFIX=relieflink
EKS_CLUSTER_STAGING=relieflink-cluster
AWS_ROLE_TO_ASSUME=arn:aws:iam::489109585253:role/GitHub-Actions-ECR-EKS-Role
JWT_SECRET=<strong random secret, 16+ chars>
POSTGRES_PASSWORD=<letters-and-numbers-only recommended>
REDIS_PASSWORD=<letters-and-numbers-only recommended>
AUTH_DB_PASSWORD=<can match POSTGRES_PASSWORD>
REQUEST_DB_PASSWORD=<can match POSTGRES_PASSWORD>
VOLUNTEER_DB_PASSWORD=<can match POSTGRES_PASSWORD>
NOTIFICATION_DB_PASSWORD=<can match POSTGRES_PASSWORD>
```

### GitHub OIDC Role

The GitHub role trust relationship should allow:

```text
repo:IT22561398/ReliefLink:ref:refs/heads/main
```

Example role ARN:

```text
arn:aws:iam::489109585253:role/GitHub-Actions-ECR-EKS-Role
```

Grant EKS access to the role:

```bash
aws eks create-access-entry \
  --cluster-name relieflink-cluster \
  --region ap-south-1 \
  --principal-arn arn:aws:iam::489109585253:role/GitHub-Actions-ECR-EKS-Role \
  --type STANDARD

aws eks associate-access-policy \
  --cluster-name relieflink-cluster \
  --region ap-south-1 \
  --principal-arn arn:aws:iam::489109585253:role/GitHub-Actions-ECR-EKS-Role \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster
```

## Local Development

### Prerequisites

```text
Node.js 20+
pnpm 10+
Docker
Docker Compose
Git
```

Install dependencies:

```bash
corepack enable
corepack prepare pnpm@10.32.1 --activate
pnpm install
```

Copy env:

```bash
cp .env.example .env
```

Start local infrastructure:

```bash
docker compose up -d
```

Run development services:

```bash
pnpm dev
```

Build all:

```bash
pnpm build
```

Typecheck:

```bash
pnpm typecheck
```

Lint:

```bash
pnpm lint
```

## Production Deployment

### Deploy Through GitHub Actions

Normal deployment flow:

```bash
git add .
git commit -m "Describe deployment change"
git push origin main
```

GitHub Actions will:

1. Build and push Docker images to ECR.
2. Run image security scans.
3. Deploy to EKS.
4. Wait for rollouts.

### Manual Kubernetes Deploy

From a machine with kubeconfig:

```bash
kubectl apply -k k8s/base
kubectl get pods -n relieflink
kubectl get ingress -n relieflink
```

If already inside `k8s/base`:

```bash
kubectl apply -k .
```

### Create Or Update Secrets Manually

```bash
kubectl create secret generic relieflink-secrets \
  --from-literal=JWT_SECRET='change_this' \
  --from-literal=POSTGRES_PASSWORD='ReliefLinkPostgres2026StrongPass' \
  --from-literal=REDIS_PASSWORD='ReliefLinkRedis2026StrongPass' \
  -n relieflink \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Update Existing PostgreSQL Password

```bash
NEW_DB_PASSWORD='ReliefLinkPostgres2026StrongPass'

kubectl exec -n relieflink postgres-0 -- psql -U postgres -d postgres \
  -c "ALTER USER postgres WITH PASSWORD '${NEW_DB_PASSWORD}';"

kubectl patch secret relieflink-secrets -n relieflink \
  -p "{\"data\":{\"POSTGRES_PASSWORD\":\"$(printf %s "$NEW_DB_PASSWORD" | base64 -w0)\"}}"
```

### Update Existing Redis Password

```bash
NEW_REDIS_PASSWORD='ReliefLinkRedis2026StrongPass'

kubectl patch secret relieflink-secrets -n relieflink \
  -p "{\"data\":{\"REDIS_PASSWORD\":\"$(printf %s "$NEW_REDIS_PASSWORD" | base64 -w0)\"}}"

kubectl rollout restart statefulset/redis -n relieflink
```

## Testing And Verification

### Check Cluster

```bash
kubectl get nodes
kubectl get pods -n relieflink
kubectl get svc -n relieflink
kubectl get ingress -n relieflink
```

### Public URL

```bash
echo http://$(kubectl get ingress relieflink-ingress -n relieflink -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
```

### API Health

```bash
ALB_HOST=$(kubectl get ingress relieflink-ingress -n relieflink -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

curl -i http://$ALB_HOST/api/health/live
curl -i http://$ALB_HOST/api/health/ready
```

### Config Service

```bash
curl -i http://$ALB_HOST/api/v1/config/public
```

### Service Health From Inside Cluster

```bash
kubectl exec -n relieflink deployment/api-gateway -- curl -sS http://auth-service:3001/health
kubectl exec -n relieflink deployment/api-gateway -- curl -sS http://request-service:3004/health
kubectl exec -n relieflink deployment/api-gateway -- curl -sS http://volunteer-service:3003/health
kubectl exec -n relieflink deployment/api-gateway -- curl -sS http://notification-service:3002/health
kubectl exec -n relieflink deployment/api-gateway -- curl -sS http://config-service:3006/health
```

### Notification Route

```bash
kubectl exec -n relieflink deployment/api-gateway -- \
  curl -sS http://notification-service:3002/api/v1/notifications/user/test
```

Expected:

```json
{"success":true,"data":[]}
```

## Operations Commands

### Rollout

```bash
kubectl rollout status deployment/api-gateway -n relieflink
kubectl rollout status deployment/web-service -n relieflink
kubectl rollout status deployment/auth-service -n relieflink
kubectl rollout status deployment/request-service -n relieflink
kubectl rollout status deployment/volunteer-service -n relieflink
kubectl rollout status deployment/notification-service -n relieflink
kubectl rollout status deployment/config-service -n relieflink
```

### Restart Services

```bash
kubectl rollout restart deployment/api-gateway -n relieflink
kubectl rollout restart deployment/web-service -n relieflink
kubectl rollout restart deployment/auth-service -n relieflink
kubectl rollout restart deployment/request-service -n relieflink
kubectl rollout restart deployment/volunteer-service -n relieflink
kubectl rollout restart deployment/notification-service -n relieflink
kubectl rollout restart deployment/config-service -n relieflink
```

### Logs

```bash
kubectl logs -n relieflink deployment/api-gateway --tail=100
kubectl logs -n relieflink deployment/web-service --tail=100
kubectl logs -n relieflink deployment/auth-service --tail=100
kubectl logs -n relieflink deployment/request-service --tail=100
kubectl logs -n relieflink deployment/volunteer-service --tail=100
kubectl logs -n relieflink deployment/notification-service --tail=100
kubectl logs -n relieflink deployment/config-service --tail=100
```

Init container logs:

```bash
kubectl logs -n relieflink deployment/auth-service -c migrate --tail=100
kubectl logs -n relieflink deployment/request-service -c migrate --tail=100
kubectl logs -n relieflink deployment/volunteer-service -c migrate --tail=100
kubectl logs -n relieflink deployment/notification-service -c migrate --tail=100
```

### Describe

```bash
kubectl describe pod -n relieflink <pod-name>
kubectl describe deployment api-gateway -n relieflink
kubectl describe ingress relieflink-ingress -n relieflink
kubectl get events -n relieflink --sort-by=.lastTimestamp
```

### Database

```bash
kubectl exec -it -n relieflink postgres-0 -- psql -U postgres -d postgres
```

List databases:

```sql
\l
```

List schemas:

```sql
\dn
```

### Redis

```bash
kubectl exec -n relieflink redis-0 -- redis-cli -a "$REDIS_PASSWORD" ping
```

If `$REDIS_PASSWORD` is not set locally:

```bash
kubectl exec -n relieflink redis-0 -- sh -c 'redis-cli -a "$REDIS_PASSWORD" ping'
```

### ECR

```bash
aws ecr describe-repositories --region ap-south-1
aws ecr describe-images --repository-name relieflink-web --region ap-south-1
```

## Troubleshooting

### `kubectl` Unauthorized In GitHub Actions

Symptom:

```text
You must be logged in to the server (Unauthorized)
```

Cause:

- AWS role can assume credentials, but EKS cluster access entry is missing.

Fix:

```bash
aws eks create-access-entry \
  --cluster-name relieflink-cluster \
  --region ap-south-1 \
  --principal-arn arn:aws:iam::489109585253:role/GitHub-Actions-ECR-EKS-Role \
  --type STANDARD

aws eks associate-access-policy \
  --cluster-name relieflink-cluster \
  --region ap-south-1 \
  --principal-arn arn:aws:iam::489109585253:role/GitHub-Actions-ECR-EKS-Role \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster
```

### EKS Cluster Not Found

Symptom:

```text
ResourceNotFoundException: No cluster found for name
```

Check:

```bash
aws eks list-clusters --region ap-south-1
```

Fix GitHub secrets:

```text
AWS_REGION=ap-south-1
EKS_CLUSTER_STAGING=relieflink-cluster
```

### Pods Pending With PVCs

Symptom:

```text
postgres-0 Pending
redis-0 Pending
PVC StorageClass gp3 Pending
```

Check:

```bash
kubectl get storageclass
kubectl get pvc -n relieflink
kubectl describe pvc -n relieflink
```

Fix:

```bash
kubectl apply -f k8s/base/storageclass.yaml
```

### Prisma Cannot Reach Database Host Like Random Text

Symptom:

```text
P1001 Can't reach database server at `EhVzUzgbR:5432`
```

Cause:

- Password contains URL special characters, and the connection URL is parsed incorrectly.

Fix:

- Use URL-safe passwords or URL-encode full connection strings.

### Missing Prisma Columns

Symptoms:

```text
P2022 column "status" modelName "User"
Empty reply from server on notifications route
```

Fix live DB:

```bash
kubectl exec -n relieflink postgres-0 -- psql -U postgres -d auth_service_db \
  -c 'ALTER TABLE auth_service."User" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT '\''active'\'';'

kubectl exec -n relieflink postgres-0 -- psql -U postgres -d notification_service_db \
  -c 'ALTER TABLE notification_service."Notification" ADD COLUMN IF NOT EXISTS "metadata" JSONB;'
```

Permanent migrations:

```text
services/auth-service/prisma/migrations/0002_add_user_status/migration.sql
services/notification-service/prisma/migrations/0002_add_notification_metadata/migration.sql
```

### ALB URL Does Not Resolve

Symptom:

```text
DNS_PROBE_FINISHED_NXDOMAIN
```

Check:

```bash
kubectl get ingress -n relieflink
nslookup <alb-hostname>
aws elbv2 describe-load-balancers --region ap-south-1
```

If the controller was just installed, wait a few minutes for DNS propagation.

### Ingress Address Empty

Check controller:

```bash
kubectl get pods -n kube-system | grep aws-load-balancer
kubectl logs -n kube-system deployment/aws-load-balancer-controller --tail=100
kubectl describe ingress relieflink-ingress -n relieflink
```

### API Gateway 502 Upstream Failure

Check logs:

```bash
kubectl logs -n relieflink deployment/api-gateway --tail=100
```

Test upstream from gateway:

```bash
kubectl exec -n relieflink deployment/api-gateway -- curl -v http://notification-service:3002/health
```

Restart gateway to clear circuit breaker after upstream is fixed:

```bash
kubectl rollout restart deployment/api-gateway -n relieflink
```

### Frontend Login Network Error

Cause:

- Frontend image built with `NEXT_PUBLIC_API_BASE_URL=http://localhost:3005`, causing the browser to call the user's local machine.

Fix:

- Use relative API paths.
- Current Dockerfile uses:

```text
NEXT_PUBLIC_API_BASE_URL=/
```

### API Gateway Route Not Found On Login

Cause:

- Double prefix such as `/api/api/v1/auth/login`.

Fix:

- Shared frontend API client normalizes `/api` base plus `/api/v1/...` paths.

## Default Demo Login

The auth service seeds this user at startup:

```text
Email: coordinator@relieflink.local
Password: Admin@123
Role: coordinator
```

Login URL:

```text
http://<alb-hostname>/login
```

## Important Implementation Notes

- The dashboard loads request, volunteer, resource, and notification counts in parallel.
- Dashboard stats use `Promise.allSettled` so one failing optional stats endpoint does not break the entire dashboard.
- Logout suppresses `401` toast noise during redirect.
- API gateway circuit breaker can temporarily block an upstream after repeated failures; restart the gateway after fixing the upstream to clear state immediately.
- `config-service` is internal ClusterIP and is exposed publicly only through API gateway paths.
- ALB health checks currently use `/` unless annotations are added. The web route supports `/`; API gateway `/` returns 404, so consider setting explicit ALB health check annotations if needed.

## Recommended Improvements

Short-term:

- Add ALB health check annotations for API gateway path `/health/live`.
- Add readiness probes that depend on real database/Redis connectivity where useful.
- Add GitHub Actions YAML validation.
- Add automated smoke tests after deployment.
- Add a migration job pattern instead of running migrations as init containers on every app pod.
- Add separate database users per service instead of shared `postgres`.
- Use full URL-encoded database and Redis connection secrets instead of password interpolation.

Medium-term:

- Add External Secrets Operator or AWS Secrets Manager integration.
- Add Route 53 DNS and HTTPS ACM certificate.
- Add WAF on ALB for public protection.
- Add OpenTelemetry tracing.
- Add Prometheus/Grafana dashboards.
- Add centralized log aggregation.
- Add environment overlays with Kustomize: `dev`, `staging`, `prod`.
- Add backup/restore plan for PostgreSQL PVC data.

Long-term:

- Replace single in-cluster PostgreSQL with Amazon RDS PostgreSQL.
- Replace in-cluster Redis with Amazon ElastiCache.
- Add blue/green or canary deployments.
- Add integration tests for service-to-service workflows.
- Add load tests and autoscaling validation.

## Quick Command Reference

```bash
# Check app
kubectl get pods -n relieflink
kubectl get ingress -n relieflink

# Get public URL
echo http://$(kubectl get ingress relieflink-ingress -n relieflink -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Restart app services
kubectl rollout restart deployment/api-gateway -n relieflink
kubectl rollout restart deployment/web-service -n relieflink

# Check API gateway logs
kubectl logs -n relieflink deployment/api-gateway --tail=100

# Check notification route
kubectl exec -n relieflink deployment/api-gateway -- curl -sS http://notification-service:3002/api/v1/notifications/user/test

# Apply manifests
kubectl apply -k k8s/base

# Push deployment
git add .
git commit -m "Update ReliefLink deployment"
git push origin main
```

## License

This project is currently private/internal. Add a license file before publishing publicly.
