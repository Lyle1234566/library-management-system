# Active Students Metric - Implementation Guide

## Overview

The Active Students metric tracks unique students who have engaged with library services within a configurable time window (default: 30 days).

## Database Implementation

### PostgreSQL Function

**Function Name:** `get_active_students_count(days_window INTEGER DEFAULT 30)`

**Returns:** INTEGER (count of active students)

**Description:** Counts unique students with library activity in the specified time window.

### Activity Sources

The function tracks activity from these tables:
- `books_borrowrequest` - Borrow requests created
- `books_borrowrequest` (approved) - Books borrowed (processed_at)
- `books_borrowrequest` (returned) - Books returned (processed_at)
- `books_borrowrequest` (renewed) - Renewal activity (last_renewed_at)
- `books_finepayment` - Fine payment activity
- `books_reservation` - Reservation activity

### Database View

**View Name:** `active_students_last_30_days`

Quick access view for the default 30-day window:
```sql
SELECT * FROM active_students_last_30_days;
```

## Performance Optimization

### Indexes Created

1. **Borrow Requests Index:**
   ```sql
   CREATE INDEX idx_borrow_requests_user_created 
   ON books_borrowrequest(user_id, requested_at) 
   WHERE user_id IN (SELECT id FROM user_user WHERE role = 'STUDENT' AND is_active = true);
   ```

2. **Fine Payments Index:**
   ```sql
   CREATE INDEX idx_fine_payments_user_created 
   ON books_finepayment(borrow_request_id, created_at);
   ```

3. **Reservations Index:**
   ```sql
   CREATE INDEX idx_reservations_user_created 
   ON books_reservation(user_id, created_at) 
   WHERE user_id IN (SELECT id FROM user_user WHERE role = 'STUDENT' AND is_active = true);
   ```

## API Endpoint

### Endpoint Details

**URL:** `/api/books/active-students-metric/`

**Method:** GET

**Authentication:** Required (Librarian, Staff, Admin, or Working Student)

**Query Parameters:**
- `days` (optional, integer, 1-365): Time window in days (default: 30)

### Request Example

```bash
# Get active students in last 30 days (default)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/books/active-students-metric/

# Get active students in last 7 days
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/books/active-students-metric/?days=7

# Get active students in last 90 days
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/books/active-students-metric/?days=90
```

### Response Example

```json
{
  "active_students_count": 42,
  "days_window": 30,
  "description": "Students with library activity in the last 30 days"
}
```

### Error Responses

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to view this metric."
}
```

**400 Bad Request:**
```json
{
  "detail": "Days parameter must be between 1 and 365."
}
```

## Migration

### Apply Migration

```bash
cd backend
python manage.py migrate books
```

### Migration File

Location: `backend/books/migrations/0028_active_students_metric.py`

The migration creates:
1. PostgreSQL function `get_active_students_count()`
2. Database view `active_students_last_30_days`
3. Performance indexes on activity tables

### Rollback

```bash
python manage.py migrate books 0027_book_description
```

## Usage Examples

### Direct SQL Query

```sql
-- Get active students in last 30 days
SELECT get_active_students_count(30);

-- Get active students in last 7 days
SELECT get_active_students_count(7);

-- Use the view for default 30-day window
SELECT count FROM active_students_last_30_days;
```

### Python/Django Usage

```python
from django.db import connection

def get_active_students(days=30):
    with connection.cursor() as cursor:
        cursor.execute('SELECT get_active_students_count(%s)', [days])
        result = cursor.fetchone()
        return result[0] if result else 0

# Usage
active_count = get_active_students(30)
print(f"Active students: {active_count}")
```

### Frontend Integration

```javascript
// Fetch active students metric
async function fetchActiveStudents(days = 30) {
  const response = await fetch(
    `/api/books/active-students-metric/?days=${days}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch active students metric');
  }
  
  const data = await response.json();
  return data.active_students_count;
}

// Usage
const activeStudents = await fetchActiveStudents(30);
console.log(`Active students: ${activeStudents}`);
```

## Business Rules

1. **Student Definition:** Only users with `role = 'STUDENT'` are counted
2. **Active Status:** Only `is_active = true` users are included
3. **Unique Count:** Each student is counted only once, regardless of activity volume
4. **Time Window:** Configurable from 1 to 365 days
5. **Activity Types:** All library interactions count (borrow, return, renew, fine, reservation)

## Performance Considerations

- **Indexes:** Partial indexes on student-only records reduce index size
- **Function:** Uses UNION to combine activity sources efficiently
- **View:** Pre-computed for the common 30-day window
- **Caching:** Consider caching results for 1-5 minutes in high-traffic scenarios

## Monitoring

### Check Index Usage

```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%_user_created'
ORDER BY idx_scan DESC;
```

### Query Performance

```sql
EXPLAIN ANALYZE SELECT get_active_students_count(30);
```

## Troubleshooting

### Function Not Found

```sql
-- Check if function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_active_students_count';

-- Recreate if needed
-- Run migration again or execute SQL manually
```

### Slow Performance

1. Check index usage (see Monitoring section)
2. Verify PostgreSQL statistics are up to date:
   ```sql
   ANALYZE books_borrowrequest;
   ANALYZE books_finepayment;
   ANALYZE books_reservation;
   ANALYZE user_user;
   ```
3. Consider reducing the time window for faster queries

### Incorrect Counts

1. Verify student role assignments:
   ```sql
   SELECT COUNT(*) FROM user_user WHERE role = 'STUDENT' AND is_active = true;
   ```

2. Check activity data:
   ```sql
   SELECT COUNT(*) FROM books_borrowrequest 
   WHERE requested_at >= NOW() - INTERVAL '30 days';
   ```

## Future Enhancements

Potential improvements:
- Add caching layer for frequently requested time windows
- Create materialized view for daily snapshots
- Add breakdown by activity type
- Track trends over time (week-over-week, month-over-month)
- Add student engagement scoring
