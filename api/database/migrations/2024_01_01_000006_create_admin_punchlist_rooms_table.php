<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_punchlist_rooms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_punchlist_id')->constrained('admin_punchlists')->onDelete('cascade');
            $table->string('room_name', 255);
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index('admin_punchlist_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_punchlist_rooms');
    }
};

