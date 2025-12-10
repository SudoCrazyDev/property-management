<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminPunchlist extends Model
{
    use HasFactory;

    protected $fillable = [
        'address',
        'date',
        'assigned_technician',
        'public_slug',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(AdminPunchlistRoom::class)->orderBy('order');
    }

    public static function generateSlug(): string
    {
        do {
            $timestamp = now()->timestamp;
            $random = bin2hex(random_bytes(4));
            $slug = "punchlist-{$timestamp}-{$random}";
        } while (self::where('public_slug', $slug)->exists());

        return $slug;
    }
}

