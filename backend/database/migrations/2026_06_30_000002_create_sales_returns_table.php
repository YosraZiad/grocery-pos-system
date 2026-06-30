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
        Schema::create('sales_returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('return_number')->unique();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('restrict');
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('refund_total', 10, 2);
            $table->string('refund_method'); // cash, card, transfer, hybrid
            $table->string('status')->default('completed'); // completed, cancelled
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('sale_id');
            $table->index('user_id');
            $table->index('return_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_returns');
    }
};
