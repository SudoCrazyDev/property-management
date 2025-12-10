# Inspector Forms Setup Guide

## Quick Start

1. **Run Migrations**
   ```bash
   cd api
   php artisan migrate
   ```

2. **Create Storage Link** (for file uploads)
   ```bash
   php artisan storage:link
   ```

3. **Set Environment Variables**
   
   In your `api/.env` file, ensure:
   ```env
   APP_URL=http://localhost:8000
   FRONTEND_URL=http://localhost:5173
   FILESYSTEM_DISK=public
   ```
   
   **Important:**
   - `APP_URL` should be your **backend URL** (where Laravel runs, e.g., http://localhost:8000)
   - `FRONTEND_URL` should be your **frontend URL** (where React runs, e.g., http://localhost:5173)
   - File storage URLs will use `APP_URL` (backend)
   - Public form URLs will use `FRONTEND_URL` (frontend)

4. **Start Laravel Server**
   ```bash
   php artisan serve
   ```

## Frontend Setup

1. **Set API URL** in `app/.env`:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

2. **Start Frontend Dev Server**
   ```bash
   cd app
   npm run dev
   ```

## API Endpoints Summary

### Protected (Requires Auth)
- `POST /api/inspector-forms` - Create new form
- `GET /api/inspector-forms/{id}` - Get form by ID

### Public (No Auth Required)
- `GET /api/public/inspector-forms/{slug}` - Get form by public slug
- `POST /api/public/inspector-forms/{slug}/notes` - Update notes
- `POST /api/public/inspector-forms/{slug}/videos` - Upload videos
- `POST /api/public/inspector-forms/{slug}/images` - Upload images

## File Storage

Files are stored in:
- `storage/app/public/inspector-forms/{form_id}/videos/`
- `storage/app/public/inspector-forms/{form_id}/images/`

**Full URLs are stored in the database** (e.g., `http://localhost:8000/storage/inspector-forms/1/videos/video.mp4`), not just file paths. This makes it easy to switch storage providers (S3, Cloudflare R2, etc.) in the future - you only need to update the URL generation logic when uploading files.

Accessible via: `{APP_URL}/storage/inspector-forms/{form_id}/...`

## Testing

1. Create a form via the frontend at `/inspector-form`
2. Copy the generated public URL
3. Visit the public URL to add notes/videos/images
4. Check the database to verify data is saved

## Troubleshooting

### CORS Issues
If you encounter CORS errors, install Laravel CORS package or configure it in `config/cors.php`.

### File Upload Issues
- Ensure `storage/app/public` directory exists and is writable
- Run `php artisan storage:link` to create symbolic link
- Check file permissions: `chmod -R 775 storage`

### Authentication Issues
- Protected routes require Laravel Sanctum authentication
- Public routes work without authentication

