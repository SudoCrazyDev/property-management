<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminPunchlistRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_punchlist_id',
        'room_name',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
        ];
    }

    public function adminPunchlist(): BelongsTo
    {
        return $this->belongsTo(AdminPunchlist::class);
    }

    public function rows(): HasMany
    {
        return $this->hasMany(AdminPunchlistRow::class)->orderBy('order');
    }
}

