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
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['customer', 'supplier']); // customer: إرجاع من زبون, supplier: إرجاع لمورّد
            $table->foreignId('sale_id')->nullable()->constrained()->onDelete('cascade'); // للـ customer returns
            $table->unsignedBigInteger('supplier_id')->nullable(); // للـ supplier returns (لاحقًا - سيتم إضافة constraint عند إنشاء suppliers table)
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->integer('quantity');
            $table->text('reason')->nullable();
            $table->decimal('amount', 10, 2); // المبلغ المرتجع
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // المستخدم الذي أنشأ المرتجع
            $table->timestamps();
            
            $table->index('tenant_id');
            $table->index('type');
            $table->index('sale_id');
            $table->index('product_id');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('returns');
    }
};
