<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('inspector_form_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inspector_form_id')->constrained('inspector_forms')->onDelete('cascade');
            $table->text('note');
            $table->integer('order')->default(0);
            $table->timestamps();
            
            $table->index('inspector_form_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspector_form_notes');
    }
};

