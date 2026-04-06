# Cloudinary Integration for Book Cover Images

## Why Cloudinary?

- Free tier: 25GB storage, 25GB bandwidth/month
- No need for persistent volumes
- CDN for fast image delivery worldwide
- Automatic image optimization

## Setup Steps

### 1. Create Cloudinary Account

1. Go to https://cloudinary.com/users/register_free
2. Sign up for free account
3. Get your credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 2. Install Cloudinary Package

```bash
cd backend
pip install cloudinary django-cloudinary-storage
pip freeze > requirements.txt
```

### 3. Update Django Settings

Add to `backend/backend/settings.py`:

```python
# Add to INSTALLED_APPS (before 'django.contrib.staticfiles')
INSTALLED_APPS = [
    # ...
    'cloudinary_storage',
    'cloudinary',
    # ...
]

# Cloudinary Configuration
import cloudinary
import cloudinary.uploader
import cloudinary.api

CLOUDINARY_STORAGE = {
    'CLOUD_NAME': get_env_str('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': get_env_str('CLOUDINARY_API_KEY'),
    'API_SECRET': get_env_str('CLOUDINARY_API_SECRET'),
}

# Update STORAGES
STORAGES = {
    'default': {
        'BACKEND': 'cloudinary_storage.storage.MediaCloudinaryStorage',
    },
    'staticfiles': {
        'BACKEND': (
            'whitenoise.storage.CompressedManifestStaticFilesStorage'
            if ENABLE_PRODUCTION_SECURITY
            else 'django.contrib.staticfiles.storage.StaticFilesStorage'
        ),
    },
}
```

### 4. Add Environment Variables

**Railway:**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Local (.env):**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 5. Deploy

```bash
git add .
git commit -m "Add Cloudinary for media storage"
git push origin main
```

Railway will auto-deploy with the new configuration.

## Benefits

✅ No volume management needed
✅ Automatic CDN delivery
✅ Image optimization
✅ Free tier sufficient for most libraries
✅ Works on any hosting platform

## Testing

1. Upload a book cover in Django admin
2. Check Cloudinary dashboard - image should appear
3. Frontend should display the image via Cloudinary URL
