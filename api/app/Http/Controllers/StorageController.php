<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StorageController extends Controller
{
    /**
     * Serve files directly from storage/app/public
     * This bypasses the need for symlinks
     * 
     * @param Request $request
     * @param string $path The file path relative to storage/app/public (can include nested directories)
     * @return BinaryFileResponse
     */
    public function serve(Request $request, string $path): BinaryFileResponse
    {
        // Normalize the path (remove any leading/trailing slashes and resolve any .. attempts)
        $path = trim($path, '/');
        
        // Security check: prevent directory traversal attacks
        if (str_contains($path, '..')) {
            abort(404);
        }
        
        // Check if file exists
        if (!Storage::disk('public')->exists($path)) {
            abort(404);
        }
        
        // Get the full file path
        $fullPath = Storage::disk('public')->path($path);
        $storagePath = Storage::disk('public')->path('');
        
        // Additional security check: ensure the resolved path is within the storage directory
        $realFullPath = realpath($fullPath);
        $realStoragePath = realpath($storagePath);
        
        if (!$realFullPath || !$realStoragePath || !str_starts_with($realFullPath, $realStoragePath)) {
            abort(404);
        }
        
        // Return the file with appropriate headers
        return response()->file($realFullPath);
    }
}

