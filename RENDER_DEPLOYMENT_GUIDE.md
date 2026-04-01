# Render Deployment Guide

Use this guide if you want the backend on Render, especially on the free plan.

## What This Repo Now Supports

- A Render Blueprint at [`render.yaml`](/c:/Users/lylep/Desktop/library%20system/render.yaml)
- Automatic Render hostname support in Django settings
- `DATABASE_URL` support for Render Postgres
- A non-interactive admin bootstrap command for free Render deployments:
  `python manage.py ensure_admin_user`

## Important Free-Plan Limits

As of April 1, 2026, Render's free plan has limits that affect this backend:

- Free web services spin down after 15 minutes of inactivity.
- Free web services have no persistent disk.
- Free web services have no shell access.
- Free web services cannot send SMTP traffic on ports `25`, `465`, or `587`.
- Free Render Postgres expires 30 days after creation.

That means:

- Uploaded avatars and book cover files will be lost whenever the service redeploys, restarts, or spins down.
- Gmail SMTP and most SMTP-based email flows will not work on the free plan.
- Registration email verification, login OTP email delivery, and password reset email delivery are not suitable for free Render unless you add a non-SMTP email provider or move to a paid plan.

## Recommended Use On Free Render

Use free Render for demo or evaluation only.

For the smoothest demo:

- Bootstrap an admin account during deploy with `DJANGO_SUPERUSER_*` environment variables.
- Log in with that admin account and create any demo librarian or student accounts manually.
- Avoid relying on email-based registration, login OTP, and password reset while on free Render.
- Avoid uploading new media you need to keep.

## Deploy Steps

### 1. Push the repository

```bash
cd "c:\Users\lylep\Desktop\library system"
git add .
git commit -m "Add Render deployment support"
git push origin main
```

### 2. Create the Blueprint on Render

- Sign in to Render
- Create a new Blueprint instance from your GitHub repository
- Render will detect [`render.yaml`](/c:/Users/lylep/Desktop/library%20system/render.yaml)

### 3. Provide the required prompted variables

Render will prompt for these because they are marked `sync: false`:

- `LIBRARY_WEB_URL`
- `PASSWORD_RESET_WEB_URL`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `DJANGO_SUPERUSER_USERNAME`
- `DJANGO_SUPERUSER_PASSWORD`
- `DJANGO_SUPERUSER_EMAIL` (optional but recommended)

Suggested values:

```env
LIBRARY_WEB_URL=https://your-frontend.vercel.app
PASSWORD_RESET_WEB_URL=https://your-frontend.vercel.app/forgot-password
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-backend.onrender.com,https://your-frontend.vercel.app
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=change-this-password
DJANGO_SUPERUSER_EMAIL=admin@example.com
```

### 4. Let Render deploy

The Blueprint already configures:

- Python 3.12.6
- the backend root directory
- `collectstatic`
- database migrations
- admin bootstrap
- Gunicorn startup
- `/api/health/` as the health check

### 5. Test the backend

- Open `https://your-backend.onrender.com/api/health/`
- Open `https://your-backend.onrender.com/admin/`
- Log in with the `DJANGO_SUPERUSER_*` credentials you supplied

## Manual Deploy Alternative

If you do not want to use the Blueprint, create a Python web service manually with:

- Root Directory: `backend`
- Build Command:

```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput
```

- Pre-Deploy Command:

```bash
python manage.py migrate && python manage.py ensure_admin_user
```

- Start Command:

```bash
gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
```

Required environment variables:

```env
DEBUG=False
SECRET_KEY=<generate-a-random-value>
DATABASE_URL=<from-render-postgres>
USE_X_FORWARDED_PROTO=true
SERVE_MEDIA_FILES=true
MEDIA_ROOT=/tmp/salazar-library-media
DB_CONN_MAX_AGE=60
DB_CONN_HEALTH_CHECKS=true
LIBRARY_WEB_URL=https://your-frontend.vercel.app
PASSWORD_RESET_WEB_URL=https://your-frontend.vercel.app/forgot-password
CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-backend.onrender.com,https://your-frontend.vercel.app
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=change-this-password
DJANGO_SUPERUSER_EMAIL=admin@example.com
```

## If You Need Production Stability

Free Render is not a good production target for this backend because of:

- 30-day database expiry
- no persistent media storage
- no SMTP on the free web service
- no shell access

For production, move to:

- a paid Render web service with persistent disk and an API-based email provider, or
- Railway or another host that supports persistent media and operational access more cleanly for Django.
