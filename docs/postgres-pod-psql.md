# Inspect PostgreSQL Data in Kubernetes

Use `psql` from inside the PostgreSQL pod to inspect the ReliefLink service databases.
The Kubernetes manifests define the namespace as `relieflink`, the PostgreSQL pod as
`postgres-0`, and the StatefulSet service host as `postgres-0.postgres`.

## Before You Start

Make sure your current shell is connected to the correct Kubernetes cluster:

```bash
kubectl config current-context
kubectl get pods -n relieflink
```

Confirm PostgreSQL is running:

```bash
kubectl get pod -n relieflink postgres-0
```

For inspection work, prefer `SELECT` statements and `psql` metadata commands. Be careful
with `UPDATE`, `DELETE`, `TRUNCATE`, and `DROP`, especially in shared or production
clusters.

## Open the PostgreSQL Shell

```bash
kubectl exec -it -n relieflink postgres-0 -- psql -U postgres
```

You can also connect directly to a specific database:

```bash
kubectl exec -it -n relieflink postgres-0 -- psql -U postgres -d auth_service_db
kubectl exec -it -n relieflink postgres-0 -- psql -U postgres -d request_service_db
kubectl exec -it -n relieflink postgres-0 -- psql -U postgres -d volunteer_service_db
kubectl exec -it -n relieflink postgres-0 -- psql -U postgres -d notification_service_db
```

## Useful `psql` Commands

```sql
\l
\c auth_service_db
\dn
\dt auth_service.*
\d auth_service."User"
\x
\pset pager off
\q
```

Common commands:

| Command | Purpose |
| --- | --- |
| `\l` | List databases. |
| `\c <database>` | Connect to another database. |
| `\dn` | List schemas in the current database. |
| `\dt <schema>.*` | List tables in a schema. |
| `\d <schema>."<Table>"` | Describe a table, including columns and indexes. |
| `\x` | Toggle expanded output for wide rows. |
| `\pset pager off` | Stop long output from opening in a pager. |
| `\q` | Exit `psql`. |

## List Databases

```sql
\l
```

You should see these service databases:

```text
auth_service_db
request_service_db
volunteer_service_db
notification_service_db
```

These databases are created by the `postgres-init` ConfigMap in
`k8s/base/postgres.yaml` during the first PostgreSQL data directory initialization.

## Database and Schema Map

| Service | Database | Schema | Main tables |
| --- | --- | --- | --- |
| Auth service | `auth_service_db` | `auth_service` | `"User"` |
| Request service | `request_service_db` | `request_service` | `"ReliefRequest"` |
| Volunteer service | `volunteer_service_db` | `volunteer_service` | `"Volunteer"`, `"Resource"`, `"Assignment"` |
| Notification service | `notification_service_db` | `notification_service` | `"Notification"`, `"StatusEvent"` |

Prisma creates mixed-case table and column names, so wrap those identifiers in double
quotes when writing SQL. For example, use `"User"`, `"ReliefRequest"`, `"fullName"`,
and `"peopleCount"`.

## Auth Service Database

Connect:

```sql
\c auth_service_db
```

List schemas and tables:

```sql
\dn
\dt auth_service.*
```

Describe the users table:

```sql
\d auth_service."User"
```

View users:

```sql
SELECT id, email, "fullName", role, status, district, city, "createdAt"
FROM auth_service."User"
ORDER BY "createdAt" DESC
LIMIT 20;
```

Count users by role and status:

```sql
SELECT role, status, COUNT(*) AS total
FROM auth_service."User"
GROUP BY role, status
ORDER BY role, status;
```

Find the default coordinator account:

```sql
SELECT id, email, "fullName", role, status
FROM auth_service."User"
WHERE email = 'coordinator@relieflink.local';
```

## Request Service Database

Connect:

```sql
\c request_service_db
```

List schemas and tables:

```sql
\dn
\dt request_service.*
```

Describe the relief requests table:

```sql
\d request_service."ReliefRequest"
```

View recent requests:

```sql
SELECT id, "requesterId", category, urgency, status, district, city, "peopleCount", "createdAt"
FROM request_service."ReliefRequest"
ORDER BY "createdAt" DESC
LIMIT 20;
```

Count requests by status and urgency:

```sql
SELECT status, urgency, COUNT(*) AS total
FROM request_service."ReliefRequest"
GROUP BY status, urgency
ORDER BY status, urgency;
```

