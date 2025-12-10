<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_punchlists', function (Blueprint $table) {
            $table->id();
            $table->string('address', 500);
            $table->date('date');
            $table->string('assigned_technician', 255)->nullable();
            $table->string('public_slug', 255)->unique();
            $table->timestamps();

            $table->index('date');
            $table->index('public_slug');
            $table->index('assigned_technician');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_punchlists');
    }
};

