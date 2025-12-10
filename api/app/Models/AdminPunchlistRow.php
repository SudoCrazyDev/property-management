<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Facades\Storage;

class AdminPunchlistRow extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_punchlist_room_id',
        'image_path',
        'image_name',
        'note',
        'proof_of_completion_image_path',
        'proof_of_completion_image_name',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
        ];
    }

    public function adminPunchlistRoom(): BelongsTo
    {
        return $this->belongsTo(AdminPunchlistRoom::class);
    }

    /**
     * Get the full URL for the image file.
     * If image_path is already a URL, return it. Otherwise, convert path to URL.
     */
    protected function imageUrl(): Attribute
    {
        return Attribute::make(
            get: function ($value, $attributes) {
                $imagePath = $attributes['image_path'] ?? null;
                if (!$imagePath) {
                    return null;
                }
                
                // If it's already a full URL (starts with http:// or https://), return as is
                // This handles backward compatibility with existing data that has full URLs
                if (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://')) {
                    return $imagePath;
                }
                
                // Convert storage path to full URL
                $storageUrl = Storage::disk('public')->url($imagePath);
                
                // If Storage::url() already returns a full URL, use it as is
                if (str_starts_with($storageUrl, 'http://') || str_starts_with($storageUrl, 'https://')) {
                    return $storageUrl;
                }
                
                // Otherwise, prepend APP_URL to make it a full URL
                $backendUrl = env('APP_URL', 'http://localhost:8000');
                return rtrim($backendUrl, '/') . $storageUrl;
            }
        );
    }

    /**
     * Get the full URL for the proof of completion image file.
     * If proof_of_completion_image_path is already a URL, return it. Otherwise, convert path to URL.
     */
    protected function proofOfCompletionImageUrl(): Attribute
    {
        return Attribute::make(
            get: function ($value, $attributes) {
                $proofPath = $attributes['proof_of_completion_image_path'] ?? null;
                if (!$proofPath) {
                    return null;
                }
                
                // If it's already a full URL (starts with http:// or https://), return as is
                // This handles backward compatibility with existing data that has full URLs
                if (str_starts_with($proofPath, 'http://') || str_starts_with($proofPath, 'https://')) {
                    return $proofPath;
                }
                
                // Convert storage path to full URL
                $storageUrl = Storage::disk('public')->url($proofPath);
                
                // If Storage::url() already returns a full URL, use it as is
                if (str_starts_with($storageUrl, 'http://') || str_starts_with($storageUrl, 'https://')) {
                    return $storageUrl;
                }
                
                // Otherwise, prepend APP_URL to make it a full URL
                $backendUrl = env('APP_URL', 'http://localhost:8000');
                return rtrim($backendUrl, '/') . $storageUrl;
            }
        );
    }
}

