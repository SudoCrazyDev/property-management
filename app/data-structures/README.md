# Data Structures for Laravel Migration

This folder contains data structure definitions for database tables that will be migrated to Laravel.

## Inspector Forms

### Tables

1. **inspector_forms** - Main table for Inspector Forms
   - `id` (bigIncrements, primary key)
   - `date` (date, required)
   - `uploader_id` (foreign key to users, required)
   - `project_address` (string, 500 chars, required)
   - `created_at`, `updated_at` (timestamps)

2. **inspector_form_notes** - Notes for Inspector Forms (one-to-many)
   - `id` (bigIncrements, primary key)
   - `inspector_form_id` (foreign key to inspector_forms, cascade delete)
   - `note` (text, required)
   - `order` (integer, default 0)
   - `created_at`, `updated_at` (timestamps)

3. **inspector_form_videos** - Videos for Inspector Forms (one-to-many)
   - `id` (bigIncrements, primary key)
   - `inspector_form_id` (foreign key to inspector_forms, cascade delete)
   - `file_path` (string, 500 chars, required)
   - `file_name` (string, 255 chars, required)
   - `file_size` (unsignedBigInteger, nullable)
   - `mime_type` (string, 100 chars, nullable)
   - `order` (integer, default 0)
   - `created_at`, `updated_at` (timestamps)

4. **inspector_form_images** - Images for Inspector Forms (one-to-many)
   - `id` (bigIncrements, primary key)
   - `inspector_form_id` (foreign key to inspector_forms, cascade delete)
   - `file_path` (string, 500 chars, required)
   - `file_name` (string, 255 chars, required)
   - `file_size` (unsignedBigInteger, nullable)
   - `mime_type` (string, 100 chars, nullable)
   - `order` (integer, default 0)
   - `created_at`, `updated_at` (timestamps)

## Usage

Each JSON file contains:
- Table structure definition
- Field definitions with types, constraints, and descriptions
- Foreign key relationships
- Indexes
- Laravel migration code snippets

To create Laravel migrations:
1. Use the `laravel_migration.up` array as a reference
2. Create migration files using `php artisan make:migration`
3. Copy the migration code from the JSON files

## Laravel Model Relationships

```php
// InspectorForm.php
public function uploader() {
    return $this->belongsTo(User::class, 'uploader_id');
}

public function notes() {
    return $this->hasMany(InspectorFormNote::class);
}

public function videos() {
    return $this->hasMany(InspectorFormVideo::class);
}

public function images() {
    return $this->hasMany(InspectorFormImage::class);
}
```

