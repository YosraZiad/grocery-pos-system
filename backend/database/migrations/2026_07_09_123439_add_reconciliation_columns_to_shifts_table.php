<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->decimal('actual_cash', 12, 2)->nullable()->after('closing_float');
            $table->decimal('actual_card', 12, 2)->nullable()->after('actual_cash');
            $table->decimal('expected_cash', 12, 2)->nullable()->after('actual_card');
            $table->decimal('expected_card', 12, 2)->nullable()->after('expected_cash');
            $table->decimal('difference', 12, 2)->nullable()->after('expected_card');
            $table->decimal('total_sales', 12, 2)->nullable()->after('difference');
            $table->decimal('total_returns', 12, 2)->nullable()->after('total_sales');
            $table->text('notes')->nullable()->after('total_returns');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->dropColumn([
                'actual_cash',
                'actual_card',
                'expected_cash',
                'expected_card',
                'difference',
                'total_sales',
                'total_returns',
                'notes'
            ]);
        });
    }
};
