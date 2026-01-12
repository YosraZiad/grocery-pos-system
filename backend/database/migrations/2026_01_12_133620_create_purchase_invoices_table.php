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
        Schema::create('purchase_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained()->onDelete('cascade');
            $table->string('invoice_number')->unique();
            $table->decimal('total', 10, 2);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('balance', 10, 2); // المتبقي (total - paid_amount)
            $table->date('date');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // المستخدم الذي أنشأ الفاتورة
            $table->timestamps();
            
            $table->index('tenant_id');
            $table->index('supplier_id');
            $table->index('invoice_number');
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_invoices');
    }
};
