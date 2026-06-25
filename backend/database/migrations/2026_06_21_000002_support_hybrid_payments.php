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
        Schema::table('sales', function (Blueprint $table) {
            // تحويل حقل payment_method إلى string لدعم 'hybrid' وتجنب مشاكل SQLite/MySQL مع الـ ENUM
            $table->string('payment_method', 30)->default('cash')->change();
            
            // إضافة حقل لتخزين تفاصيل الدفع المختلط
            $table->json('payment_details')->nullable()->after('change_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn('payment_details');
            $table->enum('payment_method', ['cash', 'card', 'transfer'])->default('cash')->change();
        });
    }
};
