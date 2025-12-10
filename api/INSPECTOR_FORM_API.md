# Inspector Form API Documentation

## Overview
This API handles Inspector Form creation and public form management. Forms can be created by authenticated users and then shared via public URLs where anyone can add notes, videos, and images.

## Database Migrations

Run the following migrations to set up the database tables:

```bash
php artisan migrate
```

This will create:
- `inspector_forms` - Main form table
- `inspector_form_notes` - Notes for forms
- `inspector_form_videos` - Videos for forms
- `inspector_form_images` - Images for forms

## API Endpoints

### Protected Routes (Requires Authentication)

#### Create Inspector Form
```
POST /api/inspector-forms
```

**Request Body:**
```json
{
  "date": "2024-01-15",
  "uploader_id": 1,
  "project_address": "123 Main Street, New York, NY 10001",
  "notes": ["Note 1", "Note 2"],
  "videos": [],
  "images": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "date": "2024-01-15",
    "uploader_id": 1,
    "project_address": "123 Main Street, New York, NY 10001",
    "public_slug": "form-1705320000-a1b2c3",
    "created_at": "2024-01-15T10:00:00.000000Z",
    "updated_at": "2024-01-15T10:00:00.000000Z"
  },
  "public_url": "http://localhost:8000/public/form/form-1705320000-a1b2c3"
}
```

#### Get Inspector Form by ID
```
GET /api/inspector-forms/{id}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "date": "2024-01-15",
    "uploader": { ... },
    "notes": [ ... ],
    "videos": [ ... ],
    "images": [ ... ]
  }
}
```

### Public Routes (No Authentication Required)

#### Get Public Form by Slug
```
GET /api/public/inspector-forms/{slug}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "date": "2024-01-15",
    "uploader": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "project_address": "123 Main Street, New York, NY 10001",
    "notes": ["Note 1", "Note 2"],
    "videos": [
      {
        "id": 1,
        "file_path": "/storage/inspector-forms/1/videos/video.mp4",
        "file_name": "video.mp4"
      }
    ],
    "images": [
      {
        "id": 1,
        "file_path": "/storage/inspector-forms/1/images/image.jpg",
        "file_name": "image.jpg"
      }
    ]
  }
}
```

#### Update Notes
```
POST /api/public/inspector-forms/{slug}/notes
```

**Request Body:**
```json
{
  "notes": ["Updated note 1", "New note 2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notes updated successfully.",
  "data": ["Updated note 1", "New note 2"]
}
```

#### Upload Videos
```
POST /api/public/inspector-forms/{slug}/videos
```

**Request:** Multipart form data
- `videos[]`: Array of video files (mp4, avi, mov, wmv, flv, webm)
- Max file size: 100MB per file

**Response:**
```json
{
  "success": true,
  "message": "Videos uploaded successfully.",
  "data": [
    {
      "id": 1,
      "file_path": "/storage/inspector-forms/1/videos/video.mp4",
      "file_name": "video.mp4"
    }
  ]
}
```

#### Upload Images
```
POST /api/public/inspector-forms/{slug}/images
```

**Request:** Multipart form data
- `images[]`: Array of image files (jpeg, jpg, png, gif, webp)
- Max file size: 10MB per file

**Response:**
```json
{
  "success": true,
  "message": "Images uploaded successfully.",
  "data": [
    {
      "id": 1,
      "file_path": "/storage/inspector-forms/1/images/image.jpg",
      "file_name": "image.jpg"
    }
  ]
}
```

## Storage Configuration

Files are stored in:
- Videos: `storage/app/public/inspector-forms/{form_id}/videos/`
- Images: `storage/app/public/inspector-forms/{form_id}/images/`

**Important:** Full URLs are stored in the database (not just paths). This allows easy migration to different storage providers (S3, Cloudflare R2, etc.) in the future. When switching storage providers, you only need to update the URL generation logic in the controllers.

Make sure to create a symbolic link:
```bash
php artisan storage:link
```

### Switching Storage Providers

To switch to a different storage provider (e.g., S3):

1. Update `config/filesystems.php` to configure your storage disk
2. Modify the upload methods in `PublicInspectorFormController` to generate URLs using your storage provider:
   ```php
   // For S3 example:
   $fullUrl = Storage::disk('s3')->url($path);
   ```
3. The database will automatically store the new URL format
4. Existing records with old URLs will continue to work (backward compatible)

## CORS Configuration

If you're making requests from a different origin (e.g., frontend on different port), you may need to configure CORS in `config/cors.php` or use Laravel Sanctum for authentication.

## Frontend Integration

The frontend uses the API client in `app/src/lib/api.js`. Make sure to set the `VITE_API_URL` environment variable:

```env
VITE_API_URL=http://localhost:8000/api
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["Error message"]
  }
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `422` - Validation Error
- `404` - Not Found
- `500` - Server Error

