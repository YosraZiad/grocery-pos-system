<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * SaleItem Model
 * لا يحتاج tenant_id لأنه مرتبط بـ Sale الذي يحتوي على tenant_id
 */
class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'price',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    protected $appends = ['previously_returned_qty'];

    /**
     * العلاقة مع عناصر المرتجع
     */
    public function returnItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(SalesReturnItem::class, 'sale_item_id');
    }

    /**
     * حساب الكمية المرتجعة سابقاً
     */
    public function getPreviouslyReturnedQtyAttribute(): int
    {
        return $this->returnItems()->sum('return_quantity');
    }

    /**
     * العلاقة مع البيع
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * العلاقة مع المنتج
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
