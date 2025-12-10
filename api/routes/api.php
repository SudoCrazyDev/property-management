<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InspectorFormController;
use App\Http\Controllers\PublicInspectorFormController;
use App\Http\Controllers\AdminPunchlistController;
use App\Http\Controllers\PublicAdminPunchlistController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Inspector Form Routes (Currently open - add authentication middleware later)
// TODO: Add authentication middleware when implementing auth system
Route::post('/inspector-forms', [InspectorFormController::class, 'store']);
Route::get('/inspector-forms/{id}', [InspectorFormController::class, 'show']);

// Public Inspector Form Routes (No authentication required)
Route::prefix('public/inspector-forms')->group(function () {
    Route::get('/{slug}', [PublicInspectorFormController::class, 'show']);
    Route::post('/{slug}/notes', [PublicInspectorFormController::class, 'updateNotes']);
    Route::post('/{slug}/videos', [PublicInspectorFormController::class, 'uploadVideos']);
    Route::post('/{slug}/images', [PublicInspectorFormController::class, 'uploadImages']);
});

// Admin Punchlist Routes (Currently open - add authentication middleware later)
Route::post('/admin-punchlists', [AdminPunchlistController::class, 'store']);
Route::get('/admin-punchlists/{id}', [AdminPunchlistController::class, 'show']);

// Public Admin Punchlist Routes (No authentication required)
Route::prefix('public/admin-punchlists')->group(function () {
    Route::get('/{slug}', [PublicAdminPunchlistController::class, 'show']);
    Route::post('/{slug}/rooms/{roomId}/rows/{rowId}/proof-of-completion', [PublicAdminPunchlistController::class, 'uploadProofOfCompletion']);
});

