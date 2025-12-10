# Authentication Setup Guide

## Current Status

The API routes are currently **open** (no authentication required). This allows you to test the Inspector Form functionality immediately.

## Adding Authentication Later

When you're ready to add authentication, you have several options:

### Option 1: Laravel Sanctum (Recommended for SPA)

1. **Install Sanctum:**
   ```bash
   composer require laravel/sanctum
   php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
   php artisan migrate
   ```

2. **Update `config/auth.php`:**
   Add Sanctum guard:
   ```php
   'guards' => [
       'web' => [
           'driver' => 'session',
           'provider' => 'users',
       ],
       'sanctum' => [
           'driver' => 'sanctum',
           'provider' => 'users',
       ],
   ],
   ```

3. **Update `routes/api.php`:**
   ```php
   Route::middleware(['auth:sanctum'])->group(function () {
       Route::post('/inspector-forms', [InspectorFormController::class, 'store']);
       Route::get('/inspector-forms/{id}', [InspectorFormController::class, 'show']);
   });
   ```

4. **Update `app/src/lib/api.js`:**
   Add token to requests:
   ```javascript
   const token = localStorage.getItem('auth_token')
   if (token) {
       config.headers.Authorization = `Bearer ${token}`
   }
   ```

### Option 2: API Key Authentication

Create a simple middleware for API key authentication:

1. **Create Middleware:**
   ```bash
   php artisan make:middleware ApiKeyAuth
   ```

2. **Implement middleware** to check API key from header or query parameter

3. **Apply to routes:**
   ```php
   Route::middleware(['api.key'])->group(function () {
       // protected routes
   });
   ```

### Option 3: Custom Token Authentication

Implement your own token-based authentication system that matches your frontend auth.

## Testing Without Authentication

For now, you can test all endpoints without authentication. The `uploader_id` field still validates that the user exists in the database, but there's no authentication check.

