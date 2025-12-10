<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_punchlist_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_punchlist_room_id')->constrained('admin_punchlist_rooms')->onDelete('cascade');
            $table->string('image_path', 500)->nullable();
            $table->string('image_name', 255)->nullable();
            $table->text('note')->nullable();
            $table->string('proof_of_completion_image_path', 500)->nullable();
            $table->string('proof_of_completion_image_name', 255)->nullable();
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->index('admin_punchlist_room_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_punchlist_rows');
    }
};

