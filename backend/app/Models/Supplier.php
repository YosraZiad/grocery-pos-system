<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends BaseModel
{
    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'email',
        'address',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    /**
     * العلاقة مع فواتير الشراء
     */
    public function purchaseInvoices(): HasMany
    {
        return $this->hasMany(PurchaseInvoice::class);
    }

    /**
     * حساب إجمالي الديون من جميع الفواتير
     */
    public function calculateTotalBalance(): float
    {
        return $this->purchaseInvoices()
            ->sum('balance');
    }
}
