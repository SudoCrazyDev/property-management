<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InspectorForm extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'date',
        'uploader_id',
        'project_address',
        'public_slug',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    /**
     * Note: uploader_id is stored as a string identifier.
     * It may reference a user ID, UUID, name, or any other identifier.
     * No direct relationship is defined since it's not a foreign key.
     */

    /**
     * Get the notes for this form.
     */
    public function notes(): HasMany
    {
        return $this->hasMany(InspectorFormNote::class)->orderBy('order');
    }

    /**
     * Get the videos for this form.
     */
    public function videos(): HasMany
    {
        return $this->hasMany(InspectorFormVideo::class)->orderBy('order');
    }

    /**
     * Get the images for this form.
     */
    public function images(): HasMany
    {
        return $this->hasMany(InspectorFormImage::class)->orderBy('order');
    }

    /**
     * Generate a unique public slug.
     */
    public static function generateSlug(): string
    {
        do {
            $timestamp = now()->timestamp;
            $random = bin2hex(random_bytes(4));
            $slug = "form-{$timestamp}-{$random}";
        } while (self::where('public_slug', $slug)->exists());

        return $slug;
    }
}

