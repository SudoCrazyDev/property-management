# Environment Variables Setup

## Important Configuration

Your `api/.env` file should have:

```env
# Backend URL (where Laravel API runs)
APP_URL=http://localhost:8000

# Frontend URL (where React app runs)  
FRONTEND_URL=http://localhost:5173

# File storage disk
FILESYSTEM_DISK=public
```

## Why Two URLs?

- **APP_URL** (`http://localhost:8000`): 
  - Used for file storage URLs (where files are actually stored)
  - Used for API endpoints
  - **Must point to your Laravel backend**

- **FRONTEND_URL** (`http://localhost:5173`):
  - Used for generating public form URLs
  - Public forms are frontend routes, not backend routes
  - **Must point to your React frontend**

## Current Issue

If your `APP_URL` is set to `http://localhost:5173`, that's incorrect. It should be `http://localhost:8000`.

**Fix:**
1. Open `api/.env`
2. Change `APP_URL=http://localhost:5173` to `APP_URL=http://localhost:8000`
3. Add `FRONTEND_URL=http://localhost:5173`
4. Restart your Laravel server

## File Storage URLs

Files are stored on the backend and accessible via:
- `{APP_URL}/storage/inspector-forms/{form_id}/videos/...`
- `{APP_URL}/storage/inspector-forms/{form_id}/images/...`

These URLs will be stored in the database as full URLs (e.g., `http://localhost:8000/storage/...`)

## Public Form URLs

Public forms are accessed via:
- `{FRONTEND_URL}/public/form/{slug}`

This is a frontend route that calls the backend API.

