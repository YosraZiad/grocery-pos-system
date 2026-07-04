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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('sales_return_id')->nullable()->constrained('sales_returns')->onDelete('cascade');
            $table->string('code')->unique();
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('active'); // active, redeemed
            $table->timestamp('redeemed_at')->nullable();
            $table->foreignId('redeemed_sale_id')->nullable()->constrained('sales')->onDelete('set null');
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