Find active high-urgency requests:

```sql
SELECT id, category, description, district, city, "peopleCount", status, "createdAt"
FROM request_service."ReliefRequest"
WHERE urgency = 'high'
  AND status NOT IN ('completed', 'cancelled')
ORDER BY "createdAt" DESC
LIMIT 20;
```

## Volunteer Service Database

Connect:

```sql
\c volunteer_service_db
```

List schemas and tables:

```sql
\dn
\dt volunteer_service.*
```

Describe volunteer service tables:

```sql
\d volunteer_service."Volunteer"
\d volunteer_service."Resource"
\d volunteer_service."Assignment"
```

View volunteers:

```sql
SELECT id, "userId", "skillSet", district, city, "availabilityStatus", "createdAt"
FROM volunteer_service."Volunteer"
ORDER BY "createdAt" DESC
LIMIT 20;
```

View resources:

```sql
SELECT id, "ownerId", category, quantity, district, city, "availabilityStatus", "createdAt"
FROM volunteer_service."Resource"
ORDER BY "createdAt" DESC
LIMIT 20;
```

View assignments:

```sql
SELECT id, "requestId", "volunteerId", "resourceId", "assignedBy", status, "assignedAt"
FROM volunteer_service."Assignment"
ORDER BY "assignedAt" DESC
LIMIT 20;
```

Count volunteers by availability:

```sql
SELECT "availabilityStatus", COUNT(*) AS total
FROM volunteer_service."Volunteer"
GROUP BY "availabilityStatus"
ORDER BY "availabilityStatus";
```

Count resources by category and availability:

```sql
SELECT category, "availabilityStatus", COUNT(*) AS total
FROM volunteer_service."Resource"
GROUP BY category, "availabilityStatus"
ORDER BY category, "availabilityStatus";
```

## Notification Service Database

Connect:

```sql
\c notification_service_db
```

List schemas and tables:

```sql
\dn
\dt notification_service.*
```

Describe notification service tables:

```sql
\d notification_service."Notification"
\d notification_service."StatusEvent"
```

View recent notifications:

```sql
SELECT id, "userId", message, channel, "deliveryStatus", metadata, "createdAt"
FROM notification_service."Notification"
ORDER BY "createdAt" DESC
LIMIT 20;
```

View request status events:

```sql
SELECT id, "requestId", "oldStatus", "newStatus", "changedBy", timestamp
FROM notification_service."StatusEvent"
ORDER BY timestamp DESC
LIMIT 20;
```

Count notifications by channel and delivery status:

```sql
SELECT channel, "deliveryStatus", COUNT(*) AS total
FROM notification_service."Notification"
GROUP BY channel, "deliveryStatus"
ORDER BY channel, "deliveryStatus";
```

## Run One-Off Queries Without an Interactive Shell

Use `kubectl exec` with `psql -c` when you only need one result:

```bash
kubectl exec -n relieflink postgres-0 -- \
  psql -U postgres -d auth_service_db \
  -c 'SELECT email, role, status FROM auth_service."User" ORDER BY "createdAt" DESC LIMIT 10;'
```

List all service databases in one command:

```bash
kubectl exec -n relieflink postgres-0 -- \
  psql -U postgres -d postgres \
  -c '\l'
```

Check whether PostgreSQL is accepting connections:

```bash
kubectl exec -n relieflink postgres-0 -- pg_isready -U postgres
```

## Troubleshooting

If the pod is not found, confirm the namespace and pod name:

```bash
kubectl get pods -n relieflink
kubectl get statefulset -n relieflink postgres
```

If the terminal behaves strangely after opening `psql`, make sure you used `-it` for
interactive mode:

```bash
kubectl exec -it -n relieflink postgres-0 -- psql -U postgres
```

If a table query fails with `relation does not exist`, check three things:

```sql
\c auth_service_db
\dn
\dt auth_service.*
```

Also confirm quoted identifiers are used for mixed-case names:

```sql
SELECT "fullName" FROM auth_service."User" LIMIT 5;
```

If a service database is missing, remember that the init SQL only runs when PostgreSQL
initializes an empty data directory. Existing persistent volumes will not automatically
rerun the init script after `k8s/base/postgres.yaml` changes.

## Exit

```sql
\q
```
