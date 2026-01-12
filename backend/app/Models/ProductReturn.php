<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductReturn extends BaseModel
{
    protected $table = 'returns';

    protected $fillable = [
        'tenant_id',
        'type',
        'sale_id',
        'supplier_id',
        'product_id',
        'quantity',
        'reason',
        'amount',
        'status',
        'user_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'amount' => 'decimal:2',
    ];

    /**
     * العلاقة مع المنتج
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * العلاقة مع البيع (للـ customer returns)
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * العلاقة مع المستخدم
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
