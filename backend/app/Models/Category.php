<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends BaseModel
{
    protected $fillable = [
        'tenant_id',
        'name',
        'description',
    ];

    /**
     * العلاقة مع المنتجات
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
