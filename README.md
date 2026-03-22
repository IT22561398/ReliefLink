# ReliefLink - Production-Grade Cloud-Native Disaster Management Platform

> A modern, scalable disaster management platform built with microservices architecture, deployed on AWS infrastructure with Kubernetes orchestration.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Quick Start](#quick-start)
5. [Production Deployment](#production-deployment)
6. [API Documentation](#api-documentation)
7. [Database Setup](#database-setup)
8. [Service Communication](#service-communication)
9. [Monitoring & Troubleshooting](#monitoring--troubleshooting)
10. [Security](#security)
11. [Contributing](#contributing)

---

## Overview

ReliefLink is a **production-grade disaster management platform** designed to coordinate relief operations efficiently. It enables:

- **Requesters** to post relief requirements
- **Volunteers** to register, get approved, and offer help
- **Coordinators** to manage requests and volunteer assignments
- **Notifications** to keep all parties informed in real-time

### Key Features

✅ **Cloud-Native Architecture** - Microservices on AWS
✅ **High Availability** - Multiple replicas, auto-scaling, load balancing
✅ **Production Ready** - Health checks, security hardening, monitoring
✅ **Scalable** - Horizontal Pod Autoscaling (HPA) up to 5 replicas per service
✅ **Secure** - OIDC authentication, encrypted secrets, non-root containers
✅ **Observable** - Structured logging, health endpoints, metrics ready

---

## Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     End Users (Web)                         │
│                  http://localhost:3000                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Nginx Ingress Controller (AWS ELB)             │
│              Single entry point for all traffic             │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │ Auth Service │  │Request Svc   │  │Volunteer Svc │
  │ Port: 3001   │  │ Port: 3004   │  │ Port: 3003   │
  └──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │Notification  │  │  PostgreSQL  │  │    Redis     │
  │Service 3004  │  │ (StatefulSet)│  │(StatefulSet) │
  └──────────────┘  └──────────────┘  └──────────────┘
```

### Microservices Architecture

#### 1. **Auth Service** (Port 3001)

- User registration and authentication
- Role management (Admin, Coordinator, Requester, Volunteer)
- JWT token generation and validation
- User profile management
- Volunteer profile creation on approval

**Database**: PostgreSQL (auth_service_db)

#### 2. **Request Service** (Port 3004)

- Relief request creation and management
- Request status tracking (submitted, assigned, in-progress, completed)
- Resource allocation
- Request fulfillment tracking

**Database**: PostgreSQL (request_service_db)

#### 3. **Volunteer Service** (Port 3003)

- Volunteer registration and skills management
- Availability status tracking
- Resource allocation to volunteers
- Assignment management (volunteers "I Can Help" a request)
- Assignment status updates (pending, in-progress, completed)

**Database**: PostgreSQL (volunteer_service_db)

#### 4. **Notification Service** (Port 3004)

- Async notification delivery
- Email/SMS support
- Event-driven using Redis BullMQ
- Queue-based processing
- Status event tracking

**Database**: PostgreSQL (notification_service_db)
**Queue**: Redis (Job Queue)

#### 5. **Frontend** (Port 3000)

- Next.js React application
- User authentication pages
- Requester dashboard (create requests, view volunteers)
- Volunteer dashboard (accept assignments, mark complete)
- Coordinator admin panel
- Real-time notification system

---

## Technology Stack

### Backend

| Layer               | Technology         | Version |
| ------------------- | ------------------ | ------- |
| **Runtime**         | Node.js            | 20 LTS  |
| **Package Manager** | pnpm               | 10+     |
| **Frameworks**      | Express.js         | 4.22+   |
| **Language**        | TypeScript         | 5.0+    |
| **ORM**             | Prisma             | 5.0+    |
| **Authentication**  | JWT (jsonwebtoken) | 9.0+    |
| **Validation**      | Zod                | 3.25+   |
| **Job Queue**       | BullMQ             | 4.0+    |
| **Testing**         | Jest               | 29.0+   |

### Database & Cache

| Service                | Technology | Version      |
| ---------------------- | ---------- | ------------ |
| **Relational DB**      | PostgreSQL | 16           |
| **Cache/Queue**        | Redis      | 7            |
| **Connection Pooling** | PgBouncer  | (via Prisma) |

### Frontend

| Component           | Technology   | Version |
| ------------------- | ------------ | ------- |
| **Framework**       | Next.js      | 14+     |
| **UI Library**      | React        | 19+     |
| **Styling**         | Tailwind CSS | 3.4+    |
| **HTTP Client**     | Fetch API    | -       |
| **Form Validation** | Zod          | 3.25+   |

### Infrastructure & Deployment

| Component              | Technology                        | Details                           |
| ---------------------- | --------------------------------- | --------------------------------- |
| **Container Registry** | AWS ECR                           | Elastic Container Registry        |
| **Orchestration**      | AWS EKS                           | Elastic Kubernetes Service v1.28+ |
| **Container Runtime**  | Docker                            | Multi-stage Alpine builds         |
| **CI/CD**              | GitHub Actions                    | Build, test, push, deploy         |
| **IaC**                | Kubernetes Manifests + Kustomize  | Production-grade configs          |
| **Ingress**            | Nginx                             | ClusterIP with ingress routing    |
| **Auto-scaling**       | HPA                               | Horizontal Pod Autoscaler         |
| **Secrets**            | AWS Secrets Manager / K8s Secrets | Encrypted at rest                 |

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 10+
- **Docker** & **Docker Compose**
- **Git**

### Local Development Setup

#### 1. Clone Repository

```bash
git clone <repository-url>
cd disaster-management-platform
```

#### 2. Install Dependencies

```bash
pnpm install
```

#### 3. Setup Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

#### 4. Initialize Database

```bash
# Generate Prisma client
pnpm db:generate

# Create database schema
pnpm db:push
```

#### 5. Start Everything

```bash
# Option 1: Start all services at once
pnpm start

# Option 2: In separate terminals
pnpm infra:up           # Start Docker (PostgreSQL, Redis)
pnpm dev:services       # Start backend services
pnpm dev:web            # Start frontend (separate terminal)
```

### Service URLs

| Service      | URL                   | Port |
| ------------ | --------------------- | ---- |
| Frontend     | http://localhost:3000 | 3000 |
| Auth         | http://localhost:3001 | 3001 |
| Request      | http://localhost:3004 | 3004 |
| Volunteer    | http://localhost:3003 | 3003 |
| Notification | http://localhost:3004 | 3004 |

### Default Credentials

```
Email: coordinator@relieflink.local
Password: Admin@123
```

---

## Production Deployment

### AWS Setup

#### Step 1: Create OIDC Provider (One-time)

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

#### Step 2: Create IAM Role for GitHub Actions

```bash
# Create trust policy
cat > trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name relieflink-github-actions \
  --assume-role-policy-document file://trust-policy.json
```

#### Step 3: Create IAM Policy

```bash
cat > policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:CreateRepository",
        "ecr:DescribeRepositories",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["eks:DescribeCluster", "eks:ListClusters"],
      "Resource": "*"
    }
  ]
}
EOF

aws iam create-policy \
  --policy-name relieflink-github-policy \
  --policy-document file://policy.json

aws iam attach-role-policy \
  --role-name relieflink-github-actions \
  --policy-arn arn:aws:iam::ACCOUNT_ID:policy/relieflink-github-policy
```

#### Step 4: Create ECR Repositories

```bash
for service in auth-service request-service volunteer-service notification-service; do
  aws ecr create-repository \
    --repository-name relieflink-$service \
    --region us-east-1 \
    --image-scanning-configuration scanOnPush=true
done
```

#### Step 5: Update GitHub Secrets

Add these to `Settings → Secrets and variables → Actions`:

```
AWS_ROLE_TO_ASSUME=arn:aws:iam::ACCOUNT_ID:role/relieflink-github-actions
AWS_REGION=us-east-1
AWS_ECR_REPOSITORY_PREFIX=relieflink
EKS_CLUSTER_PROD=relieflink-prod
EKS_CLUSTER_STAGING=relieflink-staging
JWT_SECRET=your-secure-jwt-secret
AUTH_DB_PASSWORD=secure-password
REQUEST_DB_PASSWORD=secure-password
VOLUNTEER_DB_PASSWORD=secure-password
NOTIFICATION_DB_PASSWORD=secure-password
REDIS_PASSWORD=secure-password
SLACK_WEBHOOK=https://hooks.slack.com/...
CODECOV_TOKEN=your-token
```

### CI/CD Pipelines

#### Build & Test Workflow (`.github/workflows/build-test.yml`)

**Triggers:**

- Push to `main` or `develop`
- Pull requests

**Steps:**

1. Run tests on all 4 services (lint, typecheck, unit tests)
2. Build Docker images with multi-stage builds
3. Push to AWS ECR with commit SHA as tag
4. Run Trivy security vulnerability scan
5. Upload results to GitHub Security tab

#### Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**

- Push to `main` → **Staging deployment**
- Tags matching `v*.*.*` → **Production deployment**
- Manual workflow dispatch

**Steps:**

1. Authenticate with AWS via OIDC
2. Login to AWS ECR
3. Update kubeconfig for EKS cluster
4. Update image references in K8s manifests
5. Apply manifests via kustomize
6. Verify rollout status (5min timeout)
7. Run health checks
8. Notify Slack of deployment status

### Kubernetes Deployment Structure

```
k8s/
├── base/                          # Common manifests
│   ├── namespace.yaml
│   ├── secrets-configmap.yaml
│   ├── postgres.yaml (StatefulSet, 50GB storage)
│   ├── redis.yaml (StatefulSet, 20GB storage)
│   ├── auth-service.yaml (3 replicas, 1GB memory, 1000m CPU)
│   ├── request-service.yaml
│   ├── volunteer-service.yaml
│   ├── notification-service.yaml
│   ├── ingress.yaml (Nginx)
│   └── kustomization.yaml
│
└── overlays/
    └── prod/
        ├── kustomization.yaml
        ├── auth-service-patch.yaml
        ├── request-service-patch.yaml
        ├── volunteer-service-patch.yaml
        ├── notification-service-patch.yaml
        ├── postgres-patch.yaml
        └── redis-patch.yaml
```

### Key Kubernetes Features

✅ **High Availability**

- 3 replicas per service
- Pod anti-affinity (spread across nodes)
- Health checks (liveness + readiness probes)
- Rolling update strategy

✅ **Auto-scaling**

- HorizontalPodAutoscaler (HPA)
- Min 2 replicas, max 5 replicas
- Triggers: CPU > 70%, Memory > 80%

✅ **Persistent Storage**

- StatefulSets for PostgreSQL and Redis
- PersistentVolumeClaims with 50GB/20GB storage
- Stable DNS hostnames (postgres-0.postgres:5432)

✅ **Resource Management**

- CPU requests: 500m, limits: 1000m
- Memory requests: 512MB, limits: 1GB
- Prevents resource starvation

✅ **Secret Management**

- Kubernetes Secrets (encrypted at rest)
- ConfigMaps for non-sensitive config
- Environment variable injection

### Deployment Commands

```bash
# Deploy to production
kubectl apply -k k8s/overlays/prod/

# Check deployment status
kubectl get deployment -n relieflink
kubectl get pods -n relieflink
kubectl get svc -n relieflink

# Monitor rollout
kubectl rollout status deployment/auth-service -n relieflink

# View logs
kubectl logs -f deployment/auth-service -n relieflink

# Access database
kubectl exec -it postgres-0 -n relieflink -- psql -U auth_user -d auth_service_db
```

---

## API Documentation

### Auth Service (Port 3001)

```
POST   /api/v1/auth/register         - Register new user
POST   /api/v1/auth/login            - User login (returns JWT)
GET    /api/v1/auth/me               - Get current user profile
GET    /api/v1/users/:id             - Get user by ID
PATCH  /api/v1/users/:id/role        - Update user role (admin only)
GET    /health                       - Health check
```

### Request Service (Port 3004)

```
POST   /api/v1/requests              - Create relief request
GET    /api/v1/requests              - List all requests
GET    /api/v1/requests/:id          - Get request details
PATCH  /api/v1/requests/:id          - Update request
PATCH  /api/v1/requests/:id/status   - Update request status
GET    /health                       - Health check
```

### Volunteer Service (Port 3003)

```
POST   /api/v1/volunteers                    - Register volunteer
GET    /api/v1/volunteers                    - List volunteers
PATCH  /api/v1/volunteers/:id/availability  - Update availability
POST   /api/v1/assignments                  - Create assignment (volunteer takes request)
GET    /api/v1/assignments/:requestId       - Get assignment for request
PATCH  /api/v1/assignments/:id/status       - Update assignment status
GET    /health                             - Health check
```

### Notification Service (Port 3004)

```
POST   /api/v1/notifications              - Send notification
GET    /api/v1/notifications/user/:userId - Get user notifications
POST   /api/v1/status-events             - Log status event
GET    /api/v1/status-events/request/:id - Get request status events
GET    /health                           - Health check
```

### Example Requests

**Register User:**

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "fullName": "John Doe",
    "role": "volunteer",
    "district": "Mumbai",
    "city": "Mumbai"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

**Create Request:**

```bash
curl -X POST http://localhost:3004/api/v1/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "title": "Medical supplies needed",
    "description": "Need emergency medicines",
    "status": "submitted",
    "district": "Mumbai",
    "city": "Mumbai"
  }'
```

---

## Database Setup

### PostgreSQL

Each service has its own dedicated PostgreSQL database for data isolation:

| Service      | Database                | User              | Port |
| ------------ | ----------------------- | ----------------- | ---- |
| Auth         | auth_service_db         | auth_user         | 5432 |
| Request      | request_service_db      | request_user      | 5433 |
| Volunteer    | volunteer_service_db    | volunteer_user    | 5434 |
| Notification | notification_service_db | notification_user | 5435 |

**Connection String Format:**

```
postgresql://username:password@host:port/database_name
```

**Local Development:**

```
postgresql://auth_user:auth_password@localhost:5432/auth_service_db
postgresql://request_user:request_password@localhost:5433/request_service_db
```

**Kubernetes:**

```
postgresql://auth_user:auth_password@postgres-0.postgres:5432/auth_service_db
```

### Schema Management

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Reset database (dev only)
pnpm db:reset

# Create migration
pnpm db:migrate
```

### Redis

- **Purpose**: Job queue (BullMQ), session cache
- **Local**: redis://localhost:6379
- **Kubernetes**: redis://redis-0.redis:6379
- **Socket**: /data/redis.sock (persistence)

---

## Service Communication

### Kubernetes Service Discovery

When deployed to Kubernetes, services communicate via DNS:

```
auth-service:3001                    # Within same namespace
auth-service.relieflink.svc.cluster.local:3001  # Fully qualified
```

### Service URLs Configuration

**ConfigMap** (`k8s/base/secrets-configmap.yaml`):

```yaml
AUTH_SERVICE_URL: http://auth-service:3001
REQUEST_SERVICE_URL: http://request-service:3004
VOLUNTEER_SERVICE_URL: http://volunteer-service:3003
```

### Inter-Service Communication

**Example: Volunteer Service → Auth Service**

```typescript
// In volunteer-service code
const authUrl = process.env.AUTH_SERVICE_URL;
const response = await fetch(`${authUrl}/api/v1/users/${userId}`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

### Service-to-Service Authentication

- Services authenticate using JWT tokens
- Coordinator/Admin actions pass authorization headers
- No direct service-to-service special auth (just HTTP + JWT)

### Verification Commands

```bash
# Check services exist
kubectl get svc -n relieflink

# Verify endpoints
kubectl get endpoints -n relieflink

# Test DNS resolution from pod
kubectl exec -it deployment/auth-service -n relieflink -- \
  nslookup request-service

# Test connectivity
kubectl exec -it deployment/auth-service -n relieflink -- \
  curl -v http://request-service:3004/health
```

---

## Monitoring & Troubleshooting

### Health Checks

All services expose health endpoints:

```bash
curl http://localhost:3001/health
curl http://localhost:3004/health
curl http://localhost:3003/health
```

### Viewing Logs

**Local Development:**

```bash
# All services
pnpm dev

# Individual service
pnpm -F @relieflink/auth-service dev:debug
```

**Kubernetes:**

```bash
# Current logs
kubectl logs deployment/auth-service -n relieflink

# Follow logs (tail -f)
kubectl logs -f deployment/auth-service -n relieflink

# Previous pod (if crashed)
kubectl logs -p deployment/auth-service -n relieflink

# All pods in deployment
kubectl logs -f deployment/auth-service -n relieflink --all-containers
```

### Debugging Issues

**Pod Not Starting:**

```bash
kubectl describe pod <pod-name> -n relieflink
kubectl logs <pod-name> -n relieflink
```

**Database Connection Failed:**

```bash
# Check if postgres is running
kubectl get pods -n relieflink | grep postgres

# Check postgres logs
kubectl logs postgres-0 -n relieflink

# Test connection
kubectl exec -it postgres-0 -n relieflink -- psql -U auth_user -d auth_service_db
```

**Service Can't Find Other Service:**

```bash
# Verify service exists
kubectl get svc request-service -n relieflink

# Check endpoints
kubectl get endpoints request-service -n relieflink

# Test DNS from pod
kubectl exec -it deployment/auth-service -n relieflink -- nslookup request-service
```

**Port/Network Issues:**

```bash
# Port forward to test
kubectl port-forward svc/auth-service 3001:3001 -n relieflink

# Test from localhost
curl http://localhost:3001/health
```

### Resources & Limits

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n relieflink

# Check HPA status
kubectl get hpa -n relieflink
kubectl describe hpa auth-service-hpa -n relieflink
```

### Common Issues & Solutions

| Issue                      | Cause                     | Solution                                                         |
| -------------------------- | ------------------------- | ---------------------------------------------------------------- |
| **Connection refused**     | Service not running       | `kubectl get pods`, check logs                                   |
| **Name resolution failed** | DNS not working           | Check CoreDNS: `kubectl get pods -n kube-system \| grep coredns` |
| **Port already in use**    | Local collision           | `lsof -i :3001` and kill process                                 |
| **Database locked**        | Connection pool exhausted | Check connections: `psql -c "SELECT * FROM pg_stat_activity;"`   |
| **Pod OOMKilled**          | Insufficient memory       | Increase limits in kustomize patches                             |
| **Image pull error**       | Registry auth failed      | Check ECR credentials                                            |

---

## Security

### Implemented Security Measures

✅ **Non-root Containers**

- All containers run as UID 1001 (appuser)
- Prevents privilege escalation

✅ **Resource Limits**

- CPU limits prevent DoS attacks
- Memory limits prevent OOM issues

✅ **Secrets Management**

- Kubernetes Secrets (encrypted at rest)
- AWS Secrets Manager for prod
- No hardcoded credentials

✅ **Authentication**

- JWT with RS256 signing
- Secure password hashing (bcrypt)
- Token expiration

✅ **Container Security**

- Multi-stage builds (minimal image size)
- Alpine base images (smallest attack surface)
- Non-root user execution
- Read-only root filesystem (recommended)

### Recommended Production Hardening

1. **Enable TLS/SSL:**

   ```bash
   # Install cert-manager
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

   # Configure in ingress
   kubectl patch ingress relieflink -n relieflink -p '{"spec":{"tls":[{"hosts":["app.relieflink.com"],"secretName":"relieflink-tls"}]}}'
   ```

2. **Pod Security Policy:**

   ```yaml
   apiVersion: policy/v1beta1
   kind: PodSecurityPolicy
   metadata:
     name: restricted
   spec:
     privileged: false
     allowPrivilegeEscalation: false
   ```

3. **Network Policies:**

   ```bash
   # Restrict traffic between services
   kubectl apply -f k8s/network-policies.yaml  # (create this file)
   ```

4. **RBAC:**

   ```bash
   # Create service accounts with minimal permissions
   kubectl apply -f k8s/rbac.yaml  # (create this file)
   ```

5. **Audit Logging:**
   ```bash
   # Enable in EKS cluster
   aws eks update-cluster-config \
     --name relieflink-prod \
     --logging config clusterLogging=[{enabled=true,types=[audit]}]
   ```

---

## Docker Images

### Multi-Stage Build Process

All services use optimized multi-stage Dockerfile:

```dockerfile
# Stage 1: Base with dependencies
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml .

# Stage 2: Install dependencies
FROM base AS dependencies
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM dependencies AS builder
COPY . .
RUN pnpm run build

# Stage 4: Runtime (minimal)
FROM node:20-alpine AS runtime
RUN addgroup -g 1001 nodejs && adduser -u 1001 appuser
WORKDIR /app
COPY --from=builder /app/dist .
COPY --from=builder /app/node_modules ./node_modules
RUN chown -R appuser:nodejs /app
USER appuser
EXPOSE 3001
CMD ["node", "server.js"]
```

**Benefits:**

- ~50% smaller final image (Alpine vs full Node)
- Non-root execution (UID 1001)
- Minimal attack surface
- Production-optimized

### Building Images

**Locally:**

```bash
docker build -f services/auth-service/Dockerfile -t relieflink-auth-service:latest .
docker tag relieflink-auth-service:latest <account>.dkr.ecr.us-east-1.amazonaws.com/relieflink-auth-service:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/relieflink-auth-service:latest
```

**Via CI/CD:**

```bash
git tag v1.0.0
git push origin v1.0.0
# GitHub Actions automatically builds, pushes, and deploys
```

---

## Development Workflow

### Local Development

```bash
# 1. Start infrastructure
pnpm infra:up

# 2. In another terminal, start services
pnpm dev:services

# 3. In another terminal, start web
pnpm dev:web
```

### Creating a Feature

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes
# ... edit files ...

# 3. Run tests
pnpm test

# 4. Lint and format
pnpm lint
pnpm format

# 5. Commit and push (use conventional commits)
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature

# 6. Create PR on GitHub
# GitHub Actions will automatically test and build

# 7. Merge PR and create release tag
git tag v1.1.0
git push origin v1.1.0
# GitHub Actions will automatically deploy to production
```

### Conventional Commits

```
feat:  A new feature
fix:   A bug fix
docs:  Documentation changes
test:  Adding or fixing tests
refactor: Code restructuring
perf:  Performance improvements
chore: Build, dependencies, etc
```

---

## Pre-Deployment Checklist

- [ ] Update all secrets in GitHub Actions
- [ ] Create ECR repositories for all services
- [ ] Verify EKS cluster exists and is accessible
- [ ] Update image references in k8s manifests
- [ ] Configure kubectl context
- [ ] Install Nginx Ingress controller
- [ ] Install cert-manager (for TLS)
- [ ] Enable EKS logging & monitoring
- [ ] Setup CloudWatch alarms
- [ ] Configure backup strategy
- [ ] Load test the application
- [ ] Document runbooks for ops team
- [ ] Setup monitoring dashboard
- [ ] Test disaster recovery procedures

---

## References

### Documentation

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Docker Documentation](https://docs.docker.com/)
- [Prisma ORM](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Next.js Documentation](https://nextjs.org/docs/)

### Tools

- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [kustomize](https://kustomize.io/)
- [Helm Charts](https://helm.sh/)
- [Prometheus](https://prometheus.io/)
- [Grafana](https://grafana.com/)

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## Support

For issues, questions, or suggestions:

1. Check existing issues on GitHub
2. Create detailed issue with reproduction steps
3. Include error logs and environment details
4. Tag with appropriate labels

---

**Last Updated**: March 21, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
