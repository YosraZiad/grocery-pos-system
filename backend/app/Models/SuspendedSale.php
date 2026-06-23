<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SuspendedSale extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'suspend_id',
        'note',
        'total',
        'discount',
        'discount_type',
        'items',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'discount' => 'decimal:2',
        'items' => 'array',
    ];

    /**
     * العلاقة مع الكاشير (المستخدم)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * توليد رقم تعليق يومي تسلسلي فريد
     */
    public static function generateSuspendId(): string
    {
        $date = now()->format('ymd'); // YYMMDD
        $tenantId = config('tenant_id');
        
        $query = self::whereDate('created_at', today())
            ->orderBy('id', 'desc');
            
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }
        
        $lastSuspended = $query->first();

        if ($lastSuspended) {
            $parts = explode('-', $lastSuspended->suspend_id);
            $lastNum = (int) end($parts);
            $newNum = $lastNum + 1;
        } else {
            $newNum = 1;
        }

        return 'SUS-' . $date . '-' . str_pad($newNum, 4, '0', STR_PAD_LEFT);
    }
}
