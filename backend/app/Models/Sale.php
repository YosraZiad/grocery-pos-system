<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends BaseModel
{
    protected $fillable = [
        'tenant_id',
        'invoice_number',
        'user_id',
        'total',
        'discount',
        'discount_type',
        'payment_method',
        'status',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'discount' => 'decimal:2',
    ];

    /**
     * العلاقة مع المستخدم
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * العلاقة مع عناصر البيع
     */
    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * توليد رقم فاتورة تلقائي
     */
    public static function generateInvoiceNumber(): string
    {
        $date = now()->format('Ymd');
        $lastSale = self::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        if ($lastSale) {
            $lastNumber = (int) substr($lastSale->invoice_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return 'INV-' . $date . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
