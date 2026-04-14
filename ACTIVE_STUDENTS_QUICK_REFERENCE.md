# Active Students Metric - Quick Reference

## 🚀 Quick Start

### 1. Apply Migration
```bash
cd backend
python manage.py migrate books
```

### 2. Test SQL Function
```sql
SELECT get_active_students_count(30);
```

### 3. Test API Endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/books/active-students-metric/
```

## 📊 SQL Queries

### Get Active Students (Various Windows)
```sql
-- Last 7 days
SELECT get_active_students_count(7);

-- Last 30 days (default)
SELECT get_active_students_count(30);

-- Last 90 days
SELECT get_active_students_count(90);

-- Use the view (30 days)
SELECT * FROM active_students_last_30_days;
```

### Check Activity Breakdown
```sql
-- Borrow requests in last 30 days
SELECT COUNT(DISTINCT br.user_id)
FROM books_borrowrequest br
INNER JOIN user_user u ON br.user_id = u.id
WHERE u.role = 'STUDENT' 
  AND u.is_active = true
  AND br.requested_at >= NOW() - INTERVAL '30 days';

-- Reservations in last 30 days
SELECT COUNT(DISTINCT r.user_id)
FROM books_reservation r
INNER JOIN user_user u ON r.user_id = u.id
WHERE u.role = 'STUDENT'
  AND u.is_active = true
  AND r.created_at >= NOW() - INTERVAL '30 days';
```

## 🔌 API Usage

### Endpoint
```
GET /api/books/active-students-metric/
```

### Parameters
| Parameter | Type    | Required | Default | Range   | Description           |
|-----------|---------|----------|---------|---------|----------------------|
| days      | integer | No       | 30      | 1-365   | Time window in days  |

### Examples

**JavaScript/Fetch:**
```javascript
const response = await fetch('/api/books/active-students-metric/?days=30', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
});
const data = await response.json();
console.log(data.active_students_count);
```

**Python/Requests:**
```python
import requests

response = requests.get(
    'http://localhost:8000/api/books/active-students-metric/',
    params={'days': 30},
    headers={'Authorization': f'Bearer {access_token}'}
)
data = response.json()
print(f"Active students: {data['active_students_count']}")
```

**cURL:**
```bash
# Default (30 days)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/books/active-students-metric/

# Custom window (7 days)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/books/active-students-metric/?days=7
```

## 🎨 Frontend Integration

### Current Implementation
The dashboard card uses `mostActiveStudents.length` from existing data:

```tsx
<p className="mt-4 text-3xl font-bold text-slate-900">
  {mostActiveStudents.length}
</p>
```

### API Integration (Optional)
```typescript
// Fetch from API endpoint
const fetchActiveStudents = async (days: number = 30) => {
  const response = await fetch(
    `/api/books/active-students-metric/?days=${days}`,
    {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch active students');
  }
  
  const data = await response.json();
  return data.active_students_count;
};

// Usage in component
const [activeStudents, setActiveStudents] = useState(0);

useEffect(() => {
  fetchActiveStudents(30).then(setActiveStudents);
}, []);
```

## 🔍 Monitoring

### Check Function Exists
```sql
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_active_students_count';
```

### Check Indexes
```sql
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%_user_created';
```

### Query Performance
```sql
EXPLAIN ANALYZE SELECT get_active_students_count(30);
```

### Index Usage Stats
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%_user_created'
ORDER BY idx_scan DESC;
```

## 🛠️ Troubleshooting

### Function Not Found
```sql
-- Check if migration ran
SELECT * FROM django_migrations 
WHERE app = 'books' AND name = '0028_active_students_metric';

-- Manually create function (if needed)
-- See migration file for SQL
```

### Zero Results
```sql
-- Check if students exist
SELECT COUNT(*) FROM user_user 
WHERE role = 'STUDENT' AND is_active = true;

-- Check if activity exists
SELECT COUNT(*) FROM books_borrowrequest 
WHERE requested_at >= NOW() - INTERVAL '30 days';
```

### Slow Performance
```sql
-- Update statistics
ANALYZE books_borrowrequest;
ANALYZE books_finepayment;
ANALYZE books_reservation;
ANALYZE user_user;

-- Check index usage
SELECT * FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_%_user_created';
```

## 📋 Activity Sources

| Source | Table | Timestamp Column | Description |
|--------|-------|------------------|-------------|
| Borrow Requests | books_borrowrequest | requested_at | New borrow requests |
| Approved Borrows | books_borrowrequest | processed_at | Books checked out |
| Returned Books | books_borrowrequest | processed_at | Books returned |
| Renewals | books_borrowrequest | last_renewed_at | Renewal activity |
| Fine Payments | books_finepayment | created_at | Fine payment activity |
| Reservations | books_reservation | created_at | Book reservations |

## 🔐 Permissions

### Who Can Access?
- ✅ Librarians (role='LIBRARIAN')
- ✅ Admins (role='ADMIN')
- ✅ Staff (role='STAFF')
- ✅ Working Students (is_working_student=true)
- ❌ Regular Students
- ❌ Teachers
- ❌ Unauthenticated users

### Check User Permission
```python
from books.views import is_circulation_staff

if is_circulation_staff(request.user):
    # User can access metric
    pass
```

## 📦 Files Modified

```
backend/
├── books/
│   ├── migrations/
│   │   └── 0028_active_students_metric.py  ← New migration
│   ├── views.py                             ← Added ActiveStudentsMetricView
│   └── urls.py                              ← Added route
├── ACTIVE_STUDENTS_METRIC.md               ← Full documentation
└── ACTIVE_STUDENTS_IMPLEMENTATION.md       ← Implementation summary

frontend/
└── app/
    └── librarian/
        └── page.tsx                         ← Added dashboard card
```

## 🔄 Rollback

```bash
# Rollback migration
python manage.py migrate books 0027_book_description

# This removes:
# - PostgreSQL function
# - Database view
# - Performance indexes
```

## 📞 Support

**Documentation:**
- Full guide: `backend/ACTIVE_STUDENTS_METRIC.md`
- Implementation: `ACTIVE_STUDENTS_IMPLEMENTATION.md`
- This reference: `ACTIVE_STUDENTS_QUICK_REFERENCE.md`

**Common Issues:**
1. Migration fails → Check PostgreSQL version (requires 9.5+)
2. Permission denied → Verify user role (must be circulation staff)
3. Zero results → Check student data and activity records
4. Slow queries → Run ANALYZE on tables, check index usage

## ✅ Testing Checklist

- [ ] Migration applied successfully
- [ ] SQL function returns correct count
- [ ] API endpoint accessible with auth
- [ ] Dashboard card displays count
- [ ] Permissions enforced correctly
- [ ] Different time windows work (7, 30, 90 days)
- [ ] Indexes created and used
- [ ] Performance acceptable (<100ms)
