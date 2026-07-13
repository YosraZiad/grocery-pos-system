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
            $table->foreignId('shift_id')->nullable()->constrained('shifts')->onDelete('set null');
        });

        Schema::table('sales_returns', function (Blueprint $table) {
            $table->foreignId('shift_id')->nullable()->constrained('shifts')->onDelete('set null');
        });

        // Backfill existing records
        $shifts = \DB::table('shifts')->get();
        foreach ($shifts as $shift) {
            $query = \DB::table('sales')
                ->where('user_id', $shift->user_id)
                ->where('created_at', '>=', $shift->opened_at);
            if ($shift->closed_at) {
                $query->where('created_at', '<=', $shift->closed_at);
            }
            $query->update(['shift_id' => $shift->id]);

            $queryRet = \DB::table('sales_returns')
                ->where('user_id', $shift->user_id)
                ->where('created_at', '>=', $shift->opened_at);
            if ($shift->closed_at) {
                $queryRet->where('created_at', '<=', $shift->closed_at);
            }
            $queryRet->update(['shift_id' => $shift->id]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_returns', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->dropColumn('shift_id');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->dropColumn('shift_id');
        });
    }
};
