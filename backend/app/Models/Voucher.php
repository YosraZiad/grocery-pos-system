<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Voucher extends BaseModel
{
    protected $fillable = [
        'tenant_id',
        'customer_id',
        'sales_return_id',
        'code',
        'amount',
        'status',
        'redeemed_at',
        'redeemed_sale_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'redeemed_at' => 'datetime',
    ];

    /**
     * العلاقة مع العميل
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * العلاقة مع فاتورة المرتجع
     */
    public function salesReturn(): BelongsTo
    {
        return $this->belongsTo(SalesReturn::class, 'sales_return_id');
    }

    /**
     * العلاقة مع المبيعات التي استهلكت السند
     */
    public function redeemedSale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'redeemed_sale_id');
    }
}
