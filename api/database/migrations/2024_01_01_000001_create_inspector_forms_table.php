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
        Schema::create('inspector_forms', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('uploader_id', 255);
            $table->string('project_address', 500);
            $table->string('public_slug', 255)->unique();
            $table->timestamps();
            
            $table->index('uploader_id');
            $table->index('date');
            $table->index('public_slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspector_forms');
    }
};

