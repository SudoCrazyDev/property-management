<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectorFormVideo extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'inspector_form_id',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'order',
    ];

    /**
     * Get the form that owns this video.
     */
    public function inspectorForm(): BelongsTo
    {
        return $this->belongsTo(InspectorForm::class);
    }

    /**
     * Get the file URL (always returns full URL).
     * If file_path is already a URL, return it. Otherwise, convert path to URL.
     * Uses direct storage route instead of symlink.
     */
    public function getFileUrlAttribute(): string
    {
        // If it's already a full URL (starts with http:// or https://), return as is
        // This handles backward compatibility with existing data that has full URLs
        if (str_starts_with($this->file_path, 'http://') || str_starts_with($this->file_path, 'https://')) {
            return $this->file_path;
        }
        
        // Generate URL using direct storage route: /api/storage/{path}
        $backendUrl = env('APP_URL', 'http://localhost:8000');
        $apiPath = '/api/storage/' . ltrim($this->file_path, '/');
        
        return rtrim($backendUrl, '/') . $apiPath;
    }
}

