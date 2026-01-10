<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

/**
 * Base Model مع Global Scope للمواد
 * يضمن أن كل Query تلقائيًا يفلتر حسب tenant_id
 */
class BaseModel extends Model
{
    /**
     * Global Scope للمواد - مهم جدًا
     * يضمن أن كل Query تلقائيًا يفلتر حسب tenant_id
     */
    protected static function booted()
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if ($tenantId = config('tenant_id')) {
                $builder->where('tenant_id', $tenantId);
            }
        });
    }
}
