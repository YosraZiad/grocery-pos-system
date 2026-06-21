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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // الكاشير الذي قام بالإجراء
            $table->string('action'); // نوع الإجراء (حذف، تعديل كمية، خصم، إلخ)
            $table->text('description'); // تفاصيل الإجراء
            $table->foreignId('admin_user_id')->nullable()->constrained('users')->onDelete('set null'); // المدير المعتمد للإجراء (إن وجد)
            $table->string('ip_address')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('user_id');
            $table->index('admin_user_id');
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
