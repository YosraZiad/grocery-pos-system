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
        Schema::table('products', function (Blueprint $table) {
            $table->text('description')->nullable()->after('barcode');
            $table->unsignedBigInteger('unit_id')->nullable()->after('description');
            $table->string('provider')->nullable()->after('unit_id');

            $table->index('unit_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['unit_id']);
            $table->dropColumn(['description', 'unit_id', 'provider']);
        });
    }
};
