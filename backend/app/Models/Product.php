<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class Product extends BaseModel
{
    protected $fillable = [
        'tenant_id',
        'category_id',
        'name',
        'barcode',
        'purchase_price',
        'sale_price',
        'quantity',
        'expiry_date',
        'min_stock_alert',
        'min_expiry_alert',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'quantity' => 'integer',
        'expiry_date' => 'date',
        'min_stock_alert' => 'integer',
        'min_expiry_alert' => 'integer',
    ];

    /**
     * العلاقة مع القسم
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * التحقق من انخفاض المخزون
     */
    public function isLowStock(): bool
    {
        return $this->quantity <= $this->min_stock_alert;
    }

    /**
     * التحقق من قرب انتهاء الصلاحية
     */
    public function isExpiringSoon(): bool
    {
        if (!$this->expiry_date) {
            return false;
        }

        $daysUntilExpiry = Carbon::parse($this->expiry_date)->diffInDays(Carbon::now());
        return $daysUntilExpiry <= $this->min_expiry_alert && $daysUntilExpiry >= 0;
    }

    /**
     * التحقق من انتهاء الصلاحية
     */
    public function isExpired(): bool
    {
        if (!$this->expiry_date) {
            return false;
        }

        return Carbon::parse($this->expiry_date)->isPast();
    }
}
