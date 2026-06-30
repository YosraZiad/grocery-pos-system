<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesReturn extends BaseModel
{
    protected $fillable = [
        'tenant_id',
        'return_number',
        'sale_id',
        'user_id',
        'subtotal',
        'discount_amount',
        'refund_total',
        'refund_method',
        'status',
        'reason',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'refund_total' => 'decimal:2',
    ];

    /**
     * العلاقة مع الفاتورة الأصلية
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * العلاقة مع المستخدم الكاشير
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * العلاقة مع عناصر المرتجع
     */
    public function items(): HasMany
    {
        return $this->hasMany(SalesReturnItem::class);
    }
}
