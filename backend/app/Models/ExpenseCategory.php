<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpenseCategory extends BaseModel
{
    protected $fillable = [
        'tenant_id',
        'name',
        'description',
    ];

    /**
     * العلاقة مع المصروفات
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class, 'category_id');
    }
}
