<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseInvoice extends BaseModel
{
    protected $fillable = [
        'tenant_id',
        'supplier_id',
        'invoice_number',
        'total',
        'paid_amount',
        'balance',
        'date',
        'user_id',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance' => 'decimal:2',
        'date' => 'date',
    ];

    /**
     * العلاقة مع المورّد
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * العلاقة مع المستخدم
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * العلاقة مع عناصر الفاتورة
     */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     * توليد رقم فاتورة شراء تلقائي
     */
    public static function generateInvoiceNumber(): string
    {
        $date = now()->format('Ymd');
        $lastInvoice = self::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        if ($lastInvoice) {
            $lastNumber = (int) substr($lastInvoice->invoice_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return 'PUR-' . $date . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
