Use `psql` inside the Postgres pod.

**1. Open Postgres shell**

```bash
kubectl exec -it -n relieflink postgres-0 -- psql -U postgres
```

**2. List databases**

```sql
\l
```

You should see:

```text
auth_service_db
request_service_db
volunteer_service_db
notification_service_db
```

**3. Connect to a database**

Example auth database:

```sql
\c auth_service_db
```

**4. List schemas**

```sql
\dn
```

**5. List tables**

For auth:

```sql
\dt auth_service.*
```

For requests:

```sql
\dt request_service.*
```

For volunteers:

```sql
\dt volunteer_service.*
```

For notifications:

```sql
\dt notification_service.*
```

**6. View data**

Auth users:

```sql
SELECT id, email, "fullName", role, status FROM auth_service."User";
```

Requests:

```sql
SELECT * FROM request_service."ReliefRequest" LIMIT 10;
```

Volunteers:

```sql
SELECT * FROM volunteer_service."Volunteer" LIMIT 10;
```

Notifications:

```sql
SELECT * FROM notification_service."Notification" LIMIT 10;
```

Exit:

```sql
\q
```