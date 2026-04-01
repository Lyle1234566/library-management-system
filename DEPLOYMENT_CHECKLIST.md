# Quick Deployment Checklist

Use this as the production deployment checklist for the library system.

## Before You Start

### 1. Push the code to GitHub

```bash
cd "c:\Users\lylep\Desktop\library system"
git add .
git commit -m "Prepare for deployment"
git push origin main
```

If the project root is not already a Git repository, initialize it first or split backend and frontend into separate repositories before using the GitHub deploy flow.

### 2. Generate a Django secret key

```bash
cd backend
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Copy the output. You will need it for Railway.

## Railway Backend

### Setup

- [ ] Create an account at https://railway.app
- [ ] Create a new project from GitHub
- [ ] Select this repository
- [ ] Set the service Root Directory to `backend`
- [ ] In Networking, generate a public domain before adding `RAILWAY_PUBLIC_DOMAIN`-based variables
- [ ] Add PostgreSQL
- [ ] Add a persistent volume mounted at `/data`
- [ ] Leave the repo-root [`railway.json`](/c:/Users/lylep/Desktop/library%20system/railway.json) file in place so Railway picks up the backend deploy config automatically

### Environment Variables

Add these in the Railway backend service:

```env
SECRET_KEY=<paste-generated-key-here>
DEBUG=False
DJANGO_ALLOWED_HOSTS=${{RAILWAY_PUBLIC_DOMAIN}}
CSRF_TRUSTED_ORIGINS=https://${{RAILWAY_PUBLIC_DOMAIN}},https://your-project.vercel.app
USE_X_FORWARDED_PROTO=true
SERVE_MEDIA_FILES=true
MEDIA_ROOT=/data/media
STATIC_ROOT=/app/staticfiles
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_CONN_MAX_AGE=60
DB_CONN_HEALTH_CHECKS=true
CORS_ALLOWED_ORIGINS=https://your-project.vercel.app
LIBRARY_WEB_URL=https://your-project.vercel.app
PASSWORD_RESET_WEB_URL=https://your-project.vercel.app/forgot-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=true
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
LATE_FEE_PER_DAY=100.00
```

Notes:
- Railway healthchecks are allowed automatically by Django when `RAILWAY_PUBLIC_DOMAIN` is present.
- The service will fail fast if the `/data` volume is missing because the Railway config requires it.

### Deploy

- [ ] Deploy the service
- [ ] Wait for the logs to show `check --deploy`, `migrate`, `collectstatic`, and Gunicorn startup
- [ ] Confirm the domain URL looks like `https://abc123.up.railway.app` or your custom Railway domain

### Database Setup

- [ ] Open the Railway shell for the backend service
- [ ] Run:

```bash
python manage.py createsuperuser
```

### Test

- [ ] Open `https://your-backend.railway.app/api/health/`
- [ ] Confirm `services.database` is `ok`
- [ ] Confirm `services.media_storage` is `ok`
- [ ] Open `https://your-backend.railway.app/admin`
- [ ] Confirm the Django admin login page loads

## Vercel Frontend

### Setup

- [ ] Create an account at https://vercel.com
- [ ] Create a project from GitHub
- [ ] Select this repository
- [ ] Set the Root Directory to `frontend`

### Environment Variables

Add this in Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

Optional:

```env
NEXT_PUBLIC_MEDIA_HOSTS=https://media.your-domain.com
```

### Deploy

- [ ] Deploy the frontend
- [ ] Copy the Vercel URL

### Update Backend CORS

Update the Railway backend service variables:

```env
CORS_ALLOWED_ORIGINS=https://your-project.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-backend.railway.app,https://your-project.vercel.app
LIBRARY_WEB_URL=https://your-project.vercel.app
PASSWORD_RESET_WEB_URL=https://your-project.vercel.app/forgot-password
```

- [ ] Save the variables and let Railway redeploy

### Test

- [ ] Open `https://your-project.vercel.app`
- [ ] Confirm the homepage loads
- [ ] Log in with the superuser to verify frontend-to-backend connectivity

## Post-Deployment

### Seed basic data

- [ ] Add categories
- [ ] Add 5 to 10 books with cover images
- [ ] Create test librarian and student users

### Run a smoke test

- [ ] Register a student
- [ ] Approve the account in admin
- [ ] Search and browse books
- [ ] Submit a borrow request
- [ ] Approve the borrow request
- [ ] Submit a return request
- [ ] Approve the return request
- [ ] Upload a cover image and verify it still exists after a redeploy
- [ ] Trigger a password reset and verify the link opens the deployed frontend

## Common Issues

### Railway app fails to start

Check Railway deployment logs first. Typical causes:

- Missing environment variables
- Domain not generated before using `RAILWAY_PUBLIC_DOMAIN`
- Missing `/data` volume
- Database variables not connected to the PostgreSQL service

### CORS errors

- Confirm `CORS_ALLOWED_ORIGINS` includes the exact Vercel URL
- Use `https://`, not `http://`
- Do not include a trailing slash

### Uploaded images disappear after redeploy

- Confirm the volume is mounted to `/data`
- Confirm `MEDIA_ROOT=/data/media`
- Re-upload one test image and redeploy again

### Frontend cannot log in

- Confirm `NEXT_PUBLIC_API_URL` ends with `/api`
- Confirm the Railway backend is healthy
- Confirm the frontend origin is present in `CORS_ALLOWED_ORIGINS`

## Save These URLs

```text
Frontend: https://your-project.vercel.app
Backend: https://your-backend.railway.app
Admin: https://your-backend.railway.app/admin
API: https://your-backend.railway.app/api
```

## Demo Accounts

Create demo accounts in the admin panel:

- Admin: `admin / admin123`
- Librarian: `librarian@test.com / test123`
- Student: `student@test.com / test123`

## Estimated Time

- Railway backend: 15 minutes
- Vercel frontend: 10 minutes
- Testing and seed data: 15 minutes
- Total: about 40 minutes
