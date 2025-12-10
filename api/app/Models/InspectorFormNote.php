<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectorFormNote extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'inspector_form_id',
        'note',
        'order',
    ];

    /**
     * Get the form that owns this note.
     */
    public function inspectorForm(): BelongsTo
    {
        return $this->belongsTo(InspectorForm::class);
    }
}

