<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'phone',
        'balance',
        'is_temporary',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'is_temporary' => 'boolean',
    ];

    /**
     * العلاقة مع السندات
     */
    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    /**
     * العلاقة مع المبيعات
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
