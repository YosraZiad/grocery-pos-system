<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesReturnItem extends Model
{
    protected $fillable = [
        'sales_return_id',
        'product_id',
        'sale_item_id',
        'return_quantity',
        'price',
        'subtotal',
    ];

    protected $casts = [
        'return_quantity' => 'integer',
        'price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    /**
     * العلاقة مع فاتورة المرتجع
     */
    public function salesReturn(): BelongsTo
    {
        return $this->belongsTo(SalesReturn::class, 'sales_return_id');
    }

    /**
     * العلاقة مع المنتج
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * العلاقة مع عنصر البيع الأصلي
     */
    public function saleItem(): BelongsTo
    {
        return $this->belongsTo(SaleItem::class, 'sale_item_id');
    }
}
