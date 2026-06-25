<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends BaseModel
{
    use HasFactory;
    protected $fillable = [
        'tenant_id',
        'invoice_number',
        'user_id',
        'total',
        'discount',
        'discount_type',
        'payment_method',
        'amount_received',
        'change_amount',
        'payment_details',
        'status',
    ];

    protected $casts = [
        'total' => 'decimal:2',
        'discount' => 'decimal:2',
        'amount_received' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'payment_details' => 'array',
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
        $tenantId = config('tenant_id');
        
        // البحث عن آخر فاتورة لنفس الـ tenant
        $query = self::whereDate('created_at', today())
            ->orderBy('id', 'desc');
            
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }
        
        $lastSale = $query->first();

        if ($lastSale) {
            $lastNumber = (int) substr($lastSale->invoice_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return 'INV-' . $date . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
